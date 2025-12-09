export const onRequestPut = async ({ request, env }) => {
  const { key } = new URL(request.url).searchParams;

  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  const data = await request.json();

  try {
    await env.EXPERIMENT_KV.put(key, JSON.stringify(data));
    return new Response("Saved", { status: 200 });
  } catch (err) {
    // Improved debugging: return more error info
    console.error("KV error", err);
    return new Response(
      JSON.stringify({
        message: "KV write failed",
        error: err?.message || String(err),
        stack: err?.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
