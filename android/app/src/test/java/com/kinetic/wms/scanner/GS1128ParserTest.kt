package com.kinetic.wms.scanner

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class GS1128ParserTest {

    @Test
    fun `parses AI 01 GTIN`() {
        val result = GS1128Parser.parse("0100012345678905")
        assertEquals("00012345678905", result["01"])
    }

    @Test
    fun `parses AI 10 lot number`() {
        val result = GS1128Parser.parse("10LOT-ABC\u001D")
        assertEquals("LOT-ABC", result["10"])
    }

    @Test
    fun `parses AI 17 expiry date YYMMDD`() {
        val result = GS1128Parser.parse("17261231")
        assertEquals("261231", result["17"])
    }

    @Test
    fun `parses AI 21 serial number`() {
        val result = GS1128Parser.parse("21SER-001\u001D")
        assertEquals("SER-001", result["21"])
    }

    @Test
    fun `parses AI 3100 net weight kg no decimals`() {
        val result = GS1128Parser.parse("3100000500")
        assertEquals("000500", result["3100"])
    }

    @Test
    fun `parses composite barcode with GTIN + lot + expiry`() {
        val barcode = "0100012345678905" + "10LOT-XYZ\u001D" + "17260630"
        val result = GS1128Parser.parse(barcode)
        assertEquals("00012345678905", result["01"])
        assertEquals("LOT-XYZ", result["10"])
        assertEquals("260630", result["17"])
    }

    @Test
    fun `parses composite barcode with all five AIs`() {
        val barcode = "0100012345678905" + "10BATCH-99\u001D" + "17261231" + "21SERIAL-01\u001D" + "3102000250"
        val result = GS1128Parser.parse(barcode)
        assertEquals("00012345678905", result["01"])
        assertEquals("BATCH-99", result["10"])
        assertEquals("261231", result["17"])
        assertEquals("SERIAL-01", result["21"])
        assertEquals("000250", result["3102"])
    }

    @Test
    fun `strips symbology identifier prefix if present`() {
        val result = GS1128Parser.parse("]C10100012345678905")
        assertEquals("00012345678905", result["01"])
    }

    @Test
    fun `returns empty map for non-GS1 barcode`() {
        val result = GS1128Parser.parse("PLAIN-BARCODE-123")
        assertTrue(result.isEmpty())
    }

    @Test
    fun `isGS1128 returns true for known AI prefixes`() {
        assertTrue(GS1128Parser.isGS1128("0100012345678905"))
    }

    @Test
    fun `isGS1128 returns false for plain barcodes`() {
        assertTrue(!GS1128Parser.isGS1128("PLAIN-BARCODE"))
    }
}
