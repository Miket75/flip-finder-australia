import {timingSafeEqual} from 'node:crypto';
export const handler=async(event)=>{
 const reply=(statusCode,data)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(data)});
 if(event.httpMethod!=='POST')return reply(405,{error:'POST required'});
 const key=process.env.COMPS_API_KEY, password=process.env.APP_PASSWORD;
 if(!key||!password)return reply(503,{error:'Set COMPS_API_KEY and APP_PASSWORD in Netlify'});
 let b;try{b=JSON.parse(event.body||'{}')}catch{return reply(400,{error:'Invalid JSON'})}
 const a=Buffer.from(String(b.password||'')),p=Buffer.from(password);if(a.length!==p.length||!timingSafeEqual(a,p))return reply(401,{error:'Incorrect app password'});
 const usage=b.action==='usage';const page=Number(b.page||1);const q=String(b.q||'').trim();if(!usage&&(!q||q.length>300||!Number.isInteger(page)||page<1||page>10))return reply(400,{error:'Invalid search or page'});
 const url=new URL('https://api.compsapi.com/v1/'+(usage?'usage':'sold'));
 if(!usage)url.search=new URLSearchParams({q,site:'AU',days:'90',size:'240',page:String(page),best_offer:'1'});
 try{const r=await fetch(url,{headers:{'X-API-Key':key,'User-Agent':'FlipFinderPersonal/0.1'},signal:AbortSignal.timeout(24000)});const d=await r.json();return reply(r.status,d)}catch{return reply(502,{error:'Provider unavailable or timed out. Check usage before retrying.'})}
};
