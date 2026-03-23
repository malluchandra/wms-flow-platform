package com.kinetic.wms.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kinetic.wms.data.model.RealtimeEvent
import com.kinetic.wms.data.model.Task
import com.kinetic.wms.data.model.WorkerSession
import com.kinetic.wms.network.RealtimeClient
import com.kinetic.wms.network.RuntimeApi
import com.kinetic.wms.session.SessionManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TaskListUiState(
    val tasks: List<Task> = emptyList(),
    val activeSession: WorkerSession? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val showResumeDialog: Boolean = false,
)

@HiltViewModel
class TaskListViewModel @Inject constructor(
    private val api: RuntimeApi,
    private val sessionManager: SessionManager,
    private val realtimeClient: RealtimeClient,
) : ViewModel() {

    private val _state = MutableStateFlow(TaskListUiState())
    val state: StateFlow<TaskListUiState> = _state

    fun initialize(workerId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)

            try {
                val active = sessionManager.checkForActiveSession(workerId)
                if (active != null) {
                    _state.value = _state.value.copy(
                        activeSession = active,
                        showResumeDialog = true,
                        isLoading = false,
                    )
                    return@launch
                }
            } catch (_: Exception) { }

            loadTasks(workerId)

            realtimeClient.connect(
                workerId = workerId,
                onEvent = { event -> handleEvent(event, workerId) },
                onError = { _state.value = _state.value.copy(error = "Connection lost") },
            )
        }
    }

    fun dismissResumeDialog() {
        _state.value = _state.value.copy(showResumeDialog = false, activeSession = null)
    }

    private fun loadTasks(workerId: String) {
        viewModelScope.launch {
            try {
                val tasks = api.getAssignedTasks(workerId)
                _state.value = _state.value.copy(tasks = tasks, isLoading = false, error = null)
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = "Failed to load tasks")
            }
        }
    }

    private fun handleEvent(event: RealtimeEvent, workerId: String) {
        when (event) {
            is RealtimeEvent.TaskAssigned -> loadTasks(workerId)
            is RealtimeEvent.TaskReassigned -> loadTasks(workerId)
            is RealtimeEvent.SupervisorMessage -> {
                _state.value = _state.value.copy(error = "Supervisor: ${event.message}")
            }
            is RealtimeEvent.WaveReleased -> loadTasks(workerId)
        }
    }

    override fun onCleared() {
        super.onCleared()
        realtimeClient.disconnect()
    }
}
