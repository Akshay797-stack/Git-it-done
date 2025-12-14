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
        // Use client provided key first, fall back to server-side env var
        formData.append('api_key', openaiKey || process.env.API_KEY || '');
        formData.append('apply_fix', 'true');
        formData.append('create_pr', 'true');

        // Create Basic Auth header
        const kestraUser = process.env.KESTRA_EMAIL || "";
        const kestraPass = process.env.KESTRA_PASSWORD || "";

        console.log("Debug Auth Env:", {
            existsId: !!kestraUser,
            idLen: kestraUser.length,
            existsSecret: !!kestraPass,
            nodeEnv: process.env.NODE_ENV
        });

        const authHeader = 'Basic ' + Buffer.from(kestraUser + ':' + kestraPass).toString('base64');

        const kestraResponse = await fetch(kestraUrl, {
            method: 'POST',
            headers: {
                'Authorization': authHeader
            },
            body: formData
        });

        console.log("Kestra response status:", kestraResponse.status);

        if (!kestraResponse.ok) {
            const errorText = await kestraResponse.text();
            console.error("Kestra error body:", errorText);
            console.error("Kestra response headers:", Object.fromEntries(kestraResponse.headers.entries()));

            return NextResponse.json(
                { error: `Kestra error: ${kestraResponse.status}`, details: errorText },
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
