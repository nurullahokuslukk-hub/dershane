import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Store} from './store.ts';
import {Academics} from './academics.ts';
import {Fault,check,str,keys} from './domain.ts';
const web=resolve(dirname(fileURLToPath(import.meta.url)),'../../web');
const assets:Record<string,[string,string]>={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/client.js':['client.js','text/javascript'],'/style.css':['style.css','text/css'],'/academic-ui.js':['academic-ui.js','text/javascript']};
export function app(store:Store,options:{origin?:string;loginLimit?:number}={}){
 const academic=new Academics(store);
 const rates=new Map<string,{n:number;until:number}>();
 const server=createServer(async(req,res)=>{
  const origin=options.origin??'http://127.0.0.1:3100',requestId=crypto.randomUUID();
  res.setHeader('X-Request-ID',requestId);res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const send=(status:number,value:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));};
  try{
   check(req.headers.host===new URL(origin).host,403,'HOST_NOT_ALLOWED');const path=new URL(req.url??'/',origin).pathname,method=req.method??'GET';
   if(method==='GET'&&assets[path]){const[file,type]=assets[path];res.setHeader('Content-Type',type+'; charset=utf-8');return res.end(readFileSync(resolve(web,file)));}
   if(path==='/health'&&method==='GET')return send(200,{status:'ok',mode:'local-development',version:'0.2.0-dev'});
   const mutate=!['GET','HEAD'].includes(method);let b:any={};
   if(mutate){if(req.headers.origin)check(req.headers.origin===origin,403,'ORIGIN_NOT_ALLOWED');check((req.headers['content-type']??'').split(';')[0]==='application/json',415,'JSON_REQUIRED');check(Number(req.headers['content-length']??0)<=131072,413,'BODY_TOO_LARGE');const chunks:Buffer[]=[];let size=0;for await(const part of req){size+=part.length;check(size<=131072,413,'BODY_TOO_LARGE');chunks.push(part);}try{b=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new Fault(400,'INVALID_JSON');}}
   if(path==='/api/v1/auth/login'&&method==='POST'){
    keys(b,['tenant','login','password']);str(b.tenant,80);str(b.login,80);str(b.password,256);
    const now=Date.now();for(const[k,v]of rates)if(v.until<now)rates.delete(k);check(rates.size<10000,429,'RATE_LIMIT');const key=req.socket.remoteAddress??'local';const bucket=rates.get(key)??{n:0,until:now+60000};bucket.n++;rates.set(key,bucket);if(bucket.n>(options.loginLimit??15)){res.setHeader('Retry-After','60');throw new Fault(429,'RATE_LIMIT');}
    const r=store.login(b.tenant,b.login,b.password);const mobile=req.headers['x-client']==='android';if(!mobile)res.setHeader('Set-Cookie',`sid=${r.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);return send(200,{csrf:r.csrf,...(mobile?{accessToken:r.token,expiresIn:28800}:{})});
   }
   const bearer=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):'';const cookie=(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('sid='))?.slice(4)??'';const token=bearer||cookie;const a=store.session(token);
   if(mutate&&!bearer)check(req.headers.origin===origin&&req.headers['x-csrf-token']===a.csrf,403,'CSRF_REQUIRED');
   if(path==='/api/v1/me'&&method==='GET')return send(200,store.me(a));
   if(path==='/api/v1/auth/logout'&&method==='POST'){store.logout(token);res.setHeader('Set-Cookie','sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(200,{ok:true});}
   if(path==='/api/v1/students'&&method==='GET')return send(200,{students:store.list(a)});
   if(path==='/api/v1/consent'&&method==='GET')return send(200,store.consentState(a));
   if(path==='/api/v1/consent'&&method==='POST')return send(200,store.consent(a,b));
   if(path==='/api/v1/devices'&&method==='POST'){keys(b,['installationId']);return send(200,store.device(a,b.installationId));}
   if(path==='/api/v1/usage/batches'&&method==='POST')return send(200,store.batch(a,b));
   const academicMatch=path.match(/^\/api\/v1\/students\/([a-f0-9-]+)\/(academics|exams|tasks|sessions)(?:\/([a-f0-9-]+)\/(transition|attendance))?$/);
   if(academicMatch){const[,id,action,objectId,transition]=academicMatch;if(method==='GET'&&action==='academics'&&!objectId)return send(200,academic.profile(a,id));if(method==='POST'){if(action==='exams'&&!objectId)return send(200,academic.exam(a,id,b));if(action==='tasks'&&!objectId)return send(200,academic.createTask(a,id,b));if(action==='tasks'&&objectId&&transition==='transition')return send(200,academic.transitionTask(a,id,objectId,b));if(action==='sessions'&&!objectId)return send(200,academic.createSession(a,id,b));if(action==='sessions'&&objectId&&transition==='attendance')return send(200,academic.attendance(a,id,objectId,b));}}
   const match=path.match(/^\/api\/v1\/students\/([a-f0-9-]+)(?:\/(records|notes|approve))?$/);
   if(match){const id=match[1],action=match[2];if(!action&&method==='GET')return send(200,store.profile(a,id));if(action==='records'&&method==='POST')return send(200,store.record(a,id,b));if(action==='notes'&&method==='POST'){keys(b,['body']);return send(201,store.note(a,id,b.body));}if(action==='approve'&&method==='POST'){keys(b,[]);return send(200,store.approve(a,id));}}
   throw new Fault(404,'NOT_FOUND');
  }catch(e){const known=e instanceof Fault;send(known?e.status:500,{error:known?e.message:'INTERNAL_ERROR',requestId});}
 });server.requestTimeout=15000;server.headersTimeout=10000;return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 check(process.env.NODE_ENV!=='production',503,'DEVELOPMENT_ONLY');mkdirSync('.local',{recursive:true,mode:0o700});const store=new Store('.local/app.sqlite');const server=app(store);server.listen(3100,'127.0.0.1',()=>console.log('Development only: http://127.0.0.1:3100'));for(const signal of['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{store.close();process.exit(0);}));
}
