import {handle} from './backend.mjs';
export default async function handler(req,res){
 const protocol=(req.headers['x-forwarded-proto']||'https').split(',')[0];
 const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):String(v));
 const opts={method:req.method,headers};
 if(!['GET','HEAD'].includes(req.method)){opts.body=typeof req.body==='string'?req.body:Buffer.isBuffer(req.body)?req.body.toString():JSON.stringify(req.body??{});}
 const response=await handle(new Request(`${protocol}://${req.headers.host}${req.url}`,opts));
 res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(await response.text());
}
