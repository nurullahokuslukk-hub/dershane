package tr.dershane.app
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
class ApiError(val status: Int, val code: String): Exception(code)
class Api(private val state: State) {
 fun request(path: String, body: JSONObject? = null): JSONObject {
  val base=state.prefs.getString("base","")!!.trimEnd('/')
  val uri=URI(base)
  require(uri.userInfo==null && uri.query==null && uri.fragment==null && (uri.path.isNullOrEmpty() || uri.path=="/"))
  require(uri.scheme=="https" || (BuildConfig.DEBUG && uri.scheme=="http" && uri.host in listOf("10.0.2.2","127.0.0.1","localhost")))
  val connection=URI(base+"/api/v1"+path).toURL().openConnection() as HttpURLConnection
  connection.connectTimeout=10000;connection.readTimeout=15000;connection.instanceFollowRedirects=false
  connection.setRequestProperty("X-Client","android");connection.setRequestProperty("Content-Type","application/json")
  if(state.token.isNotEmpty())connection.setRequestProperty("Authorization","Bearer ${state.token}")
  try { if(body!=null) { connection.requestMethod="POST";connection.doOutput=true;connection.outputStream.use { it.write(body.toString().toByteArray()) } }
   val code=connection.responseCode
   val stream=if(code in 200..299)connection.inputStream else connection.errorStream
   val text=stream?.bufferedReader()?.use { it.readText() } ?: "{}"
   val json=try { JSONObject(text) } catch(e:Exception) { JSONObject() }
   if(code !in 200..299) throw ApiError(code,json.optString("error","HTTP_ERROR"))
   return json
  } finally { connection.disconnect() }
 }
}
