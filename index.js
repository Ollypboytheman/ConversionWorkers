export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      })
    }

    if (request.method === "PUT" && url.pathname === "/api/experiment") {
      try {
        const { key, payload } = await request.json()

        if (!key || !payload) {
          return new Response("Missing key or payload", { status: 400 })
        }

        await env.EXPERIMENTS.put(key, JSON.stringify(payload))

        return new Response("Stored in KV", {
          headers: { "Access-Control-Allow-Origin": "*" },
        })
      } catch (err) {
        return new Response("Error: " + err.message, { status: 500 })
      }
    }

    return new Response("Not found", { status: 404 })
  },
}
