import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {handle} from '../lib/backend.mjs';
const root=path.resolve('public'),port=Number(process.env.PORT||3000);
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,`http://localhost:${port}`);
 if(url.pathname.startsWith('/api/')){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>5000){res.writeHead(413);res.end();return}chunks.push(chunk)}
 const response=await handle(new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found')}}).listen(port,'127.0.0.1',()=>console.log(`HerDrive: http://localhost:${port}`));
