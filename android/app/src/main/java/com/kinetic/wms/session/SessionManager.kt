package com.kinetic.wms.session

import com.kinetic.wms.data.model.*
import com.kinetic.wms.network.RuntimeApi
import kotlinx.serialization.json.JsonElement
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionManager @Inject constructor(
    private val api: RuntimeApi,
) {
    suspend fun checkForActiveSession(workerId: String): WorkerSession? {
        return try {
            api.getActiveSession(workerId)
        } catch (e: HttpException) {
            if (e.code() == 404) null else throw e
        }
    }

    suspend fun createSession(flowId: String, taskId: String): WorkerSession {
        return api.createSession(CreateSessionRequest(flowId = flowId, taskId = taskId))
    }

    suspend fun commitStep(
        sessionId: String,
        stepId: String,
        stateData: Map<String, JsonElement>,
    ): WorkerSession {
        return api.commitStep(sessionId, CommitStepRequest(stepId = stepId, stateData = stateData))
    }

    suspend fun advanceLine(sessionId: String): AdvanceLineResponse {
        return api.advanceLine(sessionId)
    }

    suspend fun abandonSession(sessionId: String): WorkerSession {
        return api.abandonSession(sessionId)
    }
}
