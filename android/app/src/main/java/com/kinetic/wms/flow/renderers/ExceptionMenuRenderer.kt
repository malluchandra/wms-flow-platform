package com.kinetic.wms.flow.renderers

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kinetic.wms.data.model.FlowStep
import com.kinetic.wms.flow.FlowContext
import com.kinetic.wms.flow.StepCallbacks

private data class ExceptionAction(val label: String, val value: String)

private val DEFAULT_ACTIONS = listOf(
    ExceptionAction("Short Pick", "short_pick"),
    ExceptionAction("Escalate to Supervisor", "escalate"),
    ExceptionAction("Skip Item", "skip"),
    ExceptionAction("Cancel Task", "cancel"),
)

@Composable
fun ExceptionMenuContent(
    step: FlowStep,
    context: FlowContext,
    callbacks: StepCallbacks,
) {
    val actions = step.options?.map { ExceptionAction(it.label, it.value) } ?: DEFAULT_ACTIONS

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
    ) {
        Text(
            text = context.resolve(step.prompt),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.error,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        )

        Spacer(modifier = Modifier.height(24.dp))

        actions.forEach { action ->
            OutlinedButton(
                onClick = {
                    val nextStep = step.options?.find { it.value == action.value }?.nextStep ?: ""
                    callbacks.onException?.invoke(action.value, nextStep)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(vertical = 4.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.error,
                ),
            ) {
                Text(action.label, fontSize = 18.sp)
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        TextButton(
            onClick = { callbacks.onBack?.invoke() },
            modifier = Modifier.align(Alignment.CenterHorizontally),
        ) {
            Text("Cancel", fontSize = 16.sp)
        }
    }
}
