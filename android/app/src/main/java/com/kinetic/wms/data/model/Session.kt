package com.kinetic.wms.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
enum class SessionStatus {
    @SerialName("active") ACTIVE,
    @SerialName("completed") COMPLETED,
    @SerialName("abandoned") ABANDONED,
}

@Serializable
data class WorkerSession(
    val id: String,
    @SerialName("worker_id") val workerId: String,
    @SerialName("flow_id") val flowId: String,
    @SerialName("task_id") val taskId: String? = null,
    @SerialName("step_index") val stepIndex: Int,
    @SerialName("state_data") val stateData: Map<String, JsonElement> = emptyMap(),
    val status: SessionStatus,
    @SerialName("device_id") val deviceId: String? = null,
)

@Serializable
data class CreateSessionRequest(
    @SerialName("flow_id") val flowId: String,
    @SerialName("task_id") val taskId: String,
)

@Serializable
data class CommitStepRequest(
    @SerialName("step_id") val stepId: String,
    @SerialName("state_data") val stateData: Map<String, JsonElement> = emptyMap(),
)
