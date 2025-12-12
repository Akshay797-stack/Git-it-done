import { NextResponse } from "next/server";

const KESTRA_URL = process.env.KESTRA_URL || "http://localhost:8080";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { issueUrl, repoUrl, githubToken, openaiKey } = body;

        const cookies = req.headers.get('cookie') || '';

        const scheduleDate = new Date().toISOString();
        const kestraUrl = `${KESTRA_URL}/api/v1/main/executions/dev.autofix/ai-issue-autofix?scheduleDate=${encodeURIComponent(scheduleDate)}`;
        console.log("Calling Kestra:", kestraUrl);

        const formData = new FormData();
        formData.append('issue_url', issueUrl);
        formData.append('repo_url', repoUrl);
        formData.append('github_token', githubToken);
        // Use server-side env var first, fall back to client provided (if any)
        formData.append('openai_api_key', process.env.OPENAI_API_KEY || openaiKey || '');
        formData.append('apply_fix', 'true');
        formData.append('create_pr', 'true');

        const kestraResponse = await fetch(kestraUrl, {
            method: 'POST',
            headers: { 'Cookie': cookies },
            body: formData
        });

        console.log("Kestra response status:", kestraResponse.status);

        if (!kestraResponse.ok) {
            const errorText = await kestraResponse.text();
            console.error("Kestra error:", errorText);
            return NextResponse.json(
                { error: `Kestra error: ${kestraResponse.status}` },
                { status: kestraResponse.status }
            );
        }

        const data = await kestraResponse.json();
        console.log("Kestra success! Execution ID:", data.id);
        return NextResponse.json({ jobId: data.id, status: "started" });

    } catch (error: any) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to trigger workflow" },
            { status: 500 }
        );
    }
}
