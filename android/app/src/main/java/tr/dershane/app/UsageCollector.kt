package tr.dershane.app
import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Process
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneId
import java.util.UUID
object UsageCollector {
 fun allowed(context:Context):Boolean = (context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager).unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,Process.myUid(),context.packageName)==AppOpsManager.MODE_ALLOWED
 fun collect(context:Context,state:State,localDate:java.time.LocalDate):JSONObject? {
  check(state.enabled && allowed(context))
  val zone=ZoneId.of("Europe/Istanbul");val end=minOf(localDate.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli(),System.currentTimeMillis())
  val start=maxOf(localDate.atStartOfDay(zone).toInstant().toEpochMilli(),state.prefs.getLong("granted",Long.MAX_VALUE))
  if(end-start<1000)return null
  val manager=context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
  val events=manager.queryEvents(start-86400000L,end) ?: return null
  val rows=mutableListOf<ForegroundEvent>();val event=UsageEvents.Event()
  while(events.hasNextEvent()) { events.getNextEvent(event);val kind=when(event.eventType) { UsageEvents.Event.ACTIVITY_RESUMED->1;UsageEvents.Event.ACTIVITY_PAUSED->2;UsageEvents.Event.SCREEN_NON_INTERACTIVE,UsageEvents.Event.DEVICE_SHUTDOWN,UsageEvents.Event.DEVICE_STARTUP->3;else->0 };if(kind!=0)rows.add(ForegroundEvent(event.timeStamp,kind,event.packageName)) }
  val totals=ForegroundReducer.aggregate(rows,start,end).filterKeys { it!=context.packageName && it.contains('.') }
  val apps=JSONArray();totals.toSortedMap().forEach { (pkg,seconds)->apps.put(JSONObject().put("packageName",pkg).put("seconds",seconds)) }
  val revisionKey="revision:${state.prefs.getString("device","")}:$localDate"
  val revision=state.prefs.getInt(revisionKey,0)+1;state.prefs.edit().putInt(revisionKey,revision).commit()
  // OS events can be incomplete; never call this exact screen time.
  return JSONObject().put("batchId",UUID.randomUUID().toString()).put("deviceId",state.prefs.getString("device",""))
   .put("consentVersion",state.prefs.getInt("consentVersion",0)).put("day",localDate.toString()).put("revision",revision)
   .put("windowStart",Instant.ofEpochMilli(start).toString()).put("windowEnd",Instant.ofEpochMilli(end).toString())
   .put("timezone","Europe/Istanbul").put("quality","limited").put("apps",apps)
 }
}
