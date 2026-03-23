package com.kinetic.wms.scanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import com.kinetic.wms.data.model.BarcodeType

class HoneywellScanner(private val context: Context) : ScannerInterface {

    private var receiver: BroadcastReceiver? = null

    override fun startListening(onScan: (ScanResult) -> Unit) {
        receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                val barcode = intent.getStringExtra("data") ?: return
                val barcodeType = if (GS1128Parser.isGS1128(barcode)) BarcodeType.GS1_128 else BarcodeType.CODE_128
                val gs1Fields = if (GS1128Parser.isGS1128(barcode)) {
                    GS1128Parser.parse(barcode)
                } else {
                    emptyMap()
                }
                onScan(ScanResult(barcode, barcodeType, gs1Fields))
            }
        }
        val filter = IntentFilter("com.honeywell.scan.broadcast")
        context.registerReceiver(receiver, filter)
    }

    override fun stopListening() {
        receiver?.let { context.unregisterReceiver(it) }
        receiver = null
    }
}
