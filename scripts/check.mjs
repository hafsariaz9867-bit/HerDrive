import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
for(const dir of ['public','lib','api','scripts','tests']){function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(/\.(js|mjs)$/.test(p))execFileSync(process.execPath,['--check',p]);}}walk(dir);}
for(const file of ['public/index.html','public/leads.html']){const s=fs.readFileSync(file,'utf8');for(const match of s.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=match[1];if(ref==='/'||/^(https?:|mailto:)/.test(ref))continue;if(!fs.existsSync(path.resolve(path.dirname(file),ref)))throw Error('Missing asset '+ref)}}
const css=fs.readFileSync('public/assets/fonts/fonts.css','utf8');for(const m of css.matchAll(/url\(([^)]+)\)/g))if(!fs.existsSync(path.resolve('public/assets/fonts',m[1])))throw Error('Missing font');
console.log('JavaScript syntax, page assets and bundled fonts verified.');
