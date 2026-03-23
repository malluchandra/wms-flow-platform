package com.kinetic.wms.scanner

import com.kinetic.wms.data.model.BarcodeType

data class ScanResult(
    val barcode: String,
    val type: BarcodeType?,
    val parsedGS1: Map<String, String>,
)

interface ScannerInterface {
    fun startListening(onScan: (ScanResult) -> Unit)
    fun stopListening()
}
