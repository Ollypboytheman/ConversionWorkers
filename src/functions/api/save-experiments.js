export async function onRequestPut(context) {
  const key = context.request.url.split("?key=")[1];
  const data = await context.request.json();

  await context.env.EXPERIMENTS_KV.put(key, JSON.stringify(data));

  return new Response("Saved", { status: 200 });
}
