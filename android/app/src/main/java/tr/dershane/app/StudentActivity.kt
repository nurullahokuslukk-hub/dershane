package tr.dershane.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.View
import android.widget.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

class StudentActivity:Activity(){
 private lateinit var state:State
 private lateinit var content:LinearLayout
 private val executor=Executors.newSingleThreadExecutor()
 private var data:JSONObject?=null
 private var tab=0
 private var type="TYT"
 private var selected=0
 private var busy=false
 private fun dp(n:Int)=(n*resources.displayMetrics.density).toInt()
 private val ink=Color.rgb(36,36,46)
 private val muted=Color.rgb(98,97,110)
 private val violet=Color.rgb(109,72,196)
 private fun surface(color:Int=Color.WHITE,radius:Int=26)=GradientDrawable().apply{setColor(color);cornerRadius=dp(radius).toFloat();setStroke(dp(1),Color.WHITE)}
 private fun label(text:String,size:Float=16f,color:Int=ink)=TextView(this).apply{this.text=text;textSize=size;setTextColor(color);setPadding(0,dp(6),0,dp(8))}
 private fun action(text:String,onClick:()->Unit)=Button(this).apply{this.text=text;isAllCaps=false;textSize=16f;minHeight=dp(48);setTextColor(violet);background=surface(Color.rgb(239,233,249),16);setOnClickListener{onClick()}}
 private fun card():LinearLayout{val box=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(16),dp(20),dp(20));background=surface();elevation=dp(1).toFloat()};content.addView(box,LinearLayout.LayoutParams(-1,-2).apply{bottomMargin=dp(16)});return box}
 private fun array(name:String):List<JSONObject>{val a=data?.optJSONArray(name)?:JSONArray();return (0 until a.length()).map{a.getJSONObject(it)}}
 private fun format(v:Double)=if(v.isFinite())java.text.NumberFormat.getNumberInstance(java.util.Locale.forLanguageTag("tr-TR")).apply{maximumFractionDigits=2}.format(v) else "—"
 private fun sid()=state.prefs.getString("student","")?:""
 override fun onCreate(saved:Bundle?){super.onCreate(saved);state=State(this);if(state.token.isEmpty()){startActivity(Intent(this,MainActivity::class.java));finish();return};render();reload()}
 override fun onDestroy(){executor.shutdown();super.onDestroy()}
 private fun network(work:()->Unit){if(busy)return;busy=true;executor.execute{try{work();runOnUiThread{busy=false;if(!isFinishing)render()}}catch(e:Exception){runOnUiThread{busy=false;if(!isFinishing)AlertDialog.Builder(this).setTitle("İşlem tamamlanamadı").setMessage(if(e is ApiError&&e.status==401)"Oturum süresi doldu. Telefon paylaşımı ekranından çıkıp yeniden giriş yapın." else "Bağlantıyı kontrol edip yenileyin. Kayıt boşmuş gibi gösterilmedi.").setPositiveButton("Tamam",null).show()}}}}
 private fun reload(){network{data=Api(state).request("/students/${sid()}/academics")}}
 private fun render(){
  val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setBackgroundColor(Color.rgb(243,243,247));fitsSystemWindows=true;setOnApplyWindowInsetsListener{v,i->v.setPadding(i.systemWindowInsetLeft,i.systemWindowInsetTop,i.systemWindowInsetRight,i.systemWindowInsetBottom);i}}
  content=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(20),dp(20),dp(16))}
  val scroll=ScrollView(this).apply{addView(content)};root.addView(scroll,LinearLayout.LayoutParams(-1,0,1f))
  content.addView(label("dershane.",26f,violet));content.addView(label("Geliştirme sürümü · Gerçek öğrenci verisi kullanmayın",14f,muted))
  content.addView(label(if(tab==0)"Merhaba, ${state.prefs.getString("name","")}" else if(tab==1)"Deneme analizin" else "Planım",28f))
  content.addView(action(if(busy)"Yükleniyor…" else "Verileri yenile"){reload()},LinearLayout.LayoutParams(-1,dp(48)).apply{bottomMargin=dp(20)})
  if(data==null)card().addView(label("Henüz akademik veri yüklenmedi. Bağlantın varken yenile.")) else when(tab){0->home();1->exams();else->plan()}
  val dock=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL;background=surface();setPadding(dp(6),dp(6),dp(6),dp(6));elevation=dp(6).toFloat()}
  listOf("Bugün","Deneme","Planım","Telefon").forEachIndexed{i,title->dock.addView(action(title){if(i==3)startActivity(Intent(this,MainActivity::class.java).putExtra("privacy",true)) else{tab=i;render()}}.apply{textSize=14f;setPadding(dp(4),dp(3),dp(4),dp(3));background=surface(if(i==tab)Color.rgb(239,233,249) else Color.WHITE,20);setCompoundDrawablesWithIntrinsicBounds(0,listOf(R.drawable.ic_home,R.drawable.ic_chart,R.drawable.ic_plan,R.drawable.ic_phone)[i],0,0)},LinearLayout.LayoutParams(0,dp(52),1f).apply{marginStart=dp(2);marginEnd=dp(2)})}
  root.addView(dock,LinearLayout.LayoutParams(-1,-2).apply{setMargins(dp(16),dp(4),dp(16),dp(16))});setContentView(root)
 }
 private fun home(){val exams=array("exams").sortedWith(compareBy<JSONObject>{it.getString("day")}.thenBy{it.getString("id")});val last=exams.lastOrNull();val box=card();box.addView(label("SON DENEME",14f,muted));box.addView(label(if(last==null)"—" else "${format(last.getDouble("net"))} net",44f));box.addView(label(last?.getString("title")?:"Henüz sonuç girilmedi.",16f,muted));if(last!=null){val series=exams.filter{examSignature(it)==examSignature(last)}.takeLast(6);if(series.size>=2)box.addView(NetChart(series.map{it.getDouble("net")},series.map{it.getString("day").substring(5)}),LinearLayout.LayoutParams(-1,dp(180)))};box.addView(label("Aynı ders dağılımı karşılaştırılır. Net, yerleştirme puanı değildir.",14f,muted));box.addView(action("Denemelerimi incele"){tab=1;render()});val tasks=array("tasks");card().apply{addView(label("Çalışma planın",22f));addView(label("${tasks.count{it.getString("state")=="verified"}} / ${tasks.size} ödev tamamlandı"));addView(action("Planıma git"){tab=2;render()})}}
 private fun examSignature(e:JSONObject):String{val a=e.getJSONArray("subjects");return e.getString("type")+(0 until a.length()).map{val s=a.getJSONObject(it);s.getString("name")+":"+(s.getInt("correct")+s.getInt("wrong")+s.getInt("blank"))+":"+s.getInt("divisor")}.sorted().joinToString("|")}
 private fun exams(){val picker=Spinner(this);picker.adapter=ArrayAdapter(this,android.R.layout.simple_spinner_dropdown_item,listOf("TYT","AYT"));picker.setSelection(if(type=="TYT")0 else 1);picker.onItemSelectedListener=object:AdapterView.OnItemSelectedListener{override fun onNothingSelected(p:AdapterView<*>?){};override fun onItemSelected(p:AdapterView<*>?,v:View?,position:Int,id:Long){val next=if(position==0)"TYT" else "AYT";if(next!=type){type=next;selected=0;render()}}};content.addView(picker,LinearLayout.LayoutParams(-1,dp(52)));val rows=array("exams").filter{it.getString("type")==type}.sortedByDescending{it.getString("day")};if(rows.isEmpty()){card().addView(label("Bu sınav türünde sonuç yok. Eksik veri sıfır net değildir."));return};selected=selected.coerceIn(0,rows.size-1);val chooser=Spinner(this);chooser.adapter=ArrayAdapter(this,android.R.layout.simple_spinner_dropdown_item,rows.map{it.getString("title")+" · "+it.getString("day")});chooser.setSelection(selected);chooser.onItemSelectedListener=object:AdapterView.OnItemSelectedListener{override fun onNothingSelected(p:AdapterView<*>?){};override fun onItemSelected(p:AdapterView<*>?,v:View?,position:Int,id:Long){if(position!=selected){selected=position;render()}}};content.addView(chooser,LinearLayout.LayoutParams(-1,dp(52)));val e=rows[selected];card().apply{addView(label("${format(e.getDouble("net"))} net",38f));addView(label("${e.getInt("correct")} doğru · ${e.getInt("wrong")} yanlış · ${e.getInt("blank")} boş"))};val subjects=e.getJSONArray("subjects");for(i in 0 until subjects.length()){val s=subjects.getJSONObject(i);card().apply{addView(label(s.getString("name"),22f));addView(label("${format(s.getDouble("net"))} net",30f,violet));addView(label("${s.getInt("correct")} doğru · ${s.getInt("wrong")} yanlış · ${s.getInt("blank")} boş"));addView(label("Net = doğru − yanlış / ${s.getInt("divisor")}",14f,muted))}}}
 private fun plan(){val tasks=array("tasks");if(tasks.isEmpty())card().addView(label("Henüz atanmış ödev yok."));tasks.forEach{t->card().apply{addView(label(t.getString("subject"),14f,violet));addView(label(t.getString("title"),22f));addView(label(t.getString("description")));addView(label("Son gün: ${t.getString("dueDay")}",14f,muted));addView(label(when(t.getString("state")){"submitted"->"Kontrol bekliyor";"verified"->"Tamamlandı";"needs_revision"->"Düzeltme istendi";else->"Bekliyor"},16f,violet));if(t.optString("reviewNote").isNotBlank())addView(label("Geri bildirim: ${t.getString("reviewNote")}"));if(t.getString("state") in listOf("assigned","needs_revision"))addView(action("Teslim et"){val note=EditText(this@StudentActivity).apply{hint="Teslim notu (isteğe bağlı)";maxLines=5};AlertDialog.Builder(this@StudentActivity).setTitle("Ödevi teslim et").setView(note).setNegativeButton("Vazgeç",null).setPositiveButton("Gönder"){_,_->val text=note.text.toString();network{Api(state).request("/students/${sid()}/tasks/${t.getString("id")}/transition",JSONObject().put("version",t.getInt("version")).put("state","submitted").put("note",text));data=Api(state).request("/students/${sid()}/academics")}}.show()})}};content.addView(label("Etüt takvimi",24f));array("sessions").forEach{s->card().apply{addView(label(s.getString("title"),20f));val start=java.time.Instant.parse(s.getString("startsAt")).atZone(java.time.ZoneId.of("Europe/Istanbul"));addView(label(start.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))+" · Türkiye saati"));addView(label(when(s.getString("state")){"present"->"Katıldı";"absent"->"Katılmadı";"excused"->"İzinli";else->"Planlandı"},14f,muted))}}}
 private inner class NetChart(private val values:List<Double>,private val labels:List<String>):View(this@StudentActivity){
  private val paint=Paint(Paint.ANTI_ALIAS_FLAG)
  init{contentDescription=values.indices.joinToString("; "){labels[it]+": "+format(values[it])+" net"}}
  override fun onDraw(c:Canvas){
   super.onDraw(c);if(values.size<2||values.any{!it.isFinite()})return
   val left=dp(40).toFloat();val right=width-dp(8).toFloat();val top=dp(12).toFloat();val bottom=height-dp(32).toFloat()
   val low=minOf(0.0,kotlin.math.floor(values.min()/20)*20);val high=maxOf(20.0,kotlin.math.ceil(values.max()/20)*20)
   fun x(i:Int)=left+i*(right-left)/(values.size-1)
   fun y(v:Double)=bottom-((v-low)/(high-low)*(bottom-top)).toFloat()
   paint.textSize=14*resources.displayMetrics.scaledDensity;paint.strokeWidth=dp(1).toFloat()
   for(i in 0..4){val v=low+(high-low)*i/4;paint.color=Color.rgb(225,220,233);c.drawLine(left,y(v),right,y(v),paint);paint.color=muted;paint.textAlign=Paint.Align.LEFT;c.drawText(format(v),0f,y(v)+dp(4),paint)}
   val path=Path();values.forEachIndexed{i,v->if(i==0)path.moveTo(x(i),y(v))else path.lineTo(x(i),y(v))};paint.color=violet;paint.style=Paint.Style.STROKE;paint.strokeWidth=dp(2).toFloat();c.drawPath(path,paint);paint.style=Paint.Style.FILL;values.forEachIndexed{i,v->c.drawCircle(x(i),y(v),dp(3).toFloat(),paint)}
   paint.color=muted;listOf(0,values.size/2,values.lastIndex).distinct().forEach{i->paint.textAlign=if(i==0)Paint.Align.LEFT else if(i==values.lastIndex)Paint.Align.RIGHT else Paint.Align.CENTER;c.drawText(labels[i],x(i),height-dp(6).toFloat(),paint)}
  }
 }
}
