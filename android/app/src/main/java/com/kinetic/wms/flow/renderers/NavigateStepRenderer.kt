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
fun NavigateStepContent(
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
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
        )

        Spacer(modifier = Modifier.height(32.dp))

        step.display?.forEach { (key, value) ->
            Text(
                text = "${key.uppercase()}: ${context.resolve(value)}",
                fontSize = 48.sp,
                fontWeight = FontWeight.Black,
            )
        }

        Spacer(modifier = Modifier.height(48.dp))

        Button(
            onClick = { callbacks.onSuccess(null) },
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
        ) {
            Text("I'm Here", fontSize = 20.sp)
        }
    }
}
