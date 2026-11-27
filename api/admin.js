const crypto=require('node:crypto');
const REPO='UmeAfk/VastuChitra',BRANCH='main',CONFIG='data/site-config.json';
const allowedMedia=path=>/^public\/(shreesadhna|uploads|demo|temple|previews)\/[a-zA-Z0-9 _+().\/-]+\.(webp|png|jpe?g|gif|avif|svg|mp4|webm|pdf)$/i.test(path)&&!path.split('/').includes('..');
const same=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);};
function session(password,secret,now=Date.now()){const value=String(now+8*60*60*1000);return value+'.'+crypto.createHmac('sha256',secret+password).update(value).digest('hex');}
function authorized(cookie,password,secret,now=Date.now()){const value=String(cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('vastu_admin='))?.slice(12);if(!value)return false;const [expiry,signature]=value.split('.');return Number(expiry)>now&&same(signature,crypto.createHmac('sha256',secret+password).update(expiry).digest('hex'));}
async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const send=(status,data)=>res.status(status).json(data);
 const token=process.env.GITHUB_TOKEN,password=process.env.ADMIN_PASSWORD;
 const configured=!!token&&!!password;
 const url=new URL(req.url,'https://local'),action=url.searchParams.get('action')||'config';
 if(!configured)return send((req.method==='GET'&&(action==='status'||action==='config'))?200:503,{enabled:false,config:null,error:'Shared storage needs GITHUB_TOKEN and ADMIN_PASSWORD in Vercel.'});
 async function github(path,options={}){const r=await fetch('https://api.github.com/repos/'+REPO+'/'+path,{...options,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28',...options.headers}});if(r.status===404)return null;if(!r.ok){const e=new Error(r.status===409?'Content changed elsewhere. Refresh Admin before saving.':r.status===403?'GitHub denied repository writes. Check the token repository selection, Contents read/write permission, and any pending approval.':'GitHub storage request failed ('+r.status+').' );e.status=r.status===409?409:502;throw e;}return r.status===204?{}:r.json();}
 async function read(path){return github('contents/'+encodeURI(path)+'?ref='+BRANCH);}
 async function save(path,content,message,sha){return github('contents/'+encodeURI(path),{method:'PUT',body:JSON.stringify({branch:BRANCH,message,content:Buffer.from(content).toString('base64'),...(sha?{sha}:{})})});}
 let body=req.body||{};if(typeof body==='string'){try{body=JSON.parse(body);}catch{return send(400,{error:'Invalid JSON'});}}
 try{
  if(action==='status')return send(200,{enabled:true,authenticated:authorized(req.headers.cookie,password,token)});
  if(action==='login'&&req.method==='POST'){
   if(!same(body.password,password))return send(401,{error:'Incorrect Admin password.'});
   res.setHeader('Set-Cookie','vastu_admin='+session(password,token)+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800');return send(200,{success:true});
  }
  if(action==='config'&&req.method==='GET'){const file=await read(CONFIG);return send(200,{enabled:true,revision:file?.sha||null,config:file?JSON.parse(Buffer.from(file.content,'base64').toString('utf8')):null});}
  if(action==='media'&&req.method==='GET'){
   const path=url.searchParams.get('path')||'';if(!allowedMedia(path))return send(400,{error:'Invalid media path'});const file=await read(path);if(!file)return send(404,{error:'Media not found'});
   const types={webp:'image/webp',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',avif:'image/avif',svg:'image/svg+xml',pdf:'application/pdf',mp4:'video/mp4',webm:'video/webm'};
   res.setHeader('Content-Type',types[path.split('.').pop().toLowerCase()]);res.setHeader('Cache-Control','public, max-age=60');let bytes;
   if(file.content)bytes=Buffer.from(file.content,'base64');
   else{const raw=await fetch('https://api.github.com/repos/'+REPO+'/contents/'+encodeURI(path)+'?ref='+BRANCH,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github.raw+json'}});if(!raw.ok)return send(502,{error:'Media could not be read'});bytes=Buffer.from(await raw.arrayBuffer());}
   return res.status(200).send(bytes);
  }
  if(action==='assets'&&req.method==='GET'){
   const tree=await github('git/trees/'+BRANCH+'?recursive=1');const assets=tree.tree.filter(item=>item.type==='blob'&&allowedMedia(item.path)).map(item=>({name:item.path.split('/').pop(),relativePath:item.path,kind:'file',path:item.path.startsWith('public/uploads/')?'/api/admin?action=media&path='+encodeURIComponent(item.path):'/'+item.path,mediaType:/\.(mp4|webm)$/i.test(item.path)?'video':/\.pdf$/i.test(item.path)?'pdf':'image',sizeBytes:item.size}));
   const folders=new Set();assets.forEach(asset=>{const parts=asset.relativePath.split('/');parts.pop();while(parts.length){folders.add(parts.join('/'));parts.pop();}});
   return send(200,{assets:[...[...folders].map(path=>({name:path.split('/').pop(),relativePath:path,path,kind:'folder'})),...assets]});
  }
  if(!authorized(req.headers.cookie,password,token))return send(401,{error:'Sign in to Admin to publish changes.'});
  if(req.headers.origin&&req.headers.origin!==new URL('https://'+req.headers.host).origin)return send(403,{error:'Invalid request origin.'});
  if(req.method!=='POST')return send(405,{error:'Method not allowed'});
  if(action==='config'){
   const config=body.config;if(!config||!config.settings||!['projects','heritageProjects','personalProjects'].every(key=>Array.isArray(config[key])))return send(400,{error:'Invalid configuration'});
   if(JSON.stringify(config).length>1500000)return send(413,{error:'Configuration is too large'});
   const existing=await read(CONFIG);if((existing?.sha||null)!==(body.revision||null))return send(409,{error:'Another Admin saved changes. Refresh before saving to avoid overwriting them.'});
   const stored={settings:config.settings,projects:config.projects,heritageProjects:config.heritageProjects,personalProjects:config.personalProjects};
   const result=await save(CONFIG,JSON.stringify(stored,null,2),'Update site content from Admin',existing?.sha);
   return send(200,{success:true,personalSaved:true,heritageSaved:true,revision:result.content.sha});
  }
  if(action==='upload'){
   const name=String(body.name||'').replace(/[^a-zA-Z0-9_.-]/g,'-');const path='public/uploads/'+Date.now()+'-'+crypto.randomBytes(3).toString('hex')+'-'+name;
   if(!allowedMedia(path)||!body.content||!/^[a-zA-Z0-9+/]+={0,2}$/.test(body.content))return send(400,{error:'Unsupported media file'});
   const data=Buffer.from(body.content,'base64');if(data.length>3000000)return send(413,{error:'Hosted uploads must be under 3 MB. Compress this file or add it through GitHub.'});
   await save(path,data,'Upload media from Admin');return send(200,{path:'/api/admin?action=media&path='+encodeURIComponent(path)});
  }
  if(action==='delete'){
   const paths=body.paths;if(!Array.isArray(paths)||!paths.length||paths.length>50||paths.some(path=>!allowedMedia(path)))return send(400,{error:'Select up to 50 media files'});
   const config=await read(CONFIG);const contents=config?Buffer.from(config.content,'base64').toString('utf8'):'';
   if(paths.some(path=>contents.includes(path)||contents.includes(encodeURIComponent(path))))return send(409,{error:'A selected file is used by a card. Remove it from the card before deleting it.'});
   let deleted=0;for(const path of paths){const file=await read(path);if(file){await github('contents/'+encodeURI(path),{method:'DELETE',body:JSON.stringify({branch:BRANCH,message:'Delete media from Admin',sha:file.sha})});deleted++;}}
   return send(200,{deleted});
  }
  return send(400,{error:'Unsupported operation'});
 }catch(error){return send(error.status||500,{error:error.message||'Shared storage failed'});}
}
module.exports=handler;module.exports._test={allowedMedia,session,authorized};
