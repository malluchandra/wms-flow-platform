package com.kinetic.wms.ui.flow

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.kinetic.wms.flow.StepCallbacks
import com.kinetic.wms.flow.StepRendererRegistry
import com.kinetic.wms.flow.UnsupportedStepTypeException

@Composable
fun FlowExecutionScreen(
    taskId: String,
    flowName: String,
    resumeSessionId: String? = null,
    onFlowComplete: () -> Unit,
    viewModel: FlowExecutionViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(taskId) {
        if (resumeSessionId != null) {
            viewModel.resumeSession(resumeSessionId, flowName)
        } else {
            viewModel.startFlow(taskId, flowName)
        }
    }

    LaunchedEffect(state.isCompleted) {
        if (state.isCompleted) onFlowComplete()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        if (state.totalSteps > 0) {
            LinearProgressIndicator(
                progress = { (state.stepIndex + 1).toFloat() / state.totalSteps },
                modifier = Modifier.fillMaxWidth(),
            )
            Text(
                text = "Step ${state.stepIndex + 1} of ${state.totalSteps}",
                fontSize = 14.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        state.error?.let { error ->
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(16.dp),
                fontWeight = FontWeight.Bold,
            )
        }

        val step = state.currentStep
        if (step != null) {
            val callbacks = StepCallbacks(
                onSuccess = { input -> viewModel.onStepSuccess(input) },
                onFailure = { _ -> },
                onConfirm = { viewModel.onStepConfirm() },
                onBack = { viewModel.onBack() },
                onMenuSelect = { value, nextStep -> viewModel.onMenuSelect(value, nextStep) },
                onException = { action, nextStep -> viewModel.onException(action, nextStep) },
            )

            try {
                val renderer = StepRendererRegistry.resolve(step.type)
                Box(modifier = Modifier.weight(1f)) {
                    renderer(
                        step,
                        viewModel.flowEngine.context,
                        callbacks,
                        state.scanResult,
                        state.isValidating,
                        state.validationError,
                    )
                }
            } catch (_: UnsupportedStepTypeException) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = "Step type not supported — update the app",
                        fontSize = 18.sp,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
    }
}
