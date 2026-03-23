package com.kinetic.wms.network

import com.kinetic.wms.data.model.*
import retrofit2.http.*

interface RuntimeApi {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    // Flows
    @GET("flows/{id}")
    suspend fun getFlow(@Path("id") flowId: String): FlowDefinition

    @GET("flows/active/{name}")
    suspend fun getActiveFlow(@Path("name") flowName: String): FlowDefinition

    // Sessions
    @POST("sessions")
    suspend fun createSession(@Body request: CreateSessionRequest): WorkerSession

    @GET("sessions/{workerId}/active")
    suspend fun getActiveSession(@Path("workerId") workerId: String): WorkerSession

    @POST("sessions/{id}/step")
    suspend fun commitStep(
        @Path("id") sessionId: String,
        @Body request: CommitStepRequest,
    ): WorkerSession

    @POST("sessions/{id}/advance-line")
    suspend fun advanceLine(@Path("id") sessionId: String): AdvanceLineResponse

    @POST("sessions/{id}/abandon")
    suspend fun abandonSession(@Path("id") sessionId: String): WorkerSession

    // Scans
    @POST("scans/validate")
    suspend fun validateScan(@Body request: ScanValidateRequest): ScanValidateResponse

    // Tasks
    @GET("tasks/assigned/{workerId}")
    suspend fun getAssignedTasks(@Path("workerId") workerId: String): List<Task>

    @POST("tasks/{id}/lines/{lineId}/complete")
    suspend fun completeTaskLine(
        @Path("id") taskId: String,
        @Path("lineId") lineId: String,
        @Body request: CompleteTaskLineRequest,
    ): TaskLineCompleteResponse

    @POST("tasks/{id}/complete")
    suspend fun completeTask(@Path("id") taskId: String): TaskCompleteResponse

    @POST("tasks/{id}/escalate")
    suspend fun escalateTask(
        @Path("id") taskId: String,
        @Body request: EscalateRequest,
    ): EscalateResponse
}
