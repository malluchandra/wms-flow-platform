package com.kinetic.wms.scanner

import android.content.Context
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.kinetic.wms.data.model.BarcodeType
import java.util.concurrent.Executors

class CameraScanner(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner,
) : ScannerInterface {

    private var cameraProvider: ProcessCameraProvider? = null

    @ExperimentalGetImage
    override fun startListening(onScan: (ScanResult) -> Unit) {
        val future = ProcessCameraProvider.getInstance(context)
        future.addListener({
            val provider = future.get()
            cameraProvider = provider

            val preview = Preview.Builder().build()
            val scanner = BarcodeScanning.getClient()
            val analysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            analysis.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy ->
                val mediaImage = imageProxy.image ?: run { imageProxy.close(); return@setAnalyzer }
                val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

                scanner.process(inputImage)
                    .addOnSuccessListener { barcodes ->
                        barcodes.firstOrNull()?.let { barcode ->
                            val raw = barcode.rawValue ?: return@let
                            val type = mapFormat(barcode.format)
                            val gs1Fields = if (GS1128Parser.isGS1128(raw)) {
                                GS1128Parser.parse(raw)
                            } else {
                                emptyMap()
                            }
                            onScan(ScanResult(raw, type, gs1Fields))
                        }
                    }
                    .addOnCompleteListener { imageProxy.close() }
            }

            provider.unbindAll()
            provider.bindToLifecycle(
                lifecycleOwner,
                CameraSelector.DEFAULT_BACK_CAMERA,
                preview,
                analysis,
            )
        }, { it.run() })
    }

    override fun stopListening() {
        cameraProvider?.unbindAll()
    }

    private fun mapFormat(format: Int): BarcodeType? = when (format) {
        Barcode.FORMAT_QR_CODE -> BarcodeType.QR
        Barcode.FORMAT_DATA_MATRIX -> BarcodeType.DATA_MATRIX
        Barcode.FORMAT_CODE_128 -> BarcodeType.CODE_128
        else -> null
    }
}
