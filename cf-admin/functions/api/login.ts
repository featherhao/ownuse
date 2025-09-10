export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const { username, password } = await ctx.request.json().catch(() => ({} as any));
    if (!username || !password) return json('用户名或密码缺失', 400);
    if (username !== ctx.env.ADMIN_USER || password !== ctx.env.ADMIN_PASS) return json('账号或密码错误', 401);
    const token = await signToken({ u: username, t: Date.now() }, ctx.env.SESSION_SECRET);
    const headers = new Headers({ 'content-type': 'text/plain' });
    headers.append('Set-Cookie', cookieSet('session', token, { httpOnly: true, sameSite: 'Lax', secure: true, path: '/', maxAge: 7 * 86400 }));
    return new Response('ok', { headers });
  } catch (e: any) {
    return json(e?.message || 'error', 500);
  }
};

type Env = { ADMIN_USER: string; ADMIN_PASS: string; SESSION_SECRET: string };

function json(body: any, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json;charset=utf-8' } });
}

async function signToken(payload: Record<string, any>, secret: string) {
  const enc = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${b64}`;
}

function cookieSet(name: string, value: string, opts: { httpOnly?: boolean; sameSite?: 'Lax'|'Strict'|'None'; secure?: boolean; path?: string; maxAge?: number }) {
  const parts = [`${name}=${value}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join('; ');
}


