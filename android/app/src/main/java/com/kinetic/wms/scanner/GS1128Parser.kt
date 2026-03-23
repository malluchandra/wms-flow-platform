package com.kinetic.wms.scanner

/**
 * Parses GS1-128 barcodes by extracting Application Identifiers (AIs).
 *
 * Supported AIs:
 * - (01) GTIN: 14 fixed digits
 * - (10) Lot number: variable length, GS-terminated
 * - (17) Expiry date: 6 fixed digits (YYMMDD)
 * - (21) Serial number: variable length, GS-terminated
 * - (310x) Net weight: 6 fixed digits (x = decimal position)
 */
object GS1128Parser {

    private const val GS = '\u001D'

    private data class AISpec(val aiLength: Int, val dataLength: Int)

    private val AI_SPECS = listOf(
        "3100" to AISpec(4, 6),
        "3101" to AISpec(4, 6),
        "3102" to AISpec(4, 6),
        "3103" to AISpec(4, 6),
        "3104" to AISpec(4, 6),
        "3105" to AISpec(4, 6),
        "01" to AISpec(2, 14),
        "17" to AISpec(2, 6),
        "10" to AISpec(2, -1),
        "21" to AISpec(2, -1),
    )

    fun isGS1128(barcode: String): Boolean {
        val cleaned = stripSymbologyId(barcode)
        return AI_SPECS.any { (prefix, _) -> cleaned.startsWith(prefix) }
    }

    fun parse(barcode: String): Map<String, String> {
        val cleaned = stripSymbologyId(barcode)
        if (!isGS1128(cleaned)) return emptyMap()

        val result = mutableMapOf<String, String>()
        var pos = 0

        while (pos < cleaned.length) {
            val matched = AI_SPECS.firstOrNull { (prefix, _) ->
                cleaned.startsWith(prefix, pos)
            }

            if (matched == null) break

            val (aiPrefix, spec) = matched
            pos += spec.aiLength

            if (spec.dataLength > 0) {
                val end = minOf(pos + spec.dataLength, cleaned.length)
                result[aiPrefix] = cleaned.substring(pos, end)
                pos = end
            } else {
                val gsIndex = cleaned.indexOf(GS, pos)
                val end = if (gsIndex == -1) cleaned.length else gsIndex
                result[aiPrefix] = cleaned.substring(pos, end)
                pos = if (gsIndex == -1) end else gsIndex + 1
            }
        }

        return result
    }

    private fun stripSymbologyId(barcode: String): String =
        if (barcode.startsWith("]C1")) barcode.substring(3) else barcode
}
