package com.kinetic.wms.flow

import com.kinetic.wms.data.model.*
import com.kinetic.wms.network.RuntimeApi
import com.kinetic.wms.session.SessionManager
import javax.inject.Inject

class FlowEngine @Inject constructor(
    private val api: RuntimeApi,
    private val sessionManager: SessionManager,
) {
    private var flow: FlowDefinition? = null
    private var currentStepId: String? = null
    val context: FlowContext = FlowContext()

    fun loadFlow(flowDefinition: FlowDefinition) {
        flow = flowDefinition
        currentStepId = flowDefinition.entryStep
    }

    fun currentStep(): FlowStep? {
        val f = flow ?: return null
        return f.steps.find { it.id == currentStepId }
    }

    fun currentStepIndex(): Int {
        val f = flow ?: return -1
        return f.steps.indexOfFirst { it.id == currentStepId }
    }

    fun advanceToStep(stepId: String) {
        val f = flow ?: throw IllegalStateException("No flow loaded")
        if (f.steps.none { it.id == stepId }) {
            throw IllegalArgumentException("Unknown step: $stepId")
        }
        currentStepId = stepId
    }

    fun resolveTransition(transition: TransitionValue, input: String?): String {
        return when (transition) {
            is TransitionValue.Target -> transition.stepId
            is TransitionValue.Handler -> {
                transition.setContext?.forEach { (key, valueTemplate) ->
                    val resolved = context.resolve(valueTemplate, input = input)
                    context.set(key, resolved)
                }
                transition.nextStep
            }
            is TransitionValue.Conditionals -> {
                for (cond in transition.conditions) {
                    val conditionStr = context.resolve(cond.condition, input = input)
                    if (evaluateCondition(conditionStr)) {
                        cond.setContext?.forEach { (key, valueTemplate) ->
                            val resolved = context.resolve(valueTemplate, input = input)
                            context.set(key, resolved)
                        }
                        return cond.nextStep
                    }
                }
                throw IllegalStateException("No matching condition in conditional transition")
            }
        }
    }

    suspend fun validateScan(
        barcode: String,
        expectedSku: String?,
        taskId: String?,
        stepId: String?,
        flowId: String?,
    ): ScanValidateResponse {
        return api.validateScan(
            ScanValidateRequest(
                barcode = barcode,
                expectedSku = expectedSku,
                taskId = taskId,
                stepId = stepId,
                flowId = flowId,
            )
        )
    }

    fun rehydrate(stepIndex: Int, stateData: Map<String, Any?>) {
        val f = flow ?: throw IllegalStateException("No flow loaded")
        if (stepIndex in f.steps.indices) {
            currentStepId = f.steps[stepIndex].id
        }
        context.mergeStateData(stateData)
    }

    fun totalSteps(): Int = flow?.steps?.size ?: 0

    private fun evaluateCondition(condition: String): Boolean {
        if (condition == "true") return true
        if (condition == "false") return false

        val comparisonPattern = Regex("""(.+?)\s*(<=|>=|<|>|==|!=)\s*(.+)""")
        val match = comparisonPattern.matchEntire(condition.trim()) ?: return false

        val (leftStr, op, rightStr) = match.destructured
        val left = leftStr.trim().toDoubleOrNull() ?: return false
        val right = rightStr.trim().toDoubleOrNull() ?: return false

        return when (op) {
            "<" -> left < right
            ">" -> left > right
            "<=" -> left <= right
            ">=" -> left >= right
            "==" -> left == right
            "!=" -> left != right
            else -> false
        }
    }
}
