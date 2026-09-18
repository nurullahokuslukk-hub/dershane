package com.dershane.ogrenci.data

import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.LocalDate
import java.util.UUID

@Serializable
private data class StudentProfileRow(
    val id: String,
    @SerialName("tenant_id") val tenantId: String,
)

@Serializable
data class DershanePresence(
    val id: String,
    @SerialName("attendance_date") val attendanceDate: String,
    val attended: Boolean,
    @SerialName("arrived_at") val arrivedAt: String? = null,
    @SerialName("departed_at") val departedAt: String? = null,
)

@Serializable
private data class PresenceUpsert(
    @SerialName("tenant_id") val tenantId: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("attendance_date") val attendanceDate: String,
    val attended: Boolean,
    @SerialName("arrived_at") val arrivedAt: String? = null,
    @SerialName("departed_at") val departedAt: String? = null,
    @SerialName("client_record_id") val clientRecordId: String,
)

class DershanePresenceRepository {
    private val supabase get() = SupabaseProvider.client

    suspend fun loadToday(accountId: String): DershanePresence? {
        val profile = profile(accountId)
        return supabase.from("daily_dershane_presence")
            .select {
                filter {
                    eq("tenant_id", profile.tenantId)
                    eq("student_id", profile.id)
                    eq("attendance_date", LocalDate.now().toString())
                }
            }
            .decodeSingleOrNull<DershanePresence>()
    }

    suspend fun reportArrival(accountId: String, attended: Boolean, arrivedAt: String?): DershanePresence? {
        if (attended && !isValidTime(arrivedAt)) {
            throw IllegalArgumentException("Giriş saatini SS:DD biçiminde yaz.")
        }
        val profile = profile(accountId)
        val row = PresenceUpsert(
            tenantId = profile.tenantId,
            studentId = profile.id,
            attendanceDate = LocalDate.now().toString(),
            attended = attended,
            arrivedAt = if (attended) arrivedAt else null,
            clientRecordId = UUID.randomUUID().toString(),
        )
        supabase.from("daily_dershane_presence").upsert(row) {
            onConflict = "tenant_id,student_id,attendance_date"
        }
        return loadToday(accountId)
    }

    suspend fun reportDeparture(accountId: String, departedAt: String): DershanePresence? {
        if (!isValidTime(departedAt)) {
            throw IllegalArgumentException("Çıkış saatini SS:DD biçiminde yaz.")
        }
        val current = loadToday(accountId) ?: return null
        if (!current.attended) return current
        val profile = profile(accountId)
        val row = PresenceUpsert(
            tenantId = profile.tenantId,
            studentId = profile.id,
            attendanceDate = current.attendanceDate,
            attended = true,
            arrivedAt = current.arrivedAt,
            departedAt = departedAt,
            clientRecordId = UUID.randomUUID().toString(),
        )
        supabase.from("daily_dershane_presence").upsert(row) {
            onConflict = "tenant_id,student_id,attendance_date"
        }
        return loadToday(accountId)
    }

    private suspend fun profile(accountId: String): StudentProfileRow = supabase.from("student_profile")
        .select { filter { eq("user_id", accountId) } }
        .decodeSingle<StudentProfileRow>()

    private fun isValidTime(value: String?): Boolean =
        value?.matches(Regex("(?:[01]\\d|2[0-3]):[0-5]\\d")) == true
}
