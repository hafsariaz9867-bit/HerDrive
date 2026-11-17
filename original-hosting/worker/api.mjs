const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export const owner=(r,e)=>!!r.headers.get('oai-authenticated-user-id') && !!e.LEADS_OWNER_EMAIL && r.headers.get('oai-authenticated-user-email')?.toLowerCase()===e.LEADS_OWNER_EMAIL.toLowerCase();
export async function api(r,e){try{
const u=new URL(r.url);if(!e.BUCKET)return reply({error:'Signups are temporarily unavailable. Please try again later.'},503);
if(r.method!=='GET'&&r.headers.get('Origin')!==u.origin)return reply({error:'Request not allowed.'},403);
if(u.pathname==='/api/leads'&&r.method==='POST'){
const raw=await r.text();if(raw.length>4000)return reply({error:'Submission too large.'},413);const b=JSON.parse(raw);
if(b.website)return reply({error:'Please try again.'},400);
if(!['rider','captain'].includes(b.type)||!b.consent||!b.adult||typeof b.name!=='string'||b.name.trim().length<2||b.name.length>80||typeof b.email!=='string'||b.email.length>254||!/^\S+@\S+\.\S+$/.test(b.email)||typeof b.area!=='string'||b.area.length>100||!b.area.trim())return reply({error:'Please complete all required fields and consent.'},400);
const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.type+':'+b.email.trim().toLowerCase())))).map(x=>x.toString(16).padStart(2,'0')).join('');
const id='leads/'+digest;const previous=await e.BUCKET.get(id);if(previous)return reply({ok:true,message:'Your interest has been registered. Thank you.'});
const lead={id:digest,type:b.type,name:b.name.trim(),email:b.email.trim().toLowerCase(),area:b.area.trim(),vehicle:b.type==='captain'&&['Car','Scooty','Not yet'].includes(b.vehicle)?b.vehicle:null,licence:b.type==='captain'&&['Yes','Not yet'].includes(b.licence)?b.licence:null,consent:true,adult:true,consentVersion:'2026-11-16',created:new Date().toISOString()};
await e.BUCKET.put(id,JSON.stringify(lead));return reply({ok:true,message:'Your interest has been registered. Thank you.'},201);
}
if(u.pathname==='/api/leads'&&r.method==='GET'){
if(!owner(r,e))return reply({error:'Owner sign-in required.'},403);
const page=await e.BUCKET.list({prefix:'leads/',limit:200,cursor:u.searchParams.get('cursor')||undefined});
const leads=await Promise.all(page.objects.map(async x=>{const obj=await e.BUCKET.get(x.key);return obj?obj.json():null}));return reply({leads:leads.filter(Boolean),cursor:page.truncated?page.cursor:null});
}
if(u.pathname.startsWith('/api/leads/')&&r.method==='DELETE'){
if(!owner(r,e))return reply({error:'Owner sign-in required.'},403);const id=u.pathname.split('/').pop();if(!/^[a-f0-9]{64}$/.test(id))return reply({error:'Invalid record.'},400);await e.BUCKET.delete('leads/'+id);return reply({ok:true});
}
return reply({error:'Not found.'},404);
}catch{return reply({error:'We could not save your details. Please try again.'},500)}}
