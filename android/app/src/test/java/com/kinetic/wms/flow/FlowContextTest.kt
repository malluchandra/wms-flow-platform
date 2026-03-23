package com.kinetic.wms.flow

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class FlowContextTest {

    @Test
    fun `resolve simple template`() {
        val ctx = FlowContext(mutableMapOf("sku" to "ABC-123"))
        assertEquals("ABC-123", ctx.resolve("{{context.sku}}"))
    }

    @Test
    fun `resolve nested template`() {
        val ctx = FlowContext(mutableMapOf(
            "location" to mapOf("zone" to "A", "aisle" to "03"),
        ))
        assertEquals("A", ctx.resolve("{{context.location.zone}}"))
        assertEquals("03", ctx.resolve("{{context.location.aisle}}"))
    }

    @Test
    fun `resolve template in string with surrounding text`() {
        val ctx = FlowContext(mutableMapOf("item" to mapOf("sku" to "WIDGET")))
        assertEquals("Scan item WIDGET", ctx.resolve("Scan item {{context.item.sku}}"))
    }

    @Test
    fun `resolve multiple templates in one string`() {
        val ctx = FlowContext(mutableMapOf(
            "location" to mapOf("zone" to "B", "aisle" to "05"),
        ))
        assertEquals("B-05", ctx.resolve("{{context.location.zone}}-{{context.location.aisle}}"))
    }

    @Test
    fun `resolve returns original when path not found`() {
        val ctx = FlowContext(mutableMapOf())
        assertEquals("{{context.missing}}", ctx.resolve("{{context.missing}}"))
    }

    @Test
    fun `resolve input template`() {
        val ctx = FlowContext(mutableMapOf())
        assertEquals("SCANNED-VALUE", ctx.resolve("{{input}}", input = "SCANNED-VALUE"))
    }

    @Test
    fun `get returns value at path`() {
        val ctx = FlowContext(mutableMapOf("qty" to 5))
        assertEquals(5, ctx.get("qty"))
    }

    @Test
    fun `get returns null for missing path`() {
        val ctx = FlowContext(mutableMapOf())
        assertNull(ctx.get("missing"))
    }

    @Test
    fun `set updates value`() {
        val ctx = FlowContext(mutableMapOf())
        ctx.set("scanned_sku", "ABC")
        assertEquals("ABC", ctx.get("scanned_sku"))
    }

    @Test
    fun `mergeStateData adds all entries`() {
        val ctx = FlowContext(mutableMapOf("a" to 1))
        ctx.mergeStateData(mapOf("b" to 2, "c" to 3))
        assertEquals(1, ctx.get("a"))
        assertEquals(2, ctx.get("b"))
        assertEquals(3, ctx.get("c"))
    }
}
