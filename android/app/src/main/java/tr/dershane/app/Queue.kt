package tr.dershane.app
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONObject
class Queue(context:Context):SQLiteOpenHelper(context,"outbox.db",null,1) {
 private val state=State(context)
 override fun onCreate(db:SQLiteDatabase) { db.execSQL("CREATE TABLE queue(id TEXT PRIMARY KEY, body TEXT NOT NULL, created INTEGER NOT NULL)") }
 override fun onUpgrade(db:SQLiteDatabase,old:Int,new:Int) { error("Explicit migration required") }
 fun add(body:JSONObject) { writableDatabase.execSQL("INSERT OR IGNORE INTO queue VALUES(?,?,?)",arrayOf(body.getString("batchId"),state.seal(body.toString()),System.currentTimeMillis())) }
 fun pending():List<Pair<String,JSONObject>> { val rows=mutableListOf<Pair<String,JSONObject>>();readableDatabase.rawQuery("SELECT id,body FROM queue ORDER BY created LIMIT 16",null).use { c->while(c.moveToNext())rows.add(c.getString(0) to JSONObject(state.open(c.getString(1)))) };return rows }
 fun remove(id:String) { writableDatabase.delete("queue","id=?",arrayOf(id)) }
 fun purge() { writableDatabase.delete("queue",null,null) }
 fun expire() { writableDatabase.delete("queue","created<?",arrayOf((System.currentTimeMillis()-7*86400000L).toString())) }
}
