package tr.dershane.app
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
