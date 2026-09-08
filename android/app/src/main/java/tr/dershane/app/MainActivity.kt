package tr.dershane.app
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.view.View
import android.widget.*
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.Executors
class MainActivity:Activity() {
 private lateinit var state:State;private lateinit var layout:LinearLayout;private val executor=Executors.newSingleThreadExecutor()
 override fun onCreate(saved:Bundle?) { super.onCreate(saved);state=State(this);show() }
 override fun onResume() { super.onResume();if(::state.isInitialized) { if(state.enabled)UsageWorker.now(this);show() } }
 override fun onDestroy() { executor.shutdown();super.onDestroy() }
 private fun text(s:String,size:Float=16f) { layout.addView(TextView(this).apply { text=s;textSize=size;setPadding(0,12,0,16) }) }
 private fun field(hint:String,value:String="",password:Boolean=false):EditText { val e=EditText(this).apply { this.hint=hint;setText(value);setSingleLine();inputType=if(password)InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD else InputType.TYPE_CLASS_TEXT;minHeight=56;contentDescription=hint };layout.addView(e);return e }
 private fun button(label:String,action:()->Unit) { layout.addView(Button(this).apply { text=label;minHeight=56;setOnClickListener { action() } }) }
 private fun runNetwork(action:()->Unit) { executor.execute { try { action();runOnUiThread { show() } } catch(e:Exception) { runOnUiThread { AlertDialog.Builder(this).setTitle("İşlem tamamlanamadı").setMessage(if(e is ApiError)"Sunucu: ${e.code}" else "Adres, bağlantı ve giriş bilgilerini kontrol edin.").setPositiveButton("Tamam",null).show() } } } }
 private fun show() {
  layout=LinearLayout(this).apply { orientation=LinearLayout.VERTICAL;setPadding(24,24,24,24) }
  val scroll=ScrollView(this).apply { addView(layout);fitsSystemWindows=true };scroll.setOnApplyWindowInsetsListener { view,insets->view.setPadding(insets.systemWindowInsetLeft,insets.systemWindowInsetTop,insets.systemWindowInsetRight,insets.systemWindowInsetBottom);insets };setContentView(scroll)
  text("Dershane",30f);text("Geliştirme sürümü · Gerçek öğrenci verisi kullanmayın.",14f)
  if(state.token.isEmpty()) {
   val base=field("HTTPS sunucu adresi",state.prefs.getString("base",if(BuildConfig.DEBUG)"http://127.0.0.1:3100" else "")?:"")
   val tenant=field("Kurum kodu","cizre-demo");val user=field("Kullanıcı kodu","ogrenci");val pass=field("Parola",password=true)
   button("Giriş yap") { val url=base.text.toString().trim();val institution=tenant.text.toString().trim();val login=user.text.toString().trim();val password=pass.text.toString();runNetwork { state.prefs.edit().putString("base",url).commit();val result=Api(state).request("/auth/login",JSONObject().put("tenant",institution).put("login",login).put("password",password));state.token=result.getString("accessToken");val me=Api(state).request("/me");if(me.getString("role")!="student") {state.token="";throw IllegalArgumentException("Student only")};Queue(this).use { it.purge() };state.enabled=false;state.prefs.edit().putString("student",me.getJSONObject("student").getString("id")).putString("name",me.getString("name")).putString("installation",UUID.randomUUID().toString()).putBoolean("pendingRevoke",false).commit() } }
   text("Telefon izni olmadan da çalışma kaydı tutulabilir. Kullanım paylaşımı girişten sonra ayrı seçilir.",14f);return
  }
  text("Merhaba, ${state.prefs.getString("name","")}",24f)
  text(state.prefs.getString("status","Çalışma kaydı ekleyebilir veya isteğe bağlı paylaşımı açabilirsiniz.")?:"")
  button("Çalışma kaydı ekle") { val minutes=EditText(this).apply { hint="Dakika (1–720)";inputType=InputType.TYPE_CLASS_NUMBER };AlertDialog.Builder(this).setTitle("Matematik çalışması").setView(minutes).setNegativeButton("İptal",null).setPositiveButton("Kaydet") { _,_->val value=minutes.text.toString().toIntOrNull()?:0;runNetwork { Api(state).request("/students/${state.prefs.getString("student","")}/records",JSONObject().put("clientRecordId",UUID.randomUUID().toString()).put("kind","study").put("day",java.time.LocalDate.now(java.time.ZoneId.of("Europe/Istanbul")).toString()).put("payload",JSONObject().put("subject","Matematik").put("value",value)));state.status("Çalışma kaydı kaydedildi.") } }.show() }
  text("İsteğe bağlı kullanım paylaşımı",22f)
  text("Uygulama adı/paket adı ve uygulama başına günlük ön plan süresi cihaz bilgisiyle dershane sunucusuna gider. Sunucuda kategoriye ayrılır; siz ve size atanmış rehberlik görebilir. Mesaj, fotoğraf, ekran içeriği, konum, mikrofon veya kamera alınmaz. Paylaşmamak temel işlevleri engellemez. Paylaşımı istediğiniz zaman kapatabilirsiniz.")
  text("Bu geliştirme onayı hukuki veli/temsil sürecinin yerine geçmez. Üretim öncesi bu süreç tamamlanmalıdır.",14f)
  if(!state.enabled)button("Kullanım paylaşımını onaylıyorum") { runNetwork { val api=Api(state);api.request("/consent",JSONObject().put("enabled",true).put("noticeVersion","2026-09-v1"));val c=api.request("/consent");val device=api.request("/devices",JSONObject().put("installationId",state.prefs.getString("installation","")));state.prefs.edit().putInt("consentVersion",c.getInt("version")).putLong("granted",java.time.Instant.parse(c.getString("granted_at")).toEpochMilli()).putString("device",device.getString("id")).commit();Queue(this).use { it.purge() };state.prefs.edit().putBoolean("permissionActivated",UsageCollector.allowed(this)).putBoolean("pendingRevoke",false).commit();state.enabled=true;state.status("Şimdi Android kullanım erişimi iznini açın.");UsageWorker.schedule(this) } }
  button("Paylaşmadan devam et / paylaşımı kapat") { state.enabled=false;Queue(this).use { it.purge() };state.prefs.edit().putBoolean("pendingRevoke",true).commit();state.status("Yerel toplama durdu. Sunucu iptali bağlantı geldiğinde iletilecek.");UsageWorker.schedule(this);UsageWorker.now(this);show() }
  if(state.enabled)button("Android kullanım erişimini aç") { startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
  text("Android izni: ${if(UsageCollector.allowed(this))"Açık" else "Kapalı"}",14f)
  button("Senkronize et / durumu yenile") { UsageWorker.now(this);show() }
  button("Çıkış") { runNetwork { if(state.prefs.getBoolean("pendingRevoke",false))Api(state).request("/consent",JSONObject().put("enabled",false).put("noticeVersion","2026-09-v1"));Api(state).request("/auth/logout",JSONObject());state.enabled=false;state.token="";Queue(this).use { it.purge() };state.prefs.edit().clear().commit() } }
 }
}
