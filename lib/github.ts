import { createServiceRoleClient } from "@/utils/supabase/service";

export class GitHubService {
    private accessToken: string | null = null;
    private supabase = createServiceRoleClient();

    constructor(accessToken?: string) {
        if (accessToken) {
            this.accessToken = accessToken;
        }
    }

    private async getAccessToken(userId: string) {
        if (this.accessToken) return this.accessToken;

        const { data, error } = await this.supabase
            .from('github_tokens')
            .select('access_token')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            throw new Error(`GitHub access token not found for user ${userId}.`);
        }
        this.accessToken = data.access_token;
        return this.accessToken;
    }

    private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error: any) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error(`GitHub API timeout: ${url}`);
            }
            throw error;
        }
    }

    async getRepoTree(userId: string, repo: string) {
        const token = await this.getAccessToken(userId);

        // Handle full URL or slug
        let fullRepo = repo;
        if (repo.includes('github.com/')) {
            fullRepo = repo.split('github.com/')[1].split('/').slice(0, 2).join('/');
        }

        // 1. Get default branch first (30s timeout)
        const repoResponse = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!repoResponse.ok) throw new Error(`Failed to fetch repo info for ${fullRepo}`);
        const { default_branch } = await repoResponse.json();

        // 2. Fetch recursive tree (60s timeout for large repos)
        const treeResponse = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}/git/trees/${default_branch}?recursive=1`, {
            headers: { Authorization: `Bearer ${token}` }
        }, 60000);
        if (!treeResponse.ok) throw new Error("Failed to fetch repo tree");
        const data = await treeResponse.json();

        // Filter for files only, return paths
        return data.tree
            .filter((item: any) => item.type === 'blob')
            .map((item: any) => item.path);
    }

    async getFileContent(userId: string, repo: string, path: string) {
        const token = await this.getAccessToken(userId);

        // Handle full URL or slug
        let fullRepo = repo;
        if (repo.includes('github.com/')) {
            fullRepo = repo.split('github.com/')[1].split('/').slice(0, 2).join('/');
        }

        const response = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}/contents/${path}`, {
            headers: { Authorization: `Bearer ${token}` }
        }, 45000);
        if (!response.ok) throw new Error(`Failed to fetch file: ${path} from ${fullRepo}`);
        const data = await response.json();
        return Buffer.from(data.content, 'base64').toString('utf8');
    }

    async createPR(userId: string, repo: string, branch: string, title: string, body: string, files: { path: string, content: string }[]) {
        const token = await this.getAccessToken(userId);

        // Handle full URL or slug
        let fullRepo = repo;
        if (repo.includes('github.com/')) {
            fullRepo = repo.split('github.com/')[1].split('/').slice(0, 2).join('/');
        }
        const [owner, name] = fullRepo.split('/');

        // 1. Get default branch SHA
        const repoResponse = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!repoResponse.ok) {
            const err = await repoResponse.json();
            throw new Error(`GitHub Repo Fetch Failed: ${repoResponse.status} - ${JSON.stringify(err)}`);
        }
        const repoInfo = await repoResponse.json();
        const defaultBranch = repoInfo.default_branch;

        const refResponse = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}/git/refs/heads/${defaultBranch}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!refResponse.ok) {
            const err = await refResponse.json();
            throw new Error(`GitHub Ref Fetch Failed: ${refResponse.status} - ${JSON.stringify(err)}`);
        }
        const refInfo = await refResponse.json();
        const baseSha = refInfo.object.sha;

        // 2. Create new branch
        const branchResponse = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}/git/refs`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha })
        });
        if (!branchResponse.ok) {
            const err = await branchResponse.json();
            console.warn(`Branch creation warning: ${branchResponse.status} - ${JSON.stringify(err)}`);
        }

        // 3. Create blob/commit for each file
        for (const file of files) {
            const contentResponse = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}/contents/${file.path}?ref=${branch}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const currentFile = await contentResponse.json();

            const putResponse = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}/contents/${file.path}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    message: `Agent: ${title}`,
                    content: Buffer.from(file.content).toString('base64'),
                    branch: branch,
                    sha: currentFile.sha || undefined
                })
            }, 60000);
            if (!putResponse.ok) {
                const err = await putResponse.json();
                throw new Error(`File Update Failed: ${putResponse.status} - ${JSON.stringify(err)}`);
            }
        }

        // 4. Create PR
        const prResponse = await this.fetchWithTimeout(`https://api.github.com/repos/${fullRepo}/pulls`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: title,
                body: body,
                head: branch,
                base: defaultBranch
            })
        }, 45000);
        if (!prResponse.ok) {
            const err = await prResponse.json();
            throw new Error(`PR Creation Failed: ${prResponse.status} - ${JSON.stringify(err)}`);
        }
        return await prResponse.json();
    }
}
