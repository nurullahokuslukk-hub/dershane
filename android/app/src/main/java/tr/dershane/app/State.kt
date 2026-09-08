package tr.dershane.app
import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class State(context: Context) {
 val prefs = context.getSharedPreferences("account", Context.MODE_PRIVATE)
 private fun key(): SecretKey { val ks=KeyStore.getInstance("AndroidKeyStore").apply { load(null) }; return (ks.getKey("session",null) as? SecretKey) ?: KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore").run { init(KeyGenParameterSpec.Builder("session",KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());generateKey() } }
 fun seal(value: String): String { val c=Cipher.getInstance("AES/GCM/NoPadding"); c.init(Cipher.ENCRYPT_MODE,key());return Base64.encodeToString(c.iv+c.doFinal(value.toByteArray()),Base64.NO_WRAP) }
 fun open(value: String): String { val b=Base64.decode(value,Base64.NO_WRAP);val c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(),GCMParameterSpec(128,b.copyOfRange(0,12)));return String(c.doFinal(b.copyOfRange(12,b.size))) }
 var token: String
  get() = prefs.getString("token",null)?.let { try { open(it) } catch(e:Exception) { "" } } ?: ""
  set(value) { if(value.isEmpty())prefs.edit().remove("token").commit() else prefs.edit().putString("token",seal(value)).commit() }
 var enabled: Boolean
  get() = prefs.getBoolean("enabled",false)
  set(value) { prefs.edit().putBoolean("enabled",value).commit() }
 fun status(message: String) { prefs.edit().putString("status",message).commit() }
}
