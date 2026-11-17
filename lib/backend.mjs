import {createHash, createHmac, timingSafeEqual} from 'node:crypto';
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const sha=s=>createHash('sha256').update(s).digest();
const equal=(a,b)=>timingSafeEqual(sha(a),sha(b));
const configured=e=>/^[a-f0-9]{64}$/i.test(e.ADMIN_ACCESS_KEY||'');
const sign=(value,e)=>createHmac('sha256',e.ADMIN_ACCESS_KEY).update(value).digest('hex');
export function isOwner(r,e){
 if(!configured(e))return false;
 const token=r.headers.get('cookie')?.match(/(?:^|;\s*)herdrive_admin=([^;]+)/)?.[1]||'';
 const [expiry,signature]=token.split('.');
 return /^\d+$/.test(expiry||'') && Number(expiry)>Date.now() && /^[a-f0-9]{64}$/.test(signature||'') && equal(signature,sign(expiry,e));
}
function cookie(value,r,age){return `herdrive_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(r.url).protocol==='https:'?'; Secure':''}`}
async function database(e,path,options={}){
 if(!e.SUPABASE_URL||!e.SUPABASE_SECRET_KEY)throw Error('unconfigured');
 const headers={'apikey':e.SUPABASE_SECRET_KEY,'Content-Type':'application/json',...options.headers};
 // Legacy service_role JWTs need Authorization; new sb_secret keys use apikey only.
 if(!e.SUPABASE_SECRET_KEY.startsWith('sb_secret_'))headers.Authorization=`Bearer ${e.SUPABASE_SECRET_KEY}`;
 const response=await fetch(e.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/leads'+path,{...options,headers,signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('database');
 return response.status===204?null:response.text().then(s=>s?JSON.parse(s):null);
}
export async function handle(r,e=process.env){
 try{
 const u=new URL(r.url),method=r.method;
 if(!['GET','POST','DELETE'].includes(method))return json({error:'Method not allowed.'},405);
 if(method!=='GET'&&r.headers.get('origin')!==(e.SITE_URL||u.origin).replace(/\/$/,''))return json({error:'Request not allowed.'},403);
 if(u.pathname==='/api/session'){
  if(method==='GET')return json({authenticated:isOwner(r,e)});
  if(method==='DELETE')return json({ok:true},200,{'Set-Cookie':cookie('',r,0)});
  if(!configured(e))return json({error:'Dashboard access has not been configured.'},503);
  const raw=await r.text();if(raw.length>1000)return json({error:'Invalid sign-in.'},400);
  let b;try{b=JSON.parse(raw)}catch{return json({error:'Invalid sign-in.'},400)}
  if(typeof b.key!=='string'||!equal(b.key,e.ADMIN_ACCESS_KEY))return json({error:'Incorrect access key.'},401);
  const expiry=String(Date.now()+8*60*60*1000);
  return json({ok:true},200,{'Set-Cookie':cookie(expiry+'.'+sign(expiry,e),r,28800)});
 }
 if(u.pathname==='/api/leads'&&method==='POST'){
  const raw=await r.text();if(raw.length>4000)return json({error:'Submission too large.'},413);
  let b;try{b=JSON.parse(raw)}catch{return json({error:'Invalid submission.'},400)}
  if(!b||b.website||!['rider','captain'].includes(b.type)||b.consent!==true||b.adult!==true||typeof b.name!=='string'||b.name.trim().length<2||b.name.length>80||typeof b.email!=='string'||b.email.length>254||!/^\S+@\S+\.\S+$/.test(b.email)||typeof b.area!=='string'||!b.area.trim()||b.area.length>100)return json({error:'Please complete all required fields and consent.'},400);
  if(b.type==='captain'&&(!['Car','Scooty','Not yet'].includes(b.vehicle)||!['Yes','Not yet'].includes(b.licence)))return json({error:'Please complete the Captain fields.'},400);
  const email=b.email.trim().toLowerCase();
  const lead={id:sha(b.type+':'+email).toString('hex'),type:b.type,name:b.name.trim(),email,area:b.area.trim(),vehicle:b.type==='captain'?b.vehicle:null,licence:b.type==='captain'?b.licence:null,consent:true,adult:true,consentVersion:'2026-11-16',created:new Date().toISOString()};
  await database(e,'?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(lead)});
  return json({ok:true},201);
 }
 if(u.pathname==='/api/leads'&&method==='GET'){
  if(!isOwner(r,e))return json({error:'Owner sign-in required.'},401);
  const cursor=u.searchParams.get('cursor');if(cursor&&!/^[a-f0-9]{64}$/.test(cursor))return json({error:'Invalid page.'},400);
  const rows=await database(e,'?select=*&order=id.asc&limit=201'+(cursor?'&id=gt.'+cursor:''));
  const leads=rows.slice(0,200);return json({leads,cursor:rows.length>200?leads.at(-1).id:null});
 }
 if(/^\/api\/leads\/[a-f0-9]{64}$/.test(u.pathname)&&method==='DELETE'){
  if(!isOwner(r,e))return json({error:'Owner sign-in required.'},401);
  await database(e,'?id=eq.'+u.pathname.split('/').pop(),{method:'DELETE'});return json({ok:true});
 }
 return json({error:'Not found.'},404);
 }catch{return json({error:'Service temporarily unavailable. Please try again later.'},503)}
}
