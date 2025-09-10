export const onRequestPost: PagesFunction = async () => {
  const headers = new Headers({ 'content-type': 'text/plain' });
  headers.append('Set-Cookie', `session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure`);
  return new Response('ok', { headers });
};


