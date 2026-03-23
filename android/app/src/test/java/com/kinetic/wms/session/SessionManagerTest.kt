package com.kinetic.wms.session

import com.kinetic.wms.data.model.*
import com.kinetic.wms.network.RuntimeApi
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class SessionManagerTest {

    private lateinit var api: RuntimeApi
    private lateinit var sessionManager: SessionManager

    @BeforeEach
    fun setup() {
        api = mockk()
        sessionManager = SessionManager(api)
    }

    @Test
    fun `checkForActiveSession returns session when server has one`() = runTest {
        val session = WorkerSession(
            id = "s1", workerId = "w1", flowId = "f1", taskId = "t1",
            stepIndex = 3, status = SessionStatus.ACTIVE,
        )
        coEvery { api.getActiveSession("w1") } returns session

        val result = sessionManager.checkForActiveSession("w1")
        assertNotNull(result)
        assertEquals("s1", result!!.id)
        assertEquals(3, result.stepIndex)
    }

    @Test
    fun `checkForActiveSession returns null when server 404s`() = runTest {
        coEvery { api.getActiveSession("w1") } throws retrofit2.HttpException(
            retrofit2.Response.error<Any>(404, okhttp3.ResponseBody.create(null, ""))
        )

        val result = sessionManager.checkForActiveSession("w1")
        assertNull(result)
    }

    @Test
    fun `createSession calls API and returns session`() = runTest {
        val session = WorkerSession(
            id = "s2", workerId = "w1", flowId = "f1", taskId = "t1",
            stepIndex = 0, status = SessionStatus.ACTIVE,
        )
        coEvery { api.createSession(any()) } returns session

        val result = sessionManager.createSession("f1", "t1")
        assertEquals("s2", result.id)
        assertEquals(0, result.stepIndex)

        coVerify { api.createSession(CreateSessionRequest(flowId = "f1", taskId = "t1")) }
    }

    @Test
    fun `commitStep calls API with step data`() = runTest {
        val updated = WorkerSession(
            id = "s1", workerId = "w1", flowId = "f1", taskId = "t1",
            stepIndex = 4, status = SessionStatus.ACTIVE,
        )
        coEvery { api.commitStep("s1", any()) } returns updated

        val result = sessionManager.commitStep("s1", "scan-sku", emptyMap())
        assertEquals(4, result.stepIndex)
    }

    @Test
    fun `abandonSession calls abandon API`() = runTest {
        val completed = WorkerSession(
            id = "s1", workerId = "w1", flowId = "f1", taskId = "t1",
            stepIndex = 8, status = SessionStatus.COMPLETED,
        )
        coEvery { api.abandonSession("s1") } returns completed

        sessionManager.abandonSession("s1")
        coVerify { api.abandonSession("s1") }
    }

    @Test
    fun `advanceLine returns response from API`() = runTest {
        val response = AdvanceLineResponse(
            hasMore = true,
            currentLineIndex = 2,
            nextTaskLine = null,
        )
        coEvery { api.advanceLine("s1") } returns response

        val result = sessionManager.advanceLine("s1")
        assertTrue(result.hasMore)
        assertEquals(2, result.currentLineIndex)
    }
}
