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
 if(!usage){
 const params=new URLSearchParams({q,site:'AU',market:'au',native_price:'1',days:'90',size:'240',page:String(page),best_offer:'1'});
 if(['used','new'].includes(b.condition))params.set('condition',b.condition);
 for(const k of ['min_price','max_price'])if(b[k]!==undefined&&b[k]!==''&&Number.isFinite(Number(b[k]))&&Number(b[k])>=0)params.set(k,String(Number(b[k])));
 for(const k of ['start','end'])if(/^\d{4}-\d{2}-\d{2}$/.test(b[k]||''))params.set(k,b[k]);
 if(/^\d{1,10}$/.test(b.category||''))params.set('category',b.category);
 url.search=params;
 }
 try{const r=await fetch(url,{headers:{'X-API-Key':key,'User-Agent':'FlipFinderPersonal/0.3'},signal:AbortSignal.timeout(24000)});const d=await r.json();return reply(r.status,d)}catch{return reply(502,{error:'Provider unavailable or timed out. Check usage before retrying.'})}
};
