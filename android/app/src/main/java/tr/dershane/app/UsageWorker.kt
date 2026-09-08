package tr.dershane.app
import android.content.Context
import androidx.work.*
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.concurrent.TimeUnit
class UsageWorker(context:Context,params:WorkerParameters):Worker(context,params) {
 override fun doWork():Result = synchronized(lock) {
  val state=State(applicationContext);val queue=Queue(applicationContext);val api=Api(state)
  try {
   if(state.token.isEmpty())return@synchronized Result.success()
   if(state.enabled && UsageCollector.allowed(applicationContext))state.prefs.edit().putBoolean("permissionActivated",true).commit()
   if(state.enabled && !UsageCollector.allowed(applicationContext) && !state.prefs.getBoolean("permissionActivated",false))return@synchronized Result.success()
   if(state.enabled && !UsageCollector.allowed(applicationContext)) { state.enabled=false;queue.purge();state.prefs.edit().putBoolean("pendingRevoke",true).commit() }
   if(state.prefs.getBoolean("pendingRevoke",false)) { api.request("/consent",JSONObject().put("enabled",false).put("noticeVersion","2026-09-v1"));state.prefs.edit().putBoolean("pendingRevoke",false).commit();state.status("Paylaşım kapalı; sunucuya iptal iletildi.") }
   if(!state.enabled)return@synchronized Result.success()
   val consent=api.request("/consent")
   if(consent.optInt("enabled")==0 || consent.optInt("version")!=state.prefs.getInt("consentVersion",0)) { state.enabled=false;queue.purge();state.status("İzin değişti. Paylaşım durduruldu.");return@synchronized Result.success() }
   state.prefs.edit().putLong("granted",Instant.parse(consent.getString("granted_at")).toEpochMilli()).commit()
   queue.expire()
   fun sendPending() { for((id,body) in queue.pending()) { if(!state.enabled || !UsageCollector.allowed(applicationContext))throw ApiError(403,"LOCAL_PERMISSION_REVOKED");api.request("/usage/batches",body);queue.remove(id) } }
   sendPending()
   val today=LocalDate.now(ZoneId.of("Europe/Istanbul"))
   for(date in listOf(today.minusDays(1),today))UsageCollector.collect(applicationContext,state,date)?.let { queue.add(it) }
   sendPending();state.status("Kullanım süreleri senkronize edildi. Kısmi ölçüm olabilir.");Result.success()
  } catch(e:ApiError) {
   state.status(when(e.status){401->"Oturum sona erdi. Yeniden giriş yapın.";403->"İzin/erişim kapalı. Toplama durduruldu.";409->"Kayıt/izin çakışması. Destek incelemesi gerekli.";else->"Senkronizasyon bekliyor: ${e.code}"})
   if(e.status==403) { state.enabled=false;queue.purge();if(e.code=="LOCAL_PERMISSION_REVOKED")state.prefs.edit().putBoolean("pendingRevoke",true).commit() }
   if(e.status==429 || e.status>=500 || e.code=="LOCAL_PERMISSION_REVOKED")Result.retry() else Result.failure()
  } catch(e:Exception) { state.status("Bağlantı yok veya işlem başarısız. Kuyruk korunuyor.");Result.retry() }
  finally { queue.close() }
 }
 companion object {
  val lock=Any()
  fun schedule(context:Context) { val constraint=Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();val manager=WorkManager.getInstance(context)
   manager.enqueueUniquePeriodicWork("usage-periodic",ExistingPeriodicWorkPolicy.KEEP,PeriodicWorkRequestBuilder<UsageWorker>(15,TimeUnit.MINUTES).setConstraints(constraint).setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.SECONDS).build())
  }
  fun now(context:Context) { WorkManager.getInstance(context).enqueueUniqueWork("usage-now",ExistingWorkPolicy.KEEP,OneTimeWorkRequestBuilder<UsageWorker>().setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build()) }
 }
}
