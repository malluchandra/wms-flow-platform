package com.kinetic.wms.data.model

import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class EventDeserializationTest {

    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun `deserialize task_assigned event`() {
        val input = """
        {
            "type": "task_assigned",
            "task_id": "task-1",
            "worker_id": "worker-1",
            "flow_id": "flow-1",
            "tenant_id": "tenant-1"
        }
        """.trimIndent()

        val event = json.decodeFromString<RealtimeEvent>(input)
        assertTrue(event is RealtimeEvent.TaskAssigned)
        assertEquals("task-1", (event as RealtimeEvent.TaskAssigned).taskId)
    }

    @Test
    fun `deserialize task_reassigned event`() {
        val input = """
        {
            "type": "task_reassigned",
            "task_id": "task-1",
            "from_worker_id": "worker-1",
            "to_worker_id": "worker-2",
            "tenant_id": "tenant-1"
        }
        """.trimIndent()

        val event = json.decodeFromString<RealtimeEvent>(input)
        assertTrue(event is RealtimeEvent.TaskReassigned)
        assertEquals("worker-2", (event as RealtimeEvent.TaskReassigned).toWorkerId)
    }

    @Test
    fun `deserialize supervisor_message event`() {
        val input = """
        {
            "type": "supervisor_message",
            "message": "Move to zone B",
            "worker_id": "worker-1",
            "tenant_id": "tenant-1"
        }
        """.trimIndent()

        val event = json.decodeFromString<RealtimeEvent>(input)
        assertTrue(event is RealtimeEvent.SupervisorMessage)
        assertEquals("Move to zone B", (event as RealtimeEvent.SupervisorMessage).message)
    }

    @Test
    fun `deserialize wave_released event`() {
        val input = """
        {
            "type": "wave_released",
            "wave_id": "wave-1",
            "task_count": 15,
            "tenant_id": "tenant-1"
        }
        """.trimIndent()

        val event = json.decodeFromString<RealtimeEvent>(input)
        assertTrue(event is RealtimeEvent.WaveReleased)
        assertEquals(15, (event as RealtimeEvent.WaveReleased).taskCount)
    }
}
