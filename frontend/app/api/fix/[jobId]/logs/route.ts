import axios from 'axios';

const KESTRA_URL = process.env.KESTRA_URL || "http://localhost:8080";

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;
    const cookies = req.headers.get('cookie') || '';

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            let lastLogIndex = 0;
            let checkCount = 0;

            const interval = setInterval(async () => {
                try {
                    checkCount++;

                    const statusRes = await axios.get(
                        `${KESTRA_URL}/api/v1/main/executions/${jobId}`,
                        { headers: { Cookie: cookies } }
                    );
                    const state = statusRes.data.state.current;

                    const logsRes = await axios.get(
                        `${KESTRA_URL}/api/v1/main/logs/${jobId}`,
                        { headers: { Cookie: cookies } }
                    );
                    const allLogs = logsRes.data || [];

                    if (allLogs.length > lastLogIndex) {
                        const newLogs = allLogs.slice(lastLogIndex);
                        for (const log of newLogs) {
                            const data = JSON.stringify({
                                timestamp: log.timestamp,
                                level: (log.level || 'INFO').toLowerCase(),
                                message: log.message
                            });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        }
                        lastLogIndex = allLogs.length;
                    }

                    if (["SUCCESS", "FAILED", "WARNING", "KILLED", "CANCELLED"].includes(state)) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: state, message: "Workflow finished" })}\n\n`));
                        clearInterval(interval);
                        controller.close();
                    }

                    if (checkCount > 600) {
                        clearInterval(interval);
                        controller.close();
                    }

                } catch (e: any) {
                    if (e.response?.status !== 404) {
                        console.error("Log polling error:", e.response?.status || e.message);
                    }
                }
            }, 1000);

            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
