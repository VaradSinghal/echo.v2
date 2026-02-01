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
        const repoInfo = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());
        const defaultBranch = repoInfo.default_branch;

        const baseSha = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${defaultBranch}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(j => j.object.sha);

        // 2. Create new branch
        await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha })
        });

        // 3. Create blob/commit for each file (simplified: one commit for all)
        // For simplicity in this MVP, we'll use the "create or update file contents" API for each file
        for (const file of files) {
            const currentFile = await fetch(`https://api.github.com/repos/${repo}/contents/${file.path}?ref=${branch}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json());

            await fetch(`https://api.github.com/repos/${repo}/contents/${file.path}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    message: `Agent: ${title}`,
                    content: Buffer.from(file.content).toString('base64'),
                    branch: branch,
                    sha: currentFile.sha || undefined
                })
            });
        }

        // 4. Create PR
        const pr = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: title,
                body: body,
                head: branch,
                base: defaultBranch
            })
        }).then(r => r.json());

        return pr;
    }
}
