export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const method = request.method.toUpperCase();
  const user = await auth(request, env.SESSION_SECRET);
  if (!user) {
    if (method === 'HEAD') return new Response('', { status: 401 });
    return json('未登录', 401);
  }

  if (method === 'GET') {
    const data = await readData(env);
    return json(data);
  }
  if (method === 'POST') {
    const { name, api } = await request.json().catch(() => ({}));
    if (!name || !api || !/^https?:\/\//i.test(api)) return json('名称或 API 无效', 400);
    const data = await readData(env);
    const key = makeKey(name);
    data.api_site[key] = { name, api };
    await writeData(env, data);
    return json({ ok: true });
  }
  if (method === 'PUT') {
    const k = decodeURIComponent(new URL(request.url).pathname.split('/').pop() || '');
    const { name, api } = await request.json().catch(() => ({}));
    if (!k) return json('缺少键', 400);
    const data = await readData(env);
    if (!data.api_site[k]) return json('键不存在', 404);
    if (name) data.api_site[k].name = name;
    if (api) {
      if (!/^https?:\/\//i.test(api)) return json('API 无效', 400);
      data.api_site[k].api = api;
    }
    await writeData(env, data);
    return json({ ok: true });
  }
  if (method === 'DELETE') {
    const k = decodeURIComponent(new URL(request.url).pathname.split('/').pop() || '');
    const data = await readData(env);
    if (k && data.api_site[k]) delete data.api_site[k];
    await writeData(env, data);
    return json({ ok: true });
  }
  if (method === 'HEAD') {
    return new Response('', { status: 200 });
  }
  return new Response('method not allowed', { status: 405 });
};

type Env = { KV: KVNamespace; SESSION_SECRET: string };

function json(body: any, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json;charset=utf-8' } });
}

async function auth(req: Request, secret: string) {
  const cookie = req.headers.get('cookie') || '';
  const m = /(?:^|;\s*)session=([^;]+)/.exec(cookie);
  if (!m) return null;
  const token = m[1];
  try { return await verifyToken(token, secret); } catch { return null; }
}

async function verifyToken(token: string, secret: string) {
  const enc = new TextEncoder();
  const [header, body, sig] = token.split('.');
  if (!header || !body || !sig) throw new Error('bad');
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expectBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const expect = btoa(String.fromCharCode(...new Uint8Array(expectBuf)));
  if (expect !== sig) throw new Error('bad');
  const json = JSON.parse(atob(body));
  return json;
}

async function readData(env: Env) {
  const text = await env.KV.get('moontv:data');
  if (!text) return { cache_time: 7200, api_site: {} as Record<string, { name: string; api: string }> };
  try { return JSON.parse(text); } catch { return { cache_time: 7200, api_site: {} }; }
}

async function writeData(env: Env, data: any) {
  await env.KV.put('moontv:data', JSON.stringify(data));
}

function makeKey(name: string) {
  let base = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');
  if (!base) base = 'site';
  return base;
}


