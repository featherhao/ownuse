addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  const type = url.searchParams.get('type')

  // type=api & url 有效 -> 返回 Base58 编码
  if (type === 'api' && targetUrl) {
    try {
      const encoded = await fetchAndEncode(targetUrl)
      return new Response(encoded, {
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 })
    }
  }

  // 否则返回 HTML 页面（直接重定向到前端页面）
  return Response.redirect('https://<你的Pages域名>/index.html?prefill=' + encodeURIComponent(targetUrl), 302)
}

// Base58 编码
async function fetchAndEncode(targetUrl) {
  const res = await fetch(targetUrl)
  if (!res.ok) throw new Error('Fetch failed: ' + res.status)
  const json = await res.json()
  return base58Encode(JSON.stringify(json))
}

function base58Encode(str) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const bytes = new TextEncoder().encode(str)
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join(''))
  let result = ''
  while (num > 0n) {
    result = ALPHABET[Number(num % 58n)] + result
    num /= 58n
  }
  return result || ALPHABET[0]
}
