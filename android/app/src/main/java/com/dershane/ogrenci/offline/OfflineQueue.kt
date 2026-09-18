package com.dershane.ogrenci.offline

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Index
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.dershane.ogrenci.data.SupabaseProvider
import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.util.UUID

/**
 * Offline student mutations preserve the original clientRecordId. Retrying an upsert can
 * therefore never create a second server record for the same student action.
 */
@Entity(
    tableName = "pending_student_writes",
    indices = [Index(value = ["clientRecordId"], unique = true)],
)
data class PendingStudentWrite(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val tableName: String,
    val clientRecordId: String,
    val payload: String,
    val createdAtMillis: Long = System.currentTimeMillis(),
    val attempts: Int = 0,
)

@Dao
interface PendingStudentWriteDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(write: PendingStudentWrite)

    @Query("select * from pending_student_writes order by createdAtMillis asc limit :limit")
    suspend fun nextBatch(limit: Int): List<PendingStudentWrite>

    @Query("delete from pending_student_writes where id = :id")
    suspend fun remove(id: String)

    @Query("update pending_student_writes set attempts = attempts + 1 where id = :id")
    suspend fun markAttempt(id: String)
}

@Database(entities = [PendingStudentWrite::class], version = 1, exportSchema = false)
abstract class OfflineQueueDatabase : RoomDatabase() {
    abstract fun writes(): PendingStudentWriteDao

    companion object {
        @Volatile private var instance: OfflineQueueDatabase? = null

        fun get(context: Context): OfflineQueueDatabase = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(
                context.applicationContext,
                OfflineQueueDatabase::class.java,
                "student-offline-queue.db",
            ).build().also { instance = it }
        }
    }
}

class OfflineWriteQueue(context: Context) {
    private val appContext = context.applicationContext
    private val writes = OfflineQueueDatabase.get(appContext).writes()

    suspend fun enqueue(tableName: String, clientRecordId: String, payload: JsonObject) {
        require(payload["client_record_id"]?.jsonPrimitive?.content == clientRecordId) {
            "Queued payload must keep its original client_record_id."
        }
        writes.insert(
            PendingStudentWrite(
                tableName = tableName,
                clientRecordId = clientRecordId,
                payload = payload.toString(),
            ),
        )
        OfflineSyncWorker.schedule(appContext)
    }
}

class OfflineSyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val writes = OfflineQueueDatabase.get(applicationContext).writes()
        for (write in writes.nextBatch(limit = 50)) {
            try {
                val payload = Json.decodeFromString<JsonObject>(write.payload)
                SupabaseProvider.client.from(write.tableName).upsert(payload) {
                    onConflict = "tenant_id,client_record_id"
                }
                writes.remove(write.id)
            } catch (_: Exception) {
                writes.markAttempt(write.id)
                return Result.retry()
            }
        }
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "student_offline_sync"

        fun schedule(context: Context) {
            val request = OneTimeWorkRequestBuilder<OfflineSyncWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(context.applicationContext).enqueueUniqueWork(
                WORK_NAME,
                ExistingWorkPolicy.KEEP,
                request,
            )
        }
    }
}
