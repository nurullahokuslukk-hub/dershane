package com.dershane.ogrenci.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AuthUiState {
    data object CheckingSession : AuthUiState
    data object SignedOut : AuthUiState
    data class SignedIn(val account: StudentAccount) : AuthUiState
    data class Failure(val message: String) : AuthUiState
    data class ResetEmailSent(val email: String) : AuthUiState
}

class AuthViewModel(
    private val repository: AuthRepository = AuthRepository(),
) : ViewModel() {
    private val _state = MutableStateFlow<AuthUiState>(AuthUiState.CheckingSession)
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch { applyResult(repository.restoreSession()) }
    }

    fun signIn(identifier: String, password: String) {
        if (identifier.isBlank() || password.isBlank()) {
            _state.value = AuthUiState.Failure("E-posta/telefon ve şifre gerekli.")
            return
        }
        _state.value = AuthUiState.CheckingSession
        viewModelScope.launch { applyResult(repository.signIn(identifier, password)) }
    }

    fun sendPasswordReset(email: String) {
        if (!email.contains("@")) {
            _state.value = AuthUiState.Failure("Şifre sıfırlama bağlantısı için e-posta adresini yazın.")
            return
        }
        _state.value = AuthUiState.CheckingSession
        viewModelScope.launch {
            when (val result = repository.sendPasswordReset(email)) {
                is AuthResult.Failure -> _state.value = AuthUiState.Failure(result.message)
                else -> _state.value = AuthUiState.ResetEmailSent(email)
            }
        }
    }

    fun dismissMessage() {
        _state.value = AuthUiState.SignedOut
    }

    fun signOut() {
        viewModelScope.launch {
            repository.signOut()
            _state.value = AuthUiState.SignedOut
        }
    }

    private fun applyResult(result: AuthResult) {
        _state.value = when (result) {
            is AuthResult.SignedIn -> AuthUiState.SignedIn(result.account)
            AuthResult.SignedOut -> AuthUiState.SignedOut
            AuthResult.NotAStudent -> AuthUiState.Failure(
                "Bu uygulama yalnızca öğrenci hesapları içindir. Personel paneline webden giriş yapın.",
            )
            is AuthResult.Failure -> AuthUiState.Failure(result.message)
        }
    }
}
