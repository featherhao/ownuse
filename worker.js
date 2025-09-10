addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  const type = url.searchParams.get('type') // 新增 type 参数

  // 如果 type=api 并带 url，返回 Base58 编码文本
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

  // 否则返回 HTML 页面
  return new Response(getHtmlPage(targetUrl || ''), {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  })
}

// Base58 编码 JSON
async function fetchAndEncode(targetUrl) {
  let parsed
  try { parsed = new URL(targetUrl) } catch { throw new Error('Invalid URL') }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http/https allowed')

  const response = await fetch(parsed.toString())
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
  const json = await response.json()
  return base58Encode(JSON.stringify(json))
}

function base58Encode(str) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const bytes = new TextEncoder().encode(str)
  if (bytes.length === 0) return ''
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join(''))
  if (num === 0n) return ALPHABET[0]
  let result = ''
  while (num > 0n) {
    result = ALPHABET[Number(num % 58n)] + result
    num /= 58n
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result = ALPHABET[0] + result
  return result
}

// HTML 页面
function getHtmlPage(prefillUrl) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>JSON Base58 转换器</title>
<style>
body{font-family:Arial;margin:40px}input{width:100%;max-width:500px;padding:10px;margin-bottom:10px;font-size:16px}button{padding:5px 10px;margin-left:5px;font-size:14px;cursor:pointer}.result{margin-top:20px;word-break:break-all}pre{background:#f0f0f0;padding:10px;border-radius:5px;overflow-x:auto}.link-group{margin-bottom:10px}h2{color:#333}
</style>
</head>
<body>
<h1>JSON Base58 转换器</h1>
<h2>使用说明:</h2>
<ul>
<li>输入返回 JSON 的 URL，等待自动生成结果。</li>
<li>或直接在浏览器访问：<code>?url=你的JSON地址</code>，页面会自动显示转换结果。</li>
<li>结果包括原始地址、Worker 链接（?url=原始地址）以及转换后的 Base58 内容，并提供复制按钮。</li>
</ul>
<input id="urlInput" placeholder="请输入返回 JSON 的 URL" value="${prefillUrl}" />
<div class="result" id="result"></div>
<script>
const input=document.getElementById('urlInput');const resultDiv=document.getElementById('result');let timeoutId=null;

function createLink(url,text){const a=document.createElement('a');a.href=url;a.target='_blank';a.textContent=text;return a}
function createCopyButton(text){const btn=document.createElement('button');btn.textContent='复制';btn.onclick=()=>navigator.clipboard.writeText(text).then(()=>alert('已复制到剪贴板'));return btn}

async function updateLinks(){
const url=input.value.trim();resultDiv.textContent='';if(!url)return;

// 原始地址
const origDiv=document.createElement('div');origDiv.className='link-group';origDiv.appendChild(document.createElement('strong')).textContent='原始地址: ';origDiv.appendChild(createLink(url,url));resultDiv.appendChild(origDiv);

// Worker 链接
const workerUrl=window.location.origin+window.location.pathname+'?type=api&url='+encodeURIComponent(url);
const workerDiv=document.createElement('div');workerDiv.className='link-group';
workerDiv.appendChild(document.createElement('strong')).textContent='Worker 链接: ';
workerDiv.appendChild(createLink(workerUrl,workerUrl));
workerDiv.appendChild(createCopyButton(workerUrl));
resultDiv.appendChild(workerDiv);

// 拉取 Base58 内容
try{
const response=await fetch(workerUrl);
const encodedData=await response.text();
const preDiv=document.createElement('div');preDiv.className='link-group';
preDiv.appendChild(document.createElement('strong')).textContent='转换后的 Base58 内容:';
const pre=document.createElement('pre');pre.textContent=encodedData;preDiv.appendChild(pre);
resultDiv.appendChild(preDiv);
}catch(err){resultDiv.appendChild(document.createElement('br'));resultDiv.append('发生错误: '+err.message)}
}

input.addEventListener('input',()=>{clearTimeout(timeoutId);timeoutId=setTimeout(updateLinks,500)})

// 页面加载时自动生成
if("${prefillUrl}") updateLinks()
</script>
</body>
</html>`;
}
