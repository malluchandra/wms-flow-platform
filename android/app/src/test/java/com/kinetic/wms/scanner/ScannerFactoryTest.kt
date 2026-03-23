package com.kinetic.wms.scanner

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class ScannerFactoryTest {

    @Test
    fun `returns ZEBRA for Zebra Technologies manufacturer`() {
        assertEquals(ScannerType.ZEBRA, ScannerFactory.detectType("Zebra Technologies"))
    }

    @Test
    fun `returns HONEYWELL for Honeywell manufacturer`() {
        assertEquals(ScannerType.HONEYWELL, ScannerFactory.detectType("Honeywell"))
    }

    @Test
    fun `returns HONEYWELL for honeywell lowercase`() {
        assertEquals(ScannerType.HONEYWELL, ScannerFactory.detectType("honeywell"))
    }

    @Test
    fun `returns ZEBRA for zebra lowercase`() {
        assertEquals(ScannerType.ZEBRA, ScannerFactory.detectType("zebra technologies"))
    }

    @Test
    fun `returns CAMERA for Samsung manufacturer`() {
        assertEquals(ScannerType.CAMERA, ScannerFactory.detectType("samsung"))
    }

    @Test
    fun `returns CAMERA for Google manufacturer`() {
        assertEquals(ScannerType.CAMERA, ScannerFactory.detectType("Google"))
    }

    @Test
    fun `returns CAMERA for unknown manufacturer`() {
        assertEquals(ScannerType.CAMERA, ScannerFactory.detectType("Unknown Corp"))
    }

    @Test
    fun `returns CAMERA for empty manufacturer`() {
        assertEquals(ScannerType.CAMERA, ScannerFactory.detectType(""))
    }
}
