// PUT = create or update
export const onRequestPut = async ({ request, env }) => {
  // Fix: use a valid base URL for parsing
  const url = new URL(request.url, 'http://localhost');
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  const data = await request.json();

  try {
    await env.EXPERIMENT_KV.put(key, JSON.stringify(data));
    return new Response("Saved", { status: 200 });
  } catch (err) {
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


// GET = list all experiments
export const onRequestGet = async ({ env }) => {
  try {
    const list = await env.EXPERIMENT_KV.list();
    const experiments = {};
    for (const key of list.keys.map(k => k.name)) {
      const value = await env.EXPERIMENT_KV.get(key, { type: 'json' });
      experiments[key] = value;
    }
    return new Response(JSON.stringify(experiments), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      message: "Failed to list experiments",
      error: err?.message || String(err)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// DELETE = remove a specific experiment
export const onRequestDelete = async ({ request, env }) => {
  const { key } = new URL(request.url).searchParams;
  if (!key) return new Response("Missing key", { status: 400 });

  try {
    await env.EXPERIMENT_KV.delete(key);
    return new Response("Deleted", { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({
      message: "Delete failed", error: err?.message || String(err)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
