package com.kinetic.wms.flow

import com.kinetic.wms.data.model.*
import com.kinetic.wms.fixtures.TestFixtures
import com.kinetic.wms.network.RuntimeApi
import com.kinetic.wms.session.SessionManager
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class FlowEngineTest {

    private lateinit var api: RuntimeApi
    private lateinit var sessionManager: SessionManager
    private lateinit var engine: FlowEngine

    @BeforeEach
    fun setup() {
        api = mockk(relaxed = true)
        sessionManager = mockk(relaxed = true)
        engine = FlowEngine(api, sessionManager)
    }

    @Test
    fun `loadFlow sets flow definition and initializes at entry step`() {
        engine.loadFlow(TestFixtures.SIMPLE_PICKING_FLOW)

        val currentStep = engine.currentStep()
        assertNotNull(currentStep)
        assertEquals("navigate-to-location", currentStep!!.id)
    }

    @Test
    fun `resolveTransition returns step ID for Target transition`() {
        engine.loadFlow(TestFixtures.SIMPLE_PICKING_FLOW)

        val nextStepId = engine.resolveTransition(
            TransitionValue.Target("scan-location"),
            input = null,
        )
        assertEquals("scan-location", nextStepId)
    }

    @Test
    fun `resolveTransition returns step ID for Handler transition and applies context`() {
        engine.loadFlow(TestFixtures.SIMPLE_PICKING_FLOW)

        val handler = TransitionValue.Handler(
            nextStep = "scan-sku",
            setContext = mapOf("scanned_location" to "{{input}}"),
        )
        val nextStepId = engine.resolveTransition(handler, input = "A-01-01-A")
        assertEquals("scan-sku", nextStepId)
        assertEquals("A-01-01-A", engine.context.get("scanned_location"))
    }

    @Test
    fun `advanceToStep moves engine to specified step`() {
        engine.loadFlow(TestFixtures.SIMPLE_PICKING_FLOW)

        engine.advanceToStep("scan-sku")
        assertEquals("scan-sku", engine.currentStep()?.id)
    }

    @Test
    fun `advanceToStep throws for unknown step ID`() {
        engine.loadFlow(TestFixtures.SIMPLE_PICKING_FLOW)

        assertThrows(IllegalArgumentException::class.java) {
            engine.advanceToStep("nonexistent-step")
        }
    }

    @Test
    fun `validateScan calls API and returns response`() = runTest {
        val response = ScanValidateResponse(
            sku = "SKU-100", name = "Widget", uom = "EA",
        )
        coEvery { api.validateScan(any()) } returns response

        val result = engine.validateScan("0012345678905", "SKU-100", "task-1", "scan-sku", "flow-1")
        assertEquals("SKU-100", result.sku)

        coVerify {
            api.validateScan(match {
                it.barcode == "0012345678905" && it.expectedSku == "SKU-100"
            })
        }
    }

    @Test
    fun `currentStepIndex tracks position`() {
        engine.loadFlow(TestFixtures.SIMPLE_PICKING_FLOW)
        assertEquals(0, engine.currentStepIndex())

        engine.advanceToStep("scan-location")
        assertEquals(1, engine.currentStepIndex())

        engine.advanceToStep("enter-qty")
        assertEquals(3, engine.currentStepIndex())
    }

    @Test
    fun `rehydrate restores engine to specific step`() {
        engine.loadFlow(TestFixtures.SIMPLE_PICKING_FLOW)
        engine.rehydrate(stepIndex = 2, stateData = mapOf("sku" to "WIDGET"))

        assertEquals("scan-sku", engine.currentStep()?.id)
        assertEquals("WIDGET", engine.context.get("sku"))
    }
}
