package com.kinetic.wms.ui.flow

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kinetic.wms.data.model.*
import com.kinetic.wms.flow.FlowEngine
import com.kinetic.wms.network.RuntimeApi
import com.kinetic.wms.scanner.ScanResult
import com.kinetic.wms.scanner.ScannerInterface
import com.kinetic.wms.session.SessionManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonElement
import retrofit2.HttpException
import javax.inject.Inject

data class FlowExecutionUiState(
    val currentStep: FlowStep? = null,
    val stepIndex: Int = 0,
    val totalSteps: Int = 0,
    val isValidating: Boolean = false,
    val validationError: String? = null,
    val scanResult: ScanResult? = null,
    val isCompleted: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class FlowExecutionViewModel @Inject constructor(
    private val api: RuntimeApi,
    private val sessionManager: SessionManager,
    val flowEngine: FlowEngine,
) : ViewModel() {

    private val _state = MutableStateFlow(FlowExecutionUiState())
    val state: StateFlow<FlowExecutionUiState> = _state

    private var sessionId: String? = null
    private var taskId: String? = null
    private var flowId: String? = null
    private var scanner: ScannerInterface? = null

    fun startFlow(taskId: String, flowName: String) {
        this.taskId = taskId
        viewModelScope.launch {
            try {
                val flow = api.getActiveFlow(flowName)
                flowId = flow.id
                flowEngine.loadFlow(flow)

                val session = sessionManager.createSession(flow.id, taskId)
                sessionId = session.id

                flowEngine.context.mergeStateData(convertStateData(session.stateData))

                updateUiFromEngine()
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = "Failed to start flow: ${e.message}")
            }
        }
    }

    fun resumeSession(resumeSessionId: String, resumeFlowId: String) {
        sessionId = resumeSessionId
        flowId = resumeFlowId
        viewModelScope.launch {
            try {
                val flow = api.getFlow(resumeFlowId)
                flowEngine.loadFlow(flow)

                val session = api.getActiveSession(resumeSessionId)
                flowEngine.rehydrate(session.stepIndex, convertStateData(session.stateData))
                taskId = session.taskId

                updateUiFromEngine()
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = "Failed to resume: ${e.message}")
            }
        }
    }

    fun onScanReceived(result: ScanResult) {
        val step = flowEngine.currentStep() ?: return
        if (step.type != StepType.SCAN) return
        if (_state.value.isValidating) return

        _state.value = _state.value.copy(scanResult = result, isValidating = true, validationError = null)

        viewModelScope.launch {
            try {
                flowEngine.validateScan(
                    barcode = result.barcode,
                    expectedSku = step.expectedValue?.let { flowEngine.context.resolve(it) },
                    taskId = taskId,
                    stepId = step.id,
                    flowId = flowId,
                )
                handleTransition(step.onSuccess, result.barcode)
            } catch (e: HttpException) {
                if (e.code() == 422) {
                    _state.value = _state.value.copy(
                        isValidating = false,
                        validationError = "Invalid scan — try again",
                        scanResult = null,
                    )
                } else {
                    _state.value = _state.value.copy(
                        isValidating = false,
                        validationError = "Scan error: ${e.message}",
                        scanResult = null,
                    )
                }
            }
        }
    }

    fun onStepSuccess(input: String?) {
        val step = flowEngine.currentStep() ?: return
        handleTransition(step.onSuccess, input)
    }

    fun onStepConfirm() {
        val step = flowEngine.currentStep() ?: return
        handleTransition(step.onConfirm ?: step.onSuccess, null)
    }

    fun onMenuSelect(value: String, nextStep: String) {
        advanceAndCommit(nextStep)
    }

    fun onException(action: String, nextStep: String) {
        if (action == "escalate") {
            viewModelScope.launch {
                try {
                    taskId?.let { tid ->
                        api.escalateTask(tid, EscalateRequest(
                            workerId = "",
                            stepId = flowEngine.currentStep()?.id ?: "",
                        ))
                    }
                } catch (_: Exception) { }
            }
        }
        if (nextStep.isNotBlank()) {
            advanceAndCommit(nextStep)
        }
    }

    fun onBack() {
        val step = flowEngine.currentStep() ?: return
        step.onBack?.let { handleTransition(it, null) }
    }

    fun attachScanner(scanner: ScannerInterface) {
        this.scanner = scanner
        scanner.startListening { result -> onScanReceived(result) }
    }

    fun detachScanner() {
        scanner?.stopListening()
        scanner = null
    }

    private fun handleTransition(transition: TransitionValue?, input: String?) {
        if (transition == null) return
        val nextStepId = flowEngine.resolveTransition(transition, input)
        advanceAndCommit(nextStepId)
    }

    private fun advanceAndCommit(nextStepId: String) {
        flowEngine.advanceToStep(nextStepId)

        viewModelScope.launch {
            try {
                sessionId?.let { sid ->
                    sessionManager.commitStep(
                        sessionId = sid,
                        stepId = nextStepId,
                        stateData = emptyMap(),
                    )
                }
            } catch (_: Exception) { }
        }

        updateUiFromEngine()
    }

    private fun updateUiFromEngine() {
        _state.value = FlowExecutionUiState(
            currentStep = flowEngine.currentStep(),
            stepIndex = flowEngine.currentStepIndex(),
            totalSteps = flowEngine.totalSteps(),
        )
    }

    @Suppress("UNCHECKED_CAST")
    private fun convertStateData(stateData: Map<String, JsonElement>): Map<String, Any?> {
        return stateData.mapValues { (_, v) -> v.toString().trim('"') }
    }

    override fun onCleared() {
        super.onCleared()
        detachScanner()
    }
}
