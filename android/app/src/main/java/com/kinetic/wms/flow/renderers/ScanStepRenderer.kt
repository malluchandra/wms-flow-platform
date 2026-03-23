package com.kinetic.wms.flow.renderers

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
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
import com.kinetic.wms.scanner.ScanResult

@Composable
fun ScanStepContent(
    step: FlowStep,
    context: FlowContext,
    callbacks: StepCallbacks,
    scanResult: ScanResult?,
    isValidating: Boolean,
    validationError: String?,
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

        step.expectedValue?.let { expected ->
            Text(
                text = "Expected: ${context.resolve(expected)}",
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        when {
            isValidating -> {
                CircularProgressIndicator(modifier = Modifier.size(64.dp))
                Spacer(modifier = Modifier.height(16.dp))
                Text("Validating…", fontSize = 18.sp)
            }
            validationError != null -> {
                Text(
                    text = validationError,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text("Scan again", fontSize = 16.sp)
            }
            scanResult != null -> {
                Text(
                    text = "Scanned: ${scanResult.barcode}",
                    fontSize = 20.sp,
                )
            }
            else -> {
                Icon(
                    imageVector = Icons.Default.QrCodeScanner,
                    contentDescription = "Scan",
                    modifier = Modifier.size(96.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text("Waiting for scan…", fontSize = 18.sp)
            }
        }
    }
}
