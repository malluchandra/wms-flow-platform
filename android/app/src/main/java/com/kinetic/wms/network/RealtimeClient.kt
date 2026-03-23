package com.kinetic.wms.network

import com.kinetic.wms.data.model.RealtimeEvent
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import javax.inject.Inject
import javax.inject.Named
import javax.inject.Singleton

@Singleton
class RealtimeClient @Inject constructor(
    private val client: OkHttpClient,
    private val json: Json,
    @Named("realtimeUrl") private val baseUrl: String,
    private val tokenStore: TokenStore,
) {
    private var eventSource: EventSource? = null

    fun connect(workerId: String, onEvent: (RealtimeEvent) -> Unit, onError: (Throwable?) -> Unit) {
        disconnect()

        val request = Request.Builder()
            .url("$baseUrl/events/worker/$workerId")
            .header("Authorization", "Bearer ${tokenStore.token}")
            .header("Accept", "text/event-stream")
            .build()

        val listener = object : EventSourceListener() {
            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                val event = parseEvent(json, type ?: "", data)
                if (event != null) {
                    onEvent(event)
                }
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                onError(t)
            }
        }

        eventSource = EventSources.createFactory(client).newEventSource(request, listener)
    }

    fun disconnect() {
        eventSource?.cancel()
        eventSource = null
    }

    companion object {
        fun parseEvent(json: Json, type: String, data: String): RealtimeEvent? {
            if (data.startsWith(":") || type.isBlank()) return null
            return try {
                json.decodeFromString<RealtimeEvent>(data)
            } catch (_: Exception) {
                null
            }
        }
    }
}
