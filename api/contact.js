const crypto=require('node:crypto');
const {validateContact,encryptContact,decryptContact}=require('../js/contact-store.cjs');
const {authorized}=require('./admin')._test;
const attempts=new Map(),FILE='data/enquiries.encrypted.json',BASE='https://api.github.com/repos/UmeAfk/VastuChitra/contents/'+FILE;
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');const send=(code,data)=>res.status(code).json(data);
 const token=process.env.GITHUB_TOKEN,key=process.env.CONTACT_ENCRYPTION_KEY;
 if(!token||!key)return send(503,{error:'Contact form is temporarily unavailable. Please try again later.'});
 async function read(){const r=await fetch(BASE+'?ref=main',{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'}});if(r.status===404)return {records:[],sha:null};if(!r.ok)throw Error('Private enquiry storage could not be reached.');const file=await r.json();return {records:JSON.parse(Buffer.from(file.content,'base64').toString('utf8')),sha:file.sha};}
 try{
  if(req.method==='GET'){
   if(!authorized(req.headers.cookie,process.env.ADMIN_PASSWORD,token))return send(401,{error:'Sign in to Admin to view enquiries.'});
   const {records}=await read();return send(200,{enquiries:records.map(record=>decryptContact(record,key)).reverse()});
  }
  if(req.method!=='POST')return send(405,{error:'Method not allowed'});
  if(req.headers.origin!=='https://'+req.headers.host)return send(403,{error:'Invalid origin'});
  let body=req.body||{};if(typeof body==='string')body=JSON.parse(body);if(JSON.stringify(body).length>4096)return send(413,{error:'Submission is too large.'});
  if(body.website)return send(201,{success:true});
  let contact;try{contact=validateContact(body);}catch(error){return send(400,{error:error.message});}
  const fingerprint=crypto.createHash('sha256').update(String(req.headers['x-forwarded-for']||'unknown')).digest('hex');const now=Date.now(),recent=(attempts.get(fingerprint)||[]).filter(time=>now-time<600000);
  if(recent.length>=5)return send(429,{error:'Please wait a few minutes before submitting again.'});attempts.set(fingerprint,[...recent,now]);if(attempts.size>2000)attempts.clear();
  const record={id:crypto.randomUUID(),createdAt:new Date().toISOString(),...contact};const encrypted=encryptContact(record,key);
  for(let attempt=0;attempt<3;attempt++){
   const {records,sha}=await read();if(records.length>=2000)return send(503,{error:'Contact form is temporarily unavailable.'});
   const r=await fetch(BASE,{method:'PUT',headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({branch:'main',message:'Store encrypted contact enquiry',content:Buffer.from(JSON.stringify([...records,encrypted])).toString('base64'),...(sha?{sha}:{})})});
   if(r.status===409)continue;if(!r.ok)throw Error('Your enquiry could not be saved. Please try again.');return send(201,{success:true});
  }
  return send(409,{error:'Please try submitting once more.'});
 }catch{return send(503,{error:'Your enquiry could not be saved. Please try again later.'});}
};
