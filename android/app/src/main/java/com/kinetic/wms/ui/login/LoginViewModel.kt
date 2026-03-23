package com.kinetic.wms.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kinetic.wms.data.model.LoginRequest
import com.kinetic.wms.data.model.Worker
import com.kinetic.wms.network.RuntimeApi
import com.kinetic.wms.network.TokenStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val tenantSlug: String = "",
    val badgeId: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val loggedInWorker: Worker? = null,
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val api: RuntimeApi,
    private val tokenStore: TokenStore,
) : ViewModel() {

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state

    fun updateTenantSlug(slug: String) {
        _state.value = _state.value.copy(tenantSlug = slug)
    }

    fun updateBadgeId(badgeId: String) {
        _state.value = _state.value.copy(badgeId = badgeId)
    }

    fun login() {
        val current = _state.value
        if (current.tenantSlug.isBlank() || current.badgeId.isBlank()) return

        viewModelScope.launch {
            _state.value = current.copy(isLoading = true, error = null)
            try {
                val response = api.login(LoginRequest(
                    tenantSlug = current.tenantSlug,
                    badgeId = current.badgeId,
                ))
                tokenStore.token = response.token
                _state.value = _state.value.copy(
                    isLoading = false,
                    loggedInWorker = response.worker,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = "Login failed: ${e.message}",
                )
            }
        }
    }
}
