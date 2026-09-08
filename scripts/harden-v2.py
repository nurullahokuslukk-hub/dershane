from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
def patch(path,old,new):
 p=r/path;s=p.read_text()
 if old not in s:
  assert new in s, f'Unexpected source: {path}'
  return
 assert s.count(old)==1, f'Ambiguous patch: {path}'
 p.write_text(s.replace(old,new))
# Keep the floating dock outside the scrollable content viewport.
p=r/'apps/web/style.css';s=p.read_text()
if 'Reserved mobile dock space' not in s:
 p.write_text(s+'\n/* Reserved mobile dock space: no content obscured by navigation. */\n@media(max-width:700px){.shell{display:flex;flex-direction:column;height:100dvh;min-height:0;overflow:hidden}.sidebar{flex:none}.workspace{flex:1;min-height:0;overflow-y:auto;margin:0 0 calc(96px + env(safe-area-inset-bottom));padding-bottom:24px;scroll-padding-block:16px}}\n')
patch('apps/api/src/academics.ts','SELECT id,title,type,day FROM exams WHERE tenant_id=? AND student_id=? ORDER BY day,id LIMIT 500', 'SELECT id,title,type,day,rowid AS sequence FROM exams WHERE tenant_id=? AND student_id=? ORDER BY day DESC,rowid DESC LIMIT 500')
patch('apps/api/src/academics.ts',"LIMIT 500',a.tenant_id,id).map(e=>", "LIMIT 500',a.tenant_id,id).reverse().map(e=>")
patch('apps/web/academic-ui.js','a.day.localeCompare(b.day)||a.id.localeCompare(b.id)','a.day.localeCompare(b.day)||(a.sequence??0)-(b.sequence??0)||a.id.localeCompare(b.id)')
patch('apps/web/academic-ui.js','b.day.localeCompare(a.day)||b.id.localeCompare(a.id)','b.day.localeCompare(a.day)||(b.sequence??0)-(a.sequence??0)||b.id.localeCompare(a.id)')
patch('apps/web/app.js',"if('examId'in options)examId=options.examId;content();}","if('examId'in options)examId=options.examId;content();document.querySelector('.workspace')?.scrollTo(0,0);}")
# Optional single topic annotation per course; the API accepts up to 30.
patch('apps/web/academic-ui.js',"blank:Number(f.get('blank'+i)),divisor:4}","blank:Number(f.get('blank'+i)),divisor:4,topics:String(f.get('topic'+i)??'').trim()?[{name:String(f.get('topic'+i)).trim(),wrong:Number(f.get('topicWrong'+i)),blank:Number(f.get('topicBlank'+i))}]:[]}")
patch('apps/web/academic-ui.js',"</div></fieldset>`).join('');};", "</div><details class=\"chart-data\"><summary>Konu notu ekle (isteğe bağlı)</summary><label>Konu<input name=\"topic${i}\" maxlength=\"80\"></label><div class=\"form-grid\"><label>Konu yanlışı<input name=\"topicWrong${i}\" type=\"number\" min=\"0\" max=\"${q}\" value=\"0\"></label><label>Konu boşu<input name=\"topicBlank${i}\" type=\"number\" min=\"0\" max=\"${q}\" value=\"0\"></label></div></details></fieldset>`).join('');};")
# Snapshot live control state, never passwords; restore the native modal top layer.
p=r/'tests/browser.mjs';s=p.read_text();a=s.index('async function snap(');b=s.index('async function login(',a)
s=s[:a]+'''async function snap(name){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' horizontal overflow');const html=await page.evaluate(css=>{const copy=document.documentElement.cloneNode(true),live=[...document.querySelectorAll('input,textarea,select')],clones=[...copy.querySelectorAll('input,textarea,select')];clones.forEach((node,i)=>{const original=live[i];if(node.tagName==='INPUT'){node.setAttribute('value',original.type==='password'?'':original.value);if(original.checked)node.setAttribute('checked','');else node.removeAttribute('checked');}else if(node.tagName==='TEXTAREA')node.textContent=original.value;else [...node.options].forEach((o,j)=>{if(original.options[j].selected)o.setAttribute('selected','');else o.removeAttribute('selected');});});copy.querySelectorAll('script,link').forEach(n=>n.remove());const style=document.createElement('style');style.textContent=css;copy.querySelector('head').append(style);const script=document.createElement('script');script.textContent="document.querySelectorAll('dialog[open]').forEach(d=>{d.removeAttribute('open');d.showModal();});";copy.querySelector('body').append(script);return '<!doctype html>'+copy.outerHTML;},css);writeFileSync(resolve(output,name+'.html'),html);}
'''+s[b:];p.write_text(s)
# Regression tests for bounded latest history and within-day insertion ordering.
p=r/'tests/academics.test.ts';s=p.read_text()
if 'latest 500' not in s:
 p.write_text(s+'''
test('latest 500 exams retained in insertion order within one day',()=>{const f=fixture();try{let first='',last='';for(let i=0;i<501;i++){const result=f.api.exam(f.actor('ogretmen'),f.id,{...input(),title:'Exam '+i});if(i===0)first=result.id;last=result.id;}const rows=f.api.profile(f.actor('ogrenci'),f.id).exams;assert.equal(rows.length,500);assert.equal(rows.some(e=>e.id===first),false);assert.equal(rows.at(-1)?.id,last);assert.ok(rows[0].sequence<rows.at(-1)!.sequence);}finally{f.s.close();}});
test('same-day comparable exams use sequence rather than random UUID ordering',()=>{const base=input(),older={...base,id:'z',sequence:1},newer={...base,id:'a',sequence:2};assert.deepEqual(comparable([newer,older],newer).map(e=>e.id),['z','a']);});
''')
# Cancel local collection after expiry, but do not claim remote consent was revoked.
(r/'android/app/src/main/java/tr/dershane/app/SessionRecovery.kt').write_text('''package tr.dershane.app
import android.app.Activity
import android.content.Intent
object SessionRecovery {
 fun expire(activity:Activity,state:State) {
  if(activity.isFinishing||activity.isDestroyed)return
  state.enabled=false
  state.token=""
  Queue(activity).use { it.purge() }
  state.status("Oturum süresi doldu. Yerel toplama durdu; yeniden giriş gerekli. Sunucudaki onay otomatik iptal edilmedi.")
  activity.startActivity(Intent(activity,MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK))
  activity.finish()
 }
}
''')
p=r/'android/app/src/main/java/tr/dershane/app/StudentActivity.kt';s=p.read_text();a=s.index(' private fun network(');b=s.index(' private fun reload(',a)
s=s[:a]+''' private fun network(work:()->Unit){
  if(busy||isFinishing||isDestroyed)return
  busy=true
  executor.execute{try{work();runOnUiThread{busy=false;if(!isFinishing&&!isDestroyed)render()}}catch(e:Exception){runOnUiThread{
   busy=false
   if(!isFinishing&&!isDestroyed){if(e is ApiError&&e.status==401)SessionRecovery.expire(this,state) else AlertDialog.Builder(this).setTitle("İşlem tamamlanamadı").setMessage(if(e is ApiError&&e.status==403)"Erişim iznini kurumunla kontrol et. Öğrenci onayı bekleniyor olabilir." else "Bağlantıyı kontrol edip yenileyin. Kayıt boşmuş gibi gösterilmedi.").setPositiveButton("Tamam",null).show()}
  }}}
 }
'''+s[b:]
s=s.replace('.thenBy{it.getString("id")}', '.thenBy{it.optLong("sequence")}')
s=s.replace('.sortedByDescending{it.getString("day")}', '.sortedWith(compareByDescending<JSONObject>{it.getString("day")}.thenByDescending{it.optLong("sequence")})');p.write_text(s)
p=r/'android/app/src/main/java/tr/dershane/app/MainActivity.kt';s=p.read_text();a=s.index(' private fun runNetwork(');b=s.index(' private fun show()',a)
s=s[:a]+''' private fun runNetwork(action:()->Unit){if(isFinishing||isDestroyed)return;executor.execute{try{action();runOnUiThread{if(!isFinishing&&!isDestroyed)show()}}catch(e:Exception){runOnUiThread{if(!isFinishing&&!isDestroyed){if(e is ApiError&&e.status==401&&state.token.isNotEmpty())SessionRecovery.expire(this,state) else AlertDialog.Builder(this).setTitle("İşlem tamamlanamadı").setMessage(if(e is ApiError&&e.code=="PENDING_REVOCATION")"Bekleyen paylaşım iptalini tamamlamak için önceki öğrenci hesabıyla giriş yapın." else if(e is ApiError)"Sunucu: ${e.code}" else "Adres, bağlantı ve giriş bilgilerini kontrol edin.").setPositiveButton("Tamam",null).show()}}}}}
'''+s[b:];p.write_text(s)
patch('android/app/src/main/java/tr/dershane/app/MainActivity.kt','if(state.token.isEmpty()) {','if(state.token.isEmpty()) {\n   state.prefs.getString("status",null)?.let { text(it,14f) }')
patch('android/app/src/main/java/tr/dershane/app/MainActivity.kt','runNetwork { state.prefs.edit().putString("base",url).commit();','runNetwork { val previousStudent=state.prefs.getString("student","");val pending=state.prefs.getBoolean("pendingRevoke",false);state.prefs.edit().putString("base",url).commit();')
patch('android/app/src/main/java/tr/dershane/app/MainActivity.kt','throw IllegalArgumentException("Student only")};Queue(this)', 'throw IllegalArgumentException("Student only")};if(pending){if(previousStudent!=me.getJSONObject("student").getString("id")){try{Api(state).request("/auth/logout",JSONObject())}finally{state.token=""};throw ApiError(409,"PENDING_REVOCATION")};Api(state).request("/consent",JSONObject().put("enabled",false).put("noticeVersion","2026-09-v1"))};Queue(this)')
p=r/'package.json';v=json.loads(p.read_text());v['version']='0.2.0-dev';p.write_text(json.dumps(v,indent=2)+'\n')
patch('apps/api/src/server.ts',"version:'0.1.0-dev'","version:'0.2.0-dev'")
print('V2 review corrections applied; run unit/browser/Android checks.')
