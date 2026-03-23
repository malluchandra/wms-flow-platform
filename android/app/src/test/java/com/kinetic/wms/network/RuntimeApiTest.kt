package com.kinetic.wms.network

import com.kinetic.wms.data.model.LoginRequest
import com.kinetic.wms.data.model.ScanValidateRequest
import com.kinetic.wms.fixtures.TestFixtures
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

class RuntimeApiTest {

    private lateinit var server: MockWebServer
    private lateinit var api: RuntimeApi

    @BeforeEach
    fun setup() {
        server = MockWebServer()
        server.start()

        val json = Json { ignoreUnknownKeys = true }
        api = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .client(OkHttpClient())
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(RuntimeApi::class.java)
    }

    @AfterEach
    fun teardown() {
        server.shutdown()
    }

    @Test
    fun `POST auth login sends correct body and parses response`() = runTest {
        server.enqueue(MockResponse()
            .setResponseCode(200)
            .setBody(TestFixtures.AUTH_RESPONSE_JSON)
            .addHeader("Content-Type", "application/json"))

        val response = api.login(LoginRequest(tenantSlug = "acme", badgeId = "BADGE-001"))
        assertEquals("test-jwt-token", response.token)
        assertEquals("Alice", response.worker.name)

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/auth/login", request.path)
    }

    @Test
    fun `GET tasks assigned returns task list`() = runTest {
        server.enqueue(MockResponse()
            .setResponseCode(200)
            .setBody(TestFixtures.TASKS_JSON)
            .addHeader("Content-Type", "application/json"))

        val tasks = api.getAssignedTasks("worker-001")
        assertEquals(1, tasks.size)
        assertEquals("task-001", tasks[0].id)
        assertEquals(1, tasks[0].taskLines.size)

        val request = server.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/tasks/assigned/worker-001", request.path)
    }

    @Test
    fun `GET active session returns session`() = runTest {
        server.enqueue(MockResponse()
            .setResponseCode(200)
            .setBody(TestFixtures.SESSION_JSON)
            .addHeader("Content-Type", "application/json"))

        val session = api.getActiveSession("worker-001")
        assertEquals("session-001", session.id)
        assertEquals(2, session.stepIndex)

        val request = server.takeRequest()
        assertEquals("/sessions/worker-001/active", request.path)
    }

    @Test
    fun `POST scans validate sends barcode and parses result`() = runTest {
        server.enqueue(MockResponse()
            .setResponseCode(200)
            .setBody(TestFixtures.SCAN_VALID_JSON)
            .addHeader("Content-Type", "application/json"))

        val result = api.validateScan(ScanValidateRequest(barcode = "0012345678905"))
        assertEquals("SKU-100", result.sku)
        assertNotNull(result.name)

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/scans/validate", request.path)
    }
}
