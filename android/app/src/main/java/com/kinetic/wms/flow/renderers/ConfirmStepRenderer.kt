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

@Composable
fun ConfirmStepContent(
    step: FlowStep,
    context: FlowContext,
    callbacks: StepCallbacks,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = context.resolve(step.prompt),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
        )

        Spacer(modifier = Modifier.height(24.dp))

        step.summaryFields?.forEach { field ->
            val value = context.get(field)?.toString() ?: "—"
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(field.replace("_", " ").uppercase(), fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Text(value, fontSize = 16.sp)
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            OutlinedButton(
                onClick = { callbacks.onBack?.invoke() },
                modifier = Modifier
                    .weight(1f)
                    .height(64.dp),
            ) {
                Text("Back", fontSize = 20.sp)
            }

            Button(
                onClick = { callbacks.onConfirm?.invoke() ?: callbacks.onSuccess(null) },
                modifier = Modifier
                    .weight(1f)
                    .height(64.dp),
            ) {
                Text("Confirm", fontSize = 20.sp)
            }
        }
    }
}
