const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwHZLM2DGtcGt6qXtI14RlMhjVk4l-j8-ffRSl2K2yTv3oRBsSHCbOqWrlf0Sxr5UteHw/exec";
export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = APPS_SCRIPT_URL + incoming.search;
  const init = { method: context.request.method, redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" } };
  if (context.request.method !== "GET" && context.request.method !== "HEAD") init.body = await context.request.text();
  try {
    const upstream = await fetch(target, init);
    const headers = new Headers(upstream.headers);
    headers.set("Cache-Control", "no-store");
    headers.set("Access-Control-Allow-Origin", incoming.origin);
    headers.set("Vary", "Origin");
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return Response.json({ ok:false, error:"SGS API is temporarily unavailable." }, { status:502 });
  }
}
