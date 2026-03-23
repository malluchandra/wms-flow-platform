package com.kinetic.wms.scanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import com.kinetic.wms.data.model.BarcodeType

class ZebraDataWedgeScanner(private val context: Context) : ScannerInterface {

    private var receiver: BroadcastReceiver? = null

    override fun startListening(onScan: (ScanResult) -> Unit) {
        receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                val barcode = intent.getStringExtra("com.symbol.datawedge.data_string") ?: return
                val labelType = intent.getStringExtra("com.symbol.datawedge.label_type")
                val barcodeType = mapLabelType(labelType)
                val gs1Fields = if (GS1128Parser.isGS1128(barcode)) {
                    GS1128Parser.parse(barcode)
                } else {
                    emptyMap()
                }
                onScan(ScanResult(barcode, barcodeType, gs1Fields))
            }
        }
        val filter = IntentFilter("com.symbol.datawedge.api.RESULT_ACTION")
        context.registerReceiver(receiver, filter)
    }

    override fun stopListening() {
        receiver?.let { context.unregisterReceiver(it) }
        receiver = null
    }

    private fun mapLabelType(labelType: String?): BarcodeType? = when {
        labelType == null -> null
        labelType.contains("GS1", ignoreCase = true) -> BarcodeType.GS1_128
        labelType.contains("128", ignoreCase = true) -> BarcodeType.CODE_128
        labelType.contains("QR", ignoreCase = true) -> BarcodeType.QR
        else -> null
    }
}
