package com.kinetic.wms.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TaskStatus {
    @SerialName("unassigned") UNASSIGNED,
    @SerialName("assigned") ASSIGNED,
    @SerialName("in_progress") IN_PROGRESS,
    @SerialName("complete") COMPLETE,
    @SerialName("exception") EXCEPTION,
}

@Serializable
enum class TaskLineStatus {
    @SerialName("open") OPEN,
    @SerialName("complete") COMPLETE,
    @SerialName("short") SHORT,
    @SerialName("skipped") SKIPPED,
}

@Serializable
data class TaskLineItem(
    val sku: String,
    val name: String,
    val uom: String,
)

@Serializable
data class TaskLineLocation(
    val barcode: String,
    val zone: String,
    val aisle: String? = null,
    val bay: String? = null,
    val level: String? = null,
)

@Serializable
data class TaskLineExpanded(
    val id: String,
    @SerialName("qty_required") val qtyRequired: Int,
    val item: TaskLineItem,
    val location: TaskLineLocation,
    val status: TaskLineStatus = TaskLineStatus.OPEN,
)

@Serializable
data class Task(
    val id: String,
    @SerialName("assigned_to") val assignedTo: String? = null,
    val status: TaskStatus,
    val priority: Int = 0,
    @SerialName("task_lines") val taskLines: List<TaskLineExpanded> = emptyList(),
)

@Serializable
data class TaskLineCompleteResponse(
    val id: String,
    @SerialName("qty_picked") val qtyPicked: Int,
    val status: TaskLineStatus,
    @SerialName("picked_by") val pickedBy: String? = null,
    @SerialName("picked_at") val pickedAt: String? = null,
)

@Serializable
data class AdvanceLineResponse(
    @SerialName("has_more") val hasMore: Boolean,
    @SerialName("current_line_index") val currentLineIndex: Int,
    @SerialName("next_task_line") val nextTaskLine: TaskLineExpanded? = null,
)

@Serializable
data class CompleteTaskLineRequest(
    @SerialName("qty_picked") val qtyPicked: Int,
    @SerialName("lot_number") val lotNumber: String? = null,
)

@Serializable
data class TaskCompleteResponse(
    val id: String,
    val status: TaskStatus,
    @SerialName("completed_at") val completedAt: String? = null,
)

@Serializable
data class EscalateRequest(
    @SerialName("worker_id") val workerId: String,
    @SerialName("step_id") val stepId: String,
)

@Serializable
data class EscalateResponse(
    val acknowledged: Boolean,
    @SerialName("task_id") val taskId: String,
)
