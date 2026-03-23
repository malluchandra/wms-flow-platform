package com.kinetic.wms.flow

import androidx.compose.runtime.Composable
import com.kinetic.wms.data.model.FlowStep
import com.kinetic.wms.data.model.StepType
import com.kinetic.wms.flow.renderers.*
import com.kinetic.wms.scanner.ScanResult

class UnsupportedStepTypeException(stepType: StepType) :
    RuntimeException("No renderer for step type: ${stepType.name.lowercase()}")

data class StepCallbacks(
    val onSuccess: (input: String?) -> Unit,
    val onFailure: ((error: String) -> Unit)? = null,
    val onConfirm: (() -> Unit)? = null,
    val onBack: (() -> Unit)? = null,
    val onMenuSelect: ((value: String, nextStep: String) -> Unit)? = null,
    val onException: ((action: String, nextStep: String) -> Unit)? = null,
)

typealias StepRendererComposable = @Composable (
    step: FlowStep,
    context: FlowContext,
    callbacks: StepCallbacks,
    scanResult: ScanResult?,
    isValidating: Boolean,
    validationError: String?,
) -> Unit

object StepRendererRegistry {

    private val renderers: Map<StepType, StepRendererComposable> = mapOf(
        StepType.NAVIGATE to { step, ctx, cb, _, _, _ -> NavigateStepContent(step, ctx, cb) },
        StepType.SCAN to { step, ctx, cb, scan, validating, error -> ScanStepContent(step, ctx, cb, scan, validating, error) },
        StepType.NUMBER_INPUT to { step, ctx, cb, _, _, _ -> NumericInputContent(step, ctx, cb) },
        StepType.CONFIRM to { step, ctx, cb, _, _, _ -> ConfirmStepContent(step, ctx, cb) },
        StepType.MENU_SELECT to { step, ctx, cb, _, _, _ -> MenuSelectContent(step, ctx, cb) },
        StepType.MESSAGE to { step, ctx, cb, _, _, _ -> NavigateStepContent(step, ctx, cb) },
        StepType.EXCEPTION_MENU to { step, ctx, cb, _, _, _ -> ExceptionMenuContent(step, ctx, cb) },
    )

    fun resolve(stepType: StepType): StepRendererComposable =
        renderers[stepType] ?: throw UnsupportedStepTypeException(stepType)
}
