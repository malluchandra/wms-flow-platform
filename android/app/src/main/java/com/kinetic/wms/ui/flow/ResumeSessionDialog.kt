package com.kinetic.wms.ui.flow

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight
import com.kinetic.wms.data.model.WorkerSession

@Composable
fun ResumeSessionDialog(
    session: WorkerSession,
    onResume: (WorkerSession) -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Resume Task?", fontWeight = FontWeight.Bold)
        },
        text = {
            Text("You have an active session at step ${session.stepIndex + 1}. Resume where you left off?")
        },
        confirmButton = {
            Button(onClick = { onResume(session) }) {
                Text("Resume")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Start Over")
            }
        },
    )
}
