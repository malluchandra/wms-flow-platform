package com.kinetic.wms.network

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class AuthInterceptorTest {

    private lateinit var server: MockWebServer
    private lateinit var tokenStore: TokenStore
    private lateinit var client: OkHttpClient

    @BeforeEach
    fun setup() {
        server = MockWebServer()
        server.start()
        tokenStore = TokenStore()
        client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStore))
            .build()
    }

    @AfterEach
    fun teardown() {
        server.shutdown()
    }

    @Test
    fun `adds Authorization header when token is set`() {
        tokenStore.token = "my-jwt-token"
        server.enqueue(MockResponse().setResponseCode(200))

        client.newCall(Request.Builder().url(server.url("/test")).build()).execute()

        val recorded = server.takeRequest()
        assertEquals("Bearer my-jwt-token", recorded.getHeader("Authorization"))
    }

    @Test
    fun `skips Authorization header when token is null`() {
        server.enqueue(MockResponse().setResponseCode(200))

        client.newCall(Request.Builder().url(server.url("/test")).build()).execute()

        val recorded = server.takeRequest()
        assertNull(recorded.getHeader("Authorization"))
    }

    @Test
    fun `uses updated token after change`() {
        tokenStore.token = "old-token"
        server.enqueue(MockResponse().setResponseCode(200))
        client.newCall(Request.Builder().url(server.url("/test")).build()).execute()

        tokenStore.token = "new-token"
        server.enqueue(MockResponse().setResponseCode(200))
        client.newCall(Request.Builder().url(server.url("/test")).build()).execute()

        server.takeRequest()
        val second = server.takeRequest()
        assertEquals("Bearer new-token", second.getHeader("Authorization"))
    }
}
