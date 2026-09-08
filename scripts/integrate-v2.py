# One-time integration of the reviewed v2 components. No deploy or secrets.
from pathlib import Path
import xml.etree.ElementTree as ET
r=Path(__file__).resolve().parents[1]
p=r/'apps/web/app.js';s=p.read_text()
if 'renderAcademicView' in s:
 print('V2 source already integrated')
 raise SystemExit(0)
s="import {icon,renderAcademicView} from './academic-ui.js';\n"+s
s=s.replace('let loadEpoch=0;',"let loadEpoch=0;\nlet academicData=null,academicError='',examType=null,examId=null;\nasync function getAcademics(id){try{return {data:await api('/students/'+id+'/academics'),error:''};}catch(e){return {data:null,error:e.message};}}\nasync function reloadAcademics(){const id=selected,epoch=loadEpoch;const result=await getAcademics(id);if(epoch!==loadEpoch||id!==selected)return;academicData=result.data;academicError=result.error;content();}\nfunction navigate(view,options={}){tab=view;if('examType'in options)examType=options.examType;if('examId'in options)examId=options.examId;content();}\nfunction openRecord(){navigate('academic');if(['student','teacher'].includes(me.role))recordForm();}\n")
a=s.index('async function init()');b=s.index('function resetFilters()',a)
s=s[:a]+"""async function init(){const epoch=++loadEpoch;profile=null;academicData=null;academicError='';try{const actor=await api('/me'),list=(await api('/students')).students,id=list[0]?.id??'';const [next,academic]=id?await Promise.all([api('/students/'+id),getAcademics(id)]):[null,{data:null,error:''}];if(epoch!==loadEpoch)return;me=actor;students=list;selected=id;profile=next;academicData=academic.data;academicError=academic.error;tab='overview';examType=null;examId=null;resetFilters();render();}catch(e){if(epoch===loadEpoch)login(e.status===401?'':e.message);}}
"""+s[b:]
a=s.index('function render()');b=s.index('function studentButtons(',a)
s=s[:a]+"""function render(){const isStudent=me.role==='student',nav=[['overview','Bugün','home'],['exams','Deneme','chart'],...(isStudent?[['add','Ekle','plus']]:[]),['plan','Planım','plan'],...(profile?.canUsage?[['usage','Telefon','phone']]:[]),...(me.role==='counselor'?[['notes','Notlar','notes']]:[]),...(['teacher','admin'].includes(me.role)?[['academic','Kayıtlar','book']]:[])];
 root.innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><span class="mark">d</span>dershane.</div><nav class="main-nav" aria-label="Çalışma alanı">${nav.map(([id,label,glyph])=>`<button class="navlink ${id==='add'?'nav-add':''}" data-tab="${id}" aria-selected="${id===tab}" aria-label="${id==='add'?'Çalışma kaydı ekle':label}">${icon(glyph)}<span>${label}</span></button>`).join('')}</nav><div class="foot"><p class="small muted">${E(roles[me.role])} alanı</p><button id="privacySide">${icon('shield')} Gizlilik</button></div></aside><main class="workspace"><header class="topbar"><p class="institution">${icon('book')} ${E(me.tenant.name)}</p><div class="actions"><span class="status"><span class="dot"></span>Geliştirme sürümü</span><button class="icon-button" id="privacy" aria-label="Gizlilik ilkeleri">${icon('shield')}</button><span class="user-avatar">${E(me.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>${!preview?`<button id="logout" class="icon-button" aria-label="Çıkış yap">${icon('exit')}</button>`:''}</div></header><div id="inlineNotice" class="note" role="status" aria-live="polite" style="display:none;margin-bottom:16px"></div>${preview?`<div class="preview-label"><span>Etkileşimli tasarım · Kurgusal veriler</span><label class="sr-only" for="previewRole">Önizleme rolü</label><select id="previewRole">${Object.entries(roles).map(([id,label])=>`<option value="${id}" ${id===me.role?'selected':''}>${label}</option>`).join('')}</select></div>`:''}<section class="hero"><div><p class="eyebrow">${isStudent?'MERHABA, '+E(me.name).toLocaleUpperCase('tr'):E(roles[me.role]).toLocaleUpperCase('tr')+' ÇALIŞMA ALANI'}</p><h1>${isStudent?'Bugün, bir adım daha.':'Gelişime birlikte bakalım.'}</h1><p class="muted">${isStudent?'Sonuçlarını anla. Planını oluştur. Kendi ritminde ilerle.':'Sonuçlar, çalışma planı ve rehberlik. Aynı yerde, doğru bağlamda.'}</p></div><div class="hero-privacy">${icon('shield')}<span>Paylaşım senin kontrolünde.<br>İçerik değil, yalnız süre.</span></div></section>${!isStudent?'<div class="studentbar"><h2>Öğrenciler <span class="badge">'+students.length+'</span></h2><label>Öğrenci ara<input id="search" type="search" placeholder="Ad veya sınıf"></label></div><div id="students" class="students"></div>':''}<div id="content"></div></main></div>`;
 if($('#search')){$('#search').oninput=()=>studentButtons($('#search').value);studentButtons();}$('#privacy').onclick=privacy;$('#privacySide').onclick=privacy;
 if($('#previewRole'))$('#previewRole').onchange=()=>{globalThis.DESIGN_ROLE=$('#previewRole').value;init();};
 if($('#logout'))$('#logout').onclick=async()=>{try{await api('/auth/logout','POST',{});profile=null;login();}catch(e){toast(e.message);}};
 document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>el.dataset.tab==='add'?openRecord():navigate(el.dataset.tab));content();}
"""+s[b:]
s=s.replace("try{const next=await api('/students/'+id);if(epoch!==loadEpoch)return;profile=next;resetFilters();", "try{const [next,academic]=await Promise.all([api('/students/'+id),getAcademics(id)]);if(epoch!==loadEpoch)return;profile=next;academicData=academic.data;academicError=academic.error;examType=null;examId=null;resetFilters();")
a=s.index('function content()');b=s.index('function usage()',a)
s=s[:a]+"""function content(){document.querySelectorAll('[data-tab]').forEach(el=>el.setAttribute('aria-selected',String(el.dataset.tab===tab)));if(!profile){$('#content').innerHTML='<div class="empty">Görüntülenebilen aktif öğrenci yok. Hesabınız onay bekliyor olabilir.</div>';return;}const s=profile.student;$('#content').innerHTML=`${me.role!=='student'?`<div class="panel profile-strip"><div class="person"><div class="avatar">${E(s.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><h2>${E(s.name)}</h2><p class="muted small">${E(s.class_name)} · ${s.status==='active'?'Aktif öğrenci':'Onay bekliyor'}</p></div>${s.status==='pending'&&me.role==='admin'?'<div class="actions"><button id="approve">Kaydı onayla</button></div>':''}</div></div>`:''}<section id="section" aria-label="${E(tab)}"></section>`;
 if($('#approve'))$('#approve').onclick=async()=>{const id=selected;try{await api('/students/'+id+'/approve','POST',{});await init();toast('Öğrenci onaylandı.');}catch(e){toast(e.message);}};
 if(['overview','exams','plan'].includes(tab))return renderAcademicView($('#section'),tab,{me,profile,data:academicData,error:academicError,examType,examId,api,reload:reloadAcademics,navigate,toast,record:openRecord});
 tab==='usage'?usage():tab==='notes'?notes():academic();}
"""+s[b:]
s=s.replace("${['student','teacher'].includes(me.role)?'<button id=\"addRecord\">Kayıt ekle</button>':''}", "${me.role==='student'?'<button id=\"addRecord\">Kayıt ekle</button>':''}")
p.write_text(s)
p=r/'apps/web/client.js';s=p.read_text();a=s.index('export async function api(');prefix=s[:a]
prefix+='''
const courseSpec=[['Türkçe',40],['Matematik',40],['Sosyal Bilimler',20],['Fen Bilimleri',20]];
const sampleExams=[['2026-08-12',[[24,10],[17,12],[12,5],[10,6]]],['2026-08-19',[[26,8],[20,10],[13,4],[11,5]]],['2026-08-26',[[27,7],[21,9],[14,4],[12,4]]],['2026-09-02',[[28,7],[23,8],[15,3],[13,4]]],['2026-09-07',[[31,5],[25,7],[16,2],[14,3]]]].map(([day,scores],i)=>{const subjects=courseSpec.map(([name,q],j)=>({name,correct:scores[j][0],wrong:scores[j][1],blank:q-scores[j][0]-scores[j][1],divisor:4,net:scores[j][0]-scores[j][1]/4,topics:[]}));return {id:'exam-'+i,title:'TYT Genel Deneme '+String(i+1).padStart(2,'0'),type:'TYT',day,subjects,correct:subjects.reduce((n,s)=>n+s.correct,0),wrong:subjects.reduce((n,s)=>n+s.wrong,0),blank:subjects.reduce((n,s)=>n+s.blank,0),net:subjects.reduce((n,s)=>n+s.net,0)};});
const demoAcademics={exams:sampleExams,analysis:{},tasks:[{id:'task-1',title:'Problemlerde yeni bir adım',subject:'Matematik',dueDay:'2026-09-10',description:'Problemler testinden 30 soru çöz. Takıldığın soruları etüte getir.',state:'assigned',version:1,studentNote:'',reviewNote:''},{id:'task-2',title:'Paragraf rutini',subject:'Türkçe',dueDay:'2026-09-12',description:'20 paragraf sorusu ve yanlışların kısa özeti.',state:'verified',version:3,studentNote:'20 soru tamamlandı.',reviewNote:'Etütte iki soruyu birlikte değerlendirdik.'}],sessions:[{id:'session-1',title:'Matematik · Soru çözümü',startsAt:'2026-09-09T12:00:00Z',endsAt:'2026-09-09T13:00:00Z',state:'planned',version:1},{id:'session-2',title:'Haftalık rehberlik görüşmesi',startsAt:'2026-09-11T10:30:00Z',endsAt:'2026-09-11T11:00:00Z',state:'planned',version:1}]};
'''
body=s[a:];start=body.index(' if(preview)');end=body.index(' let response;',start)
mock=''' if(preview){await new Promise(r=>setTimeout(r,60));const role=globalThis.DESIGN_ROLE??'student';if(path==='/me')return {name:role==='student'?'Örnek Ada':'Demo '+role,role,tenant:{name:'Cizre Örnek Akademi'},student:role==='student'?{id:sampleStudent.id,status:'active'}:null};if(path==='/students')return {students:[sampleStudent]};
 if(path.endsWith('/academics'))return structuredClone(demoAcademics);
 if(path.endsWith('/transition')){const id=path.split('/').at(-2),task=demoAcademics.tasks.find(t=>t.id===id);if(task.version!==body.version)throw new Error('Kayıt değişti. Yeniden yükleyin.');task.state=body.state;task.version++;if(role==='student')task.studentNote=body.note;else task.reviewNote=body.note;return {ok:true};}
 if(path.endsWith('/attendance')){const session=demoAcademics.sessions.find(s=>s.id===path.split('/').at(-2));session.state=body.state;session.version++;return {ok:true};}
 if(path.endsWith('/tasks')&&method==='POST'){demoAcademics.tasks.unshift({...body,id:crypto.randomUUID(),state:'assigned',version:1});return {ok:true};}
 if(path.endsWith('/sessions')&&method==='POST'){demoAcademics.sessions.push({...body,id:crypto.randomUUID(),state:'planned',version:1});return {ok:true};}
 if(path.endsWith('/exams')&&method==='POST'){const subjects=body.subjects.map(s=>({...s,net:s.correct-s.wrong/s.divisor}));demoAcademics.exams.push({...body,id:crypto.randomUUID(),subjects,correct:subjects.reduce((n,s)=>n+s.correct,0),wrong:subjects.reduce((n,s)=>n+s.wrong,0),blank:subjects.reduce((n,s)=>n+s.blank,0),net:subjects.reduce((n,s)=>n+s.net,0)});return {ok:true};}
 if(path.endsWith('/notes')){sample.notes.unshift({id:crypto.randomUUID(),body:body.body,created_at:new Date().toISOString()});return {ok:true};}
 if(path.endsWith('/records')&&method==='POST'){sample.records.unshift({...body,source:'Önizleme kaydı'});return {ok:true};}
 if(path==='/consent'&&method==='POST'){sample.consent.enabled=body.enabled?1:0;if(!body.enabled){sample.snapshots=[];sample.usage=[];}return {ok:true};}
 if(path.startsWith('/students/')){const p=structuredClone(sample);p.canUsage=['student','counselor'].includes(role);if(!p.canUsage){p.usage=[];p.snapshots=[];p.consent=null;}if(role!=='counselor')p.notes=[];return p;}return {ok:true};}
'''
s=prefix+body[:start]+mock+body[end:]
s=s.replace('const errors={',"const errors={VERSION_CONFLICT:'Kayıt başka yerde değişmiş. Yenileyip tekrar deneyin.',QUESTION_TOTAL:'Doğru, yanlış ve boş toplamı dersin soru sayısına eşit olmalı.',SESSION_OVERLAP:'Bu öğrencinin aynı saatte başka etüdü var.',SESSION_NOT_STARTED:'Bu etüt için katılım henüz işaretlenemez.',")
p.write_text(s)
p=r/'scripts/build-preview.py';p.write_text('''from pathlib import Path
r=Path(__file__).resolve().parents[1]
css=(r/'apps/web/style.css').read_text()
c=(r/'apps/web/client.js').read_text().replace('export ','')
u=(r/'apps/web/academic-ui.js').read_text().replace('export ','')
a=(r/'apps/web/app.js').read_text().replace("import {api,preview} from './client.js';",'').replace("import {icon,renderAcademicView} from './academic-ui.js';",'')
u='const {icon,renderAcademicView}=(()=>{'+u+';return {icon,renderAcademicView};})();'
out='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dershane · Yeni öğrenci deneyimi</title><style>'+css+'</style></head><body><div id="root"></div><div id="toast" role="status"></div><script type="module">globalThis.DESIGN_PREVIEW=true;'+c+'\\n'+u+'\\n'+a+'</script></body></html>'
(r/'design').mkdir(exist_ok=True)
(r/'design/preview.html').write_text(out)
''')
p=r/'apps/api/src/server.ts';s=p.read_text().replace("import {Store} from './store.ts';", "import {Store} from './store.ts';\nimport {Academics} from './academics.ts';").replace("'/style.css':['style.css','text/css']", "'/style.css':['style.css','text/css'],'/academic-ui.js':['academic-ui.js','text/javascript']").replace(' const rates=new Map',' const academic=new Academics(store);\n const rates=new Map')
needle='   const match=path.match'
code="""   const academicMatch=path.match(/^\\/api\\/v1\\/students\\/([a-f0-9-]+)\\/(academics|exams|tasks|sessions)(?:\\/([a-f0-9-]+)\\/(transition|attendance))?$/);
   if(academicMatch){const[,id,action,objectId,transition]=academicMatch;if(method==='GET'&&action==='academics'&&!objectId)return send(200,academic.profile(a,id));if(method==='POST'){if(action==='exams'&&!objectId)return send(200,academic.exam(a,id,b));if(action==='tasks'&&!objectId)return send(200,academic.createTask(a,id,b));if(action==='tasks'&&objectId&&transition==='transition')return send(200,academic.transitionTask(a,id,objectId,b));if(action==='sessions'&&!objectId)return send(200,academic.createSession(a,id,b));if(action==='sessions'&&objectId&&transition==='attendance')return send(200,academic.attendance(a,id,objectId,b));}}
"""
assert needle in s;s=s.replace(needle,code+needle);p.write_text(s)
(r/'scripts/seed.ts').write_text("""import {mkdirSync,writeFileSync} from 'node:fs';
import {Store,seed} from '../apps/api/src/store.ts';
import {Academics,seedAcademics} from '../apps/api/src/academics.ts';
mkdirSync('.local',{recursive:true,mode:0o700});
const store=new Store('.local/app.sqlite');
try{const result=seed(store);seedAcademics(new Academics(store),store,result.ids);writeFileSync('.local/demo-credentials.json',JSON.stringify(result.credentials,null,2),{mode:0o600});console.log('Synthetic demo ready. Credentials are in .local/demo-credentials.json; do not commit this file.');}finally{store.close();}
""")
p=r/'android/app/src/main/java/tr/dershane/app/MainActivity.kt';s=p.read_text().replace('private lateinit var state:State;','private var redirecting=false\n private lateinit var state:State;')
s=s.replace(' private fun show() {',' private fun show() {\n  if(state.token.isNotEmpty()&&!intent.getBooleanExtra("privacy",false)){if(!redirecting){redirecting=true;startActivity(Intent(this,StudentActivity::class.java));finish()};return}')
s=s.replace('text=s;textSize=size;','text=s;textSize=size;setTextColor(android.graphics.Color.rgb(36,36,46));')
s=s.replace('text=label;minHeight=56;','text=label;isAllCaps=false;minHeight=(52*resources.displayMetrics.density).toInt();setTextColor(android.graphics.Color.rgb(109,72,196));background=android.graphics.drawable.GradientDrawable().apply{setColor(android.graphics.Color.rgb(239,233,249));cornerRadius=16*resources.displayMetrics.density};')
s=s.replace('text("Merhaba, ${state.prefs.getString("name","")}",24f)','button("Öğrenci alanına dön") { startActivity(Intent(this,StudentActivity::class.java));finish() }\n  text("Merhaba, ${state.prefs.getString("name","")}",24f)');p.write_text(s)
p=r/'android/app/src/main/AndroidManifest.xml';ET.register_namespace('android','http://schemas.android.com/apk/res/android');tree=ET.parse(p);app=tree.getroot().find('application');ET.SubElement(app,'activity',{'{http://schemas.android.com/apk/res/android}name':'.StudentActivity','{http://schemas.android.com/apk/res/android}exported':'false'});tree.write(p,encoding='unicode')
icons={'home':'M3,10 L12,3 L21,10 L21,21 L15,21 L15,14 L9,14 L9,21 L3,21 Z','chart':'M4,4 L4,20 L20,20 M8,15 L12,10 L16,12 L20,5','plan':'M7,3 L7,7 M17,3 L17,7 M4,9 L20,9 M4,5 L20,5 L20,21 L4,21 Z M8,13 L10,13 M14,13 L16,13 M8,17 L10,17','phone':'M7,2 L17,2 L17,22 L7,22 Z M10,18 L14,18'}
for name,path in icons.items():
 p=r/f'android/app/src/main/res/drawable/ic_{name}.xml';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(f'<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:pathData="{path}" android:strokeColor="#7755CD" android:strokeWidth="1.7" android:strokeLineCap="round" android:strokeLineJoin="round" android:fillColor="#00000000" /></vector>')
print('Integrated web/API/Android source; tests are required before source commit.')
