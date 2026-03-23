package com.kinetic.wms.data.model

import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class FlowDeserializationTest {

    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun `deserialize minimal flow definition`() {
        val input = """
        {
            "id": "flow-1",
            "name": "outbound-picking",
            "version": "1.0.0",
            "display_name": "Outbound Picking",
            "extends": null,
            "context_schema": { "task_id": "uuid", "sku": "string" },
            "entry_step": "navigate-to-location",
            "steps": []
        }
        """.trimIndent()

        val flow = json.decodeFromString<FlowDefinition>(input)
        assertEquals("flow-1", flow.id)
        assertEquals("outbound-picking", flow.name)
        assertEquals("navigate-to-location", flow.entryStep)
        assertNull(flow.extends)
        assertEquals(0, flow.steps.size)
    }

    @Test
    fun `deserialize step with string transition shorthand`() {
        val input = """
        {
            "id": "scan-sku",
            "type": "scan",
            "prompt": "Scan item barcode",
            "on_success": "confirm-qty"
        }
        """.trimIndent()

        val step = json.decodeFromString<FlowStep>(input)
        assertEquals("scan-sku", step.id)
        assertEquals(StepType.SCAN, step.type)
        assertEquals(TransitionValue.Target("confirm-qty"), step.onSuccess)
    }

    @Test
    fun `deserialize step with handler transition`() {
        val input = """
        {
            "id": "scan-location",
            "type": "scan",
            "prompt": "Scan location",
            "on_success": {
                "set_context": { "scanned_location": "{{input}}" },
                "next_step": "scan-sku"
            }
        }
        """.trimIndent()

        val step = json.decodeFromString<FlowStep>(input)
        val handler = step.onSuccess as TransitionValue.Handler
        assertEquals("scan-sku", handler.nextStep)
        assertEquals("{{input}}", handler.setContext?.get("scanned_location"))
    }

    @Test
    fun `deserialize step with conditional transition array`() {
        val input = """
        {
            "id": "check-qty",
            "type": "number_input",
            "prompt": "Enter quantity",
            "on_success": [
                { "condition": "{{input}} < {{context.qty_required}}", "next_step": "short-pick-menu" },
                { "condition": "true", "next_step": "confirm-pick" }
            ]
        }
        """.trimIndent()

        val step = json.decodeFromString<FlowStep>(input)
        val conditionals = step.onSuccess as TransitionValue.Conditionals
        assertEquals(2, conditionals.conditions.size)
        assertEquals("short-pick-menu", conditionals.conditions[0].nextStep)
    }

    @Test
    fun `deserialize full flow with multiple step types`() {
        val input = """
        {
            "id": "flow-1",
            "name": "test-flow",
            "version": "1.0.0",
            "display_name": "Test Flow",
            "extends": null,
            "context_schema": {},
            "entry_step": "step-1",
            "steps": [
                { "id": "step-1", "type": "navigate", "prompt": "Go to A-01-01", "display": {"zone": "A", "aisle": "01"}, "on_success": "step-2" },
                { "id": "step-2", "type": "scan", "prompt": "Scan location", "on_success": "step-3" },
                { "id": "step-3", "type": "confirm", "prompt": "Confirm pick", "summary_fields": ["sku", "qty"], "on_confirm": "step-1" }
            ]
        }
        """.trimIndent()

        val flow = json.decodeFromString<FlowDefinition>(input)
        assertEquals(3, flow.steps.size)
        assertEquals(StepType.NAVIGATE, flow.steps[0].type)
        assertEquals(StepType.SCAN, flow.steps[1].type)
        assertEquals(StepType.CONFIRM, flow.steps[2].type)
    }
}
