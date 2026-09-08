package tr.dershane.app

/** Single-foreground approximation, not exact screen time. No raw events leave the device. */
data class ForegroundEvent(val time: Long, val type: Int, val packageName: String?)
object ForegroundReducer {
 const val RESUME = 1; const val PAUSE = 2; const val STOP = 3
 fun aggregate(events: List<ForegroundEvent>, start: Long, end: Long): Map<String, Long> {
  require(end > start)
  val totals = mutableMapOf<String, Long>(); var current: String? = null; var since = start
  fun flush(at: Long) { val pkg = current ?: return; val duration = (minOf(at, end) - maxOf(since, start)).coerceAtLeast(0); if(duration>0) totals[pkg] = (totals[pkg] ?: 0) + duration }
  for(event in events.sortedBy { it.time }) {
   if(event.time >= end) break
   when(event.type) {
    RESUME -> { if(event.packageName != current) { flush(event.time); current = event.packageName; since = event.time } }
    PAUSE -> { if(event.packageName == current) { flush(event.time); current = null } }
    STOP -> { flush(event.time); current = null }
   }
  }
  flush(end)
  return totals.mapValues { it.value / 1000 }.filterValues { it > 0 }
 }
}
