package com.kinetic.wms.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class WorkerRole {
    @SerialName("picker") PICKER,
    @SerialName("supervisor") SUPERVISOR,
    @SerialName("admin") ADMIN,
}

@Serializable
data class Worker(
    val id: String,
    val name: String,
    val role: WorkerRole,
    @SerialName("badge_id") val badgeId: String,
)

@Serializable
data class LoginRequest(
    @SerialName("tenant_slug") val tenantSlug: String,
    @SerialName("badge_id") val badgeId: String,
)

@Serializable
data class AuthResponse(
    val token: String,
    val worker: Worker,
)
