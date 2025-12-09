export const onRequestPut = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return new Response("Missing key in query string", {
        status: 400,
        headers: { "Content-Type": "text/plain" }
      });
    }

    const data = await request.json();

    await env.EXPERIMENT_KV.put(key, JSON.stringify(data));

    return new Response("Saved", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    console.error("KV write error:", err);

    return new Response(
      JSON.stringify({
        message: "Failed to save experiment to KV",
        error: err?.message || String(err),
        stack: err?.stack || "No stack trace"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};
