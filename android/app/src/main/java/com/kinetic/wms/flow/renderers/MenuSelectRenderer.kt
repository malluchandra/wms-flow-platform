package com.kinetic.wms.flow.renderers

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
fun MenuSelectContent(
    step: FlowStep,
    context: FlowContext,
    callbacks: StepCallbacks,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
    ) {
        Text(
            text = context.resolve(step.prompt),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        )

        Spacer(modifier = Modifier.height(24.dp))

        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(step.options ?: emptyList()) { option ->
                Button(
                    onClick = { callbacks.onMenuSelect?.invoke(option.value, option.nextStep) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(64.dp),
                ) {
                    Text(option.label, fontSize = 20.sp)
                }
            }
        }
    }
}
