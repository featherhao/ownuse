import { TOOLS } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // GET 获取工具列表
  if(request.method==='GET'){
    const list = await TOOLS.get('list') || '[]'
    return new Response(list, {headers:{'Content-Type':'application/json'}})
  }

  // POST 添加工具
  if(request.method==='POST'){
    try{
      const { name, url: toolUrl, password } = await request.json()
      if(password !== ADMIN_PASSWORD) return new Response('Unauthorized', {status:401})

      let list = JSON.parse(await TOOLS.get('list') || '[]')
      list.push({ name, url: toolUrl })
      await TOOLS.put('list', JSON.stringify(list))
      return new Response(JSON.stringify({ success:true, list }), {headers:{'Content-Type':'application/json'}})
    }catch(err){
      return new Response(JSON.stringify({ success:false, message:err.message }), {headers:{'Content-Type':'application/json'}})
    }
  }

  return new Response('Not Found',{status:404})
}
