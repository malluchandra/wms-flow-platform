package com.kinetic.wms.flow.renderers

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kinetic.wms.data.model.FlowStep
import com.kinetic.wms.flow.FlowContext
import com.kinetic.wms.flow.StepCallbacks

@Composable
fun NumericInputContent(
    step: FlowStep,
    context: FlowContext,
    callbacks: StepCallbacks,
) {
    var value by remember { mutableStateOf("") }

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

        Spacer(modifier = Modifier.height(16.dp))

        step.target?.let { target ->
            Text(
                text = "Target: ${context.resolve(target)}",
                fontSize = 18.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        step.uom?.let { uom ->
            Text(
                text = "UOM: ${context.resolve(uom)}",
                fontSize = 16.sp,
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = value,
            onValueChange = { value = it.filter { c -> c.isDigit() || c == '.' } },
            label = { Text("Quantity") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            textStyle = LocalTextStyle.current.copy(fontSize = 32.sp),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = { callbacks.onSuccess(value) },
            enabled = value.isNotBlank(),
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
        ) {
            Text("Submit", fontSize = 20.sp)
        }
    }
}
