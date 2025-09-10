addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const DEFAULT_TOOLS = [
  {name:'Base58转换器', url:'https://base58.52zy.eu.org', desc:'JSON Base58 转换工具'},
  {name:'TVBox -> MoonTV', url:'/jsontomoontv.html', desc:'TVBox配置转换MoonTV'}
]

async function handleRequest(request){
  const url = new URL(request.url)
  if(url.pathname.startsWith('/api/tools')){
    if(request.method==='POST'){
      const body = await request.json()
      if(body.password !== ADMIN_PASSWORD) return new Response(JSON.stringify({success:false,message:'密码错误'}),{headers:{'Content-Type':'application/json'}})
      let tools = await getTools()
      switch(body.action){
        case 'add':
          tools.push({name:body.name,url:body.url,desc:body.desc||''})
          await saveTools(tools)
          return new Response(JSON.stringify({success:true}),{headers:{'Content-Type':'application/json'}})
        case 'edit':
          if(body.index>=0 && body.index<tools.length){
            tools[body.index].desc = body.desc
            await saveTools(tools)
            return new Response(JSON.stringify({success:true}),{headers:{'Content-Type':'application/json'}})
          }
          return new Response(JSON.stringify({success:false,message:'索引无效'}),{headers:{'Content-Type':'application/json'}})
        case 'delete':
          if(body.index>=0 && body.index<tools.length){
            tools.splice(body.index,1)
            await saveTools(tools)
            return new Response(JSON.stringify({success:true}),{headers:{'Content-Type':'application/json'}})
          }
          return new Response(JSON.stringify({success:false,message:'索引无效'}),{headers:{'Content-Type':'application/json'}})
        default:
          return new Response(JSON.stringify({success:false,message:'无效操作'}),{headers:{'Content-Type':'application/json'}})
      }
    } else {
      const tools = await getTools()
      return new Response(JSON.stringify(tools),{headers:{'Content-Type':'application/json'}})
    }
  }

  // 直接返回 index.html
  return fetch(request)
}

async function getTools(){
  const kv = await TOOLS_KV.get('tools')
  if(!kv) return DEFAULT_TOOLS
  try{
    return JSON.parse(kv)
  }catch{
    return DEFAULT_TOOLS
  }
}

async function saveTools(tools){
  await TOOLS_KV.put('tools',JSON.stringify(tools))
}
