import {test} from 'node:test';import assert from 'node:assert/strict';import {handle} from '../lib/backend.mjs';
const env={ADMIN_ACCESS_KEY:'a'.repeat(64),SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_TEST_ONLY'};
const origin='https://herdrive.example';
function request(path,method='GET',body,extra={}){return new Request(origin+path,{method,headers:{origin,'Content-Type':'application/json',...extra},...(body===undefined?{}:{body:JSON.stringify(body)})})}
const lead={name:'Test Rider',email:'test@example.invalid',area:'Test',type:'rider',consent:true,adult:true};
test('auth, validation, database failure, persistence and deletion',async()=>{
 assert.equal((await handle(request('/api/leads'),env)).status,401);
 assert.equal((await handle(request('/api/leads','POST',{...lead,consent:false}),env)).status,400);
 assert.equal((await handle(request('/api/leads','POST',lead,{origin:'https://other.example'}),env)).status,403);
 assert.equal((await handle(request('/api/leads','POST',{...lead,type:'captain'}),env)).status,400);
 assert.equal((await handle(request('/api/session','POST',{key:'wrong'}),env)).status,401);
 const login=await handle(request('/api/session','POST',{key:env.ADMIN_ACCESS_KEY}),env);assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/Secure/);
 assert.equal((await handle(request('/api/leads','POST',lead),{})).status,503);
 const original=globalThis.fetch,rows=new Map();
 globalThis.fetch=async(url,options={})=>{assert.equal(options.headers.apikey,env.SUPABASE_SECRET_KEY);assert.equal(options.headers.Authorization,undefined);const u=new URL(url);
 if(options.method==='POST'){const row=JSON.parse(options.body);if(!rows.has(row.id))rows.set(row.id,row);return new Response(null,{status:201})}
 if(options.method==='DELETE'){rows.delete(u.searchParams.get('id').slice(3));return new Response(null,{status:204})}
 return Response.json([...rows.values()]);};
 try{
 assert.equal((await handle(request('/api/leads','POST',lead),env)).status,201);
 await handle(request('/api/leads','POST',lead),env);assert.equal(rows.size,1);
 assert.equal((await handle(request('/api/leads','POST',{...lead,type:'captain',vehicle:'Car',licence:'Yes'}),env)).status,201);assert.equal(rows.size,2);
 const response=await handle(request('/api/leads','GET',undefined,{cookie}),env);const data=await response.json();assert.equal(data.leads.length,2);
 const id=data.leads[0].id;assert.equal((await handle(request('/api/leads/'+id,'DELETE'),env)).status,401);
 assert.equal((await handle(request('/api/leads/'+id,'DELETE',undefined,{cookie}),env)).status,200);assert.equal(rows.size,1);
 assert.equal((await handle(request('/api/leads','GET',undefined,{cookie:cookie+'bad'}),env)).status,401);
 const logout=await handle(request('/api/session','DELETE',undefined,{cookie}),env);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 globalThis.fetch=async()=>new Response(null,{status:500});assert.equal((await handle(request('/api/leads','POST',lead),env)).status,503);
 }finally{globalThis.fetch=original}
});

test('pagination, malformed JSON and Vercel adapter',async()=>{
 const original=globalThis.fetch;
 const login=await handle(request('/api/session','POST',{key:env.ADMIN_ACCESS_KEY}),env);const cookie=login.headers.get('set-cookie').split(';')[0];
 globalThis.fetch=async()=>Response.json(Array.from({length:201},(_,i)=>({id:i.toString(16).padStart(64,'0')})));
 try{const data=await(await handle(request('/api/leads','GET',undefined,{cookie}),env)).json();assert.equal(data.leads.length,200);assert.equal(data.cursor,(199).toString(16).padStart(64,'0'));}finally{globalThis.fetch=original}
 assert.equal((await handle(new Request(origin+'/api/leads',{method:'POST',headers:{origin},body:'{' }),env)).status,400);
 const {default:handler}=await import('../lib/vercel-handler.mjs');const result={headers:{},setHeader(k,v){this.headers[k]=v},end(s){this.body=s}};
 await handler({method:'GET',url:'/api/leads',headers:{host:'herdrive.example','x-forwarded-proto':'https'}},result);assert.equal(result.statusCode,401);assert.match(result.body,/sign-in/);
});
