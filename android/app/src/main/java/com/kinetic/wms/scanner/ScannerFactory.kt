package com.kinetic.wms.scanner

enum class ScannerType { ZEBRA, HONEYWELL, CAMERA }

object ScannerFactory {

    fun detectType(manufacturer: String): ScannerType {
        val lower = manufacturer.lowercase()
        return when {
            lower.contains("zebra") -> ScannerType.ZEBRA
            lower.contains("honeywell") -> ScannerType.HONEYWELL
            else -> ScannerType.CAMERA
        }
    }
}
