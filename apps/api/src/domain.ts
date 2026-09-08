export type Actor={id:string;tenant_id:string;role:string;name:string};
export class Fault extends Error {status:number;constructor(status:number,code:string){super(code);this.status=status;}}
export function check(ok:unknown,status=422,code='INVALID_INPUT'):asserts ok{if(!ok)throw new Fault(status,code);}
export function str(v:unknown,max=120){check(typeof v==='string'&&v.trim().length>0&&v.trim().length<=max);return v.trim();}
export function num(v:unknown,min:number,max:number){check(Number.isInteger(v)&&Number(v)>=min&&Number(v)<=max);return Number(v);}
export const day=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
export const uuid=(s:unknown)=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export function keys(obj:any,allowed:string[]){check(obj&&typeof obj==='object'&&!Array.isArray(obj));check(Object.keys(obj).every(k=>allowed.includes(k)),422,'UNKNOWN_FIELD');}
export const catalog:Record<string,{label:string;category:string}>={
 'com.google.android.youtube':{label:'YouTube',category:'Video'},
 'com.instagram.android':{label:'Instagram',category:'Sosyal medya'},
 'com.whatsapp':{label:'WhatsApp',category:'İletişim'},
 'com.android.chrome':{label:'Chrome',category:'Tarayıcı'},
 'org.khanacademy.android':{label:'Khan Academy',category:'Eğitim'},
 'com.spotify.music':{label:'Spotify',category:'Müzik'}
};
export function classify(packageName:string){return catalog[packageName]??{label:packageName,category:'Diğer / sınıflandırılmamış'};}
export function validateBatch(b:any,now=new Date()){
 keys(b,['batchId','deviceId','consentVersion','day','revision','windowStart','windowEnd','timezone','quality','apps']);
 check(uuid(b.batchId)&&uuid(b.deviceId));num(b.consentVersion,1,2147483647);num(b.revision,1,2147483647);
 check(b.timezone==='Europe/Istanbul');check(['partial','complete','limited'].includes(b.quality));
 check(typeof b.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.day));
 const start=new Date(b.windowStart),end=new Date(b.windowEnd);
 check(Number.isFinite(start.getTime())&&Number.isFinite(end.getTime()));
 check(end>start&&end.getTime()<=now.getTime()+300000&&end.getTime()-start.getTime()<=86400000);
 check(day(start)===b.day&&day(new Date(end.getTime()-1))===b.day&&b.day<=day(now));
 check(now.getTime()-end.getTime()<=7*86400000,422,'STALE_WINDOW');
 if(b.quality==='complete')check(end.toISOString()===new Date(b.day+'T21:00:00.000Z').toISOString(),422,'INCOMPLETE_DAY');
 check(Array.isArray(b.apps)&&b.apps.length<=250);
 const seen=new Set<string>();let total=0;
 const apps=b.apps.map((a:any)=>{keys(a,['packageName','seconds']);check(typeof a.packageName==='string'&&/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(a.packageName)&&a.packageName.length<=200);check(!seen.has(a.packageName),422,'DUPLICATE_PACKAGE');seen.add(a.packageName);const seconds=num(a.seconds,1,86400);total+=seconds;return {packageName:a.packageName,seconds};}).sort((a:any,c:any)=>a.packageName.localeCompare(c.packageName));
 check(total<=Math.floor((end.getTime()-start.getTime())/1000),422,'DURATION_EXCEEDS_WINDOW');
 return {batchId:b.batchId,deviceId:b.deviceId,consentVersion:b.consentVersion,day:b.day,revision:b.revision,windowStart:start.toISOString(),windowEnd:end.toISOString(),timezone:b.timezone,quality:b.quality,apps};
}
