package com.dershane.ogrenci.auth

import com.dershane.ogrenci.data.SupabaseProvider
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.builtin.Phone
import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class StudentAccount(
    val id: String,
    @SerialName("full_name") val fullName: String,
    val role: String,
    val status: String,
)

sealed interface AuthResult {
    data class SignedIn(val account: StudentAccount) : AuthResult
    data object SignedOut : AuthResult
    data object NotAStudent : AuthResult
    data class Failure(val message: String) : AuthResult
}

class AuthRepository {
    private val supabase get() = SupabaseProvider.client

    suspend fun restoreSession(): AuthResult {
        return if (supabase.auth.currentSessionOrNull() == null) {
            AuthResult.SignedOut
        } else {
            validateStudent()
        }
    }

    suspend fun signIn(identifier: String, password: String): AuthResult {
        return try {
            if (identifier.contains("@")) {
                supabase.auth.signInWith(Email) {
                    email = identifier.trim()
                    this.password = password
                }
            } else {
                supabase.auth.signInWith(Phone) {
                    phone = identifier.trim()
                    this.password = password
                }
            }
            validateStudent()
        } catch (error: Exception) {
            AuthResult.Failure(error.message ?: "Giriş yapılamadı. Bilgilerini kontrol edip tekrar dene.")
        }
    }

    suspend fun sendPasswordReset(email: String): AuthResult {
        return try {
            supabase.auth.resetPasswordForEmail(email.trim())
            AuthResult.SignedOut
        } catch (error: Exception) {
            AuthResult.Failure(error.message ?: "Sıfırlama bağlantısı gönderilemedi.")
        }
    }

    suspend fun signOut() {
        supabase.auth.signOut()
    }

    private suspend fun validateStudent(): AuthResult {
        return try {
            val authUserId = supabase.auth.currentUserOrNull()?.id
                ?: return AuthResult.SignedOut
            val account = supabase.from("user_account")
                .select {
                    filter {
                        eq("auth_user_id", authUserId)
                        eq("role", "ogrenci")
                        eq("status", "active")
                    }
                }
                .decodeSingleOrNull<StudentAccount>()

            if (account == null) {
                supabase.auth.signOut()
                AuthResult.NotAStudent
            } else {
                AuthResult.SignedIn(account)
            }
        } catch (error: Exception) {
            AuthResult.Failure(error.message ?: "Oturum doğrulanamadı.")
        }
    }
}
