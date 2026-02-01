import { createClient } from "@/utils/supabase/server";

export class GitHubService {
    private accessToken: string | null = null;

    constructor(accessToken?: string) {
        if (accessToken) {
            this.accessToken = accessToken;
        }
    }

    private async getAccessToken(userId: string) {
        if (this.accessToken) return this.accessToken;

        const supabase = createClient();
        const { data, error } = await supabase
            .from('github_tokens')
            .select('access_token')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            throw new Error("GitHub access token not found for user.");
        }
        this.accessToken = data.access_token;
        return this.accessToken;
    }

    async createPR(userId: string, repo: string, branch: string, title: string, body: string, files: { path: string, content: string }[]) {
        const token = await this.getAccessToken(userId);
        const [owner, name] = repo.split('/');

        // 1. Get default branch SHA
        const repoResponse = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!repoResponse.ok) {
            const err = await repoResponse.json();
            throw new Error(`GitHub Repo Fetch Failed: ${repoResponse.status} - ${JSON.stringify(err)}`);
        }
        const repoInfo = await repoResponse.json();
        const defaultBranch = repoInfo.default_branch;

        const refResponse = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${defaultBranch}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!refResponse.ok) {
            const err = await refResponse.json();
            throw new Error(`GitHub Ref Fetch Failed: ${refResponse.status} - ${JSON.stringify(err)}`);
        }
        const refInfo = await refResponse.json();
        const baseSha = refInfo.object.sha;

        // 2. Create new branch
        const branchResponse = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
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
            const contentResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${file.path}?ref=${branch}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const currentFile = await contentResponse.json();

            const putResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${file.path}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    message: `Agent: ${title}`,
                    content: Buffer.from(file.content).toString('base64'),
                    branch: branch,
                    sha: currentFile.sha || undefined
                })
            });
            if (!putResponse.ok) {
                const err = await putResponse.json();
                throw new Error(`File Update Failed: ${putResponse.status} - ${JSON.stringify(err)}`);
            }
        }

        // 4. Create PR
        const prResponse = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: title,
                body: body,
                head: branch,
                base: defaultBranch
            })
        });
        if (!prResponse.ok) {
            const err = await prResponse.json();
            throw new Error(`PR Creation Failed: ${prResponse.status} - ${JSON.stringify(err)}`);
        }
        return await prResponse.json();
    }
}
