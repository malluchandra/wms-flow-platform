package com.kinetic.wms.flow

import com.kinetic.wms.data.model.StepType
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource

class StepRendererRegistryTest {

    @ParameterizedTest
    @EnumSource(value = StepType::class, names = ["NAVIGATE", "SCAN", "NUMBER_INPUT", "CONFIRM", "MENU_SELECT", "MESSAGE", "EXCEPTION_MENU"])
    fun `resolves renderer for supported step type`(stepType: StepType) {
        val renderer = StepRendererRegistry.resolve(stepType)
        assertNotNull(renderer)
    }

    @Test
    fun `throws for unsupported step type`() {
        assertThrows(UnsupportedStepTypeException::class.java) {
            StepRendererRegistry.resolve(StepType.PRINT)
        }
    }

    @Test
    fun `exception message includes step type name`() {
        val ex = assertThrows(UnsupportedStepTypeException::class.java) {
            StepRendererRegistry.resolve(StepType.PRINT)
        }
        assert(ex.message!!.contains("print", ignoreCase = true))
    }
}
