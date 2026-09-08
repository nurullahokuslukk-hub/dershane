package tr.dershane.app
import org.junit.Test
import org.junit.Assert.assertEquals
class ForegroundReducerTest {
 @Test fun splitsForegroundWithoutDoubleCount() {
  val events=listOf(ForegroundEvent(0,1,"a.app"),ForegroundEvent(10000,1,"b.app"),ForegroundEvent(11000,2,"a.app"),ForegroundEvent(20000,3,null))
  assertEquals(mapOf("a.app" to 5L,"b.app" to 10L),ForegroundReducer.aggregate(events,5000,30000))
 }
 @Test fun ignoresUnknownBackgroundAndHandlesDuplicateResume() {
  assertEquals(mapOf("a.app" to 10L),ForegroundReducer.aggregate(listOf(ForegroundEvent(5000,1,"a.app"),ForegroundEvent(8000,1,"a.app")),5000,15000))
 }
 @Test fun emptyEventsAreNotFabricated() { assertEquals(emptyMap<String,Long>(),ForegroundReducer.aggregate(emptyList(),0,10000)) }
}
