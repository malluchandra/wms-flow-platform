package com.kinetic.wms.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class BarcodeType {
    @SerialName("GS1-128") GS1_128,
    @SerialName("Code128") CODE_128,
    @SerialName("QR") QR,
    @SerialName("DataMatrix") DATA_MATRIX,
}

@Serializable
data class ScanValidateRequest(
    val barcode: String,
    @SerialName("expected_sku") val expectedSku: String? = null,
    @SerialName("task_id") val taskId: String? = null,
    @SerialName("step_id") val stepId: String? = null,
    @SerialName("flow_id") val flowId: String? = null,
    @SerialName("barcode_type") val barcodeType: BarcodeType? = null,
    @SerialName("device_id") val deviceId: String? = null,
)

@Serializable
data class ScanValidateResponse(
    val sku: String,
    val name: String,
    val uom: String,
    @SerialName("lot_tracked") val lotTracked: Boolean = false,
    @SerialName("serial_tracked") val serialTracked: Boolean = false,
    val lot: String? = null,
)

@Serializable
data class ScanErrorResponse(
    val error: String,
    val barcode: String,
)

@Serializable
sealed class RealtimeEvent {
    @Serializable
    @SerialName("task_assigned")
    data class TaskAssigned(
        @SerialName("task_id") val taskId: String,
        @SerialName("worker_id") val workerId: String,
        @SerialName("flow_id") val flowId: String,
        @SerialName("tenant_id") val tenantId: String,
    ) : RealtimeEvent()

    @Serializable
    @SerialName("task_reassigned")
    data class TaskReassigned(
        @SerialName("task_id") val taskId: String,
        @SerialName("from_worker_id") val fromWorkerId: String,
        @SerialName("to_worker_id") val toWorkerId: String,
        @SerialName("tenant_id") val tenantId: String,
    ) : RealtimeEvent()

    @Serializable
    @SerialName("supervisor_message")
    data class SupervisorMessage(
        val message: String,
        @SerialName("worker_id") val workerId: String,
        @SerialName("tenant_id") val tenantId: String,
    ) : RealtimeEvent()

    @Serializable
    @SerialName("wave_released")
    data class WaveReleased(
        @SerialName("wave_id") val waveId: String,
        @SerialName("task_count") val taskCount: Int,
        @SerialName("tenant_id") val tenantId: String,
    ) : RealtimeEvent()
}
