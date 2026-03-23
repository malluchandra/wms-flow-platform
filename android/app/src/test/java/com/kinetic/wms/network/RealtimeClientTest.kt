package com.kinetic.wms.network

import com.kinetic.wms.data.model.RealtimeEvent
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class RealtimeClientTest {

    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun `parseEvent returns TaskAssigned for task_assigned data`() {
        val data = """{"type":"task_assigned","task_id":"t1","worker_id":"w1","flow_id":"f1","tenant_id":"ten1"}"""

        val event = RealtimeClient.parseEvent(json, "task_assigned", data)
        assertTrue(event is RealtimeEvent.TaskAssigned)
        assertEquals("t1", (event as RealtimeEvent.TaskAssigned).taskId)
    }

    @Test
    fun `parseEvent returns TaskReassigned for task_reassigned data`() {
        val data = """{"type":"task_reassigned","task_id":"t1","from_worker_id":"w1","to_worker_id":"w2","tenant_id":"ten1"}"""

        val event = RealtimeClient.parseEvent(json, "task_reassigned", data)
        assertTrue(event is RealtimeEvent.TaskReassigned)
    }

    @Test
    fun `parseEvent returns SupervisorMessage for supervisor_message data`() {
        val data = """{"type":"supervisor_message","message":"Go to zone C","worker_id":"w1","tenant_id":"ten1"}"""

        val event = RealtimeClient.parseEvent(json, "supervisor_message", data)
        assertTrue(event is RealtimeEvent.SupervisorMessage)
        assertEquals("Go to zone C", (event as RealtimeEvent.SupervisorMessage).message)
    }

    @Test
    fun `parseEvent returns WaveReleased for wave_released data`() {
        val data = """{"type":"wave_released","wave_id":"wave-1","task_count":10,"tenant_id":"ten1"}"""

        val event = RealtimeClient.parseEvent(json, "wave_released", data)
        assertTrue(event is RealtimeEvent.WaveReleased)
        assertEquals(10, (event as RealtimeEvent.WaveReleased).taskCount)
    }

    @Test
    fun `parseEvent returns null for unknown event type`() {
        val data = """{"type":"unknown_event"}"""

        val event = RealtimeClient.parseEvent(json, "unknown_event", data)
        assertEquals(null, event)
    }

    @Test
    fun `parseEvent returns null for heartbeat comment`() {
        val event = RealtimeClient.parseEvent(json, "", ":heartbeat")
        assertEquals(null, event)
    }
}
