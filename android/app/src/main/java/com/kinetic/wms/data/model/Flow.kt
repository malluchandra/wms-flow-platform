package com.kinetic.wms.data.model

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

@Serializable
enum class StepType {
    @SerialName("navigate") NAVIGATE,
    @SerialName("scan") SCAN,
    @SerialName("number_input") NUMBER_INPUT,
    @SerialName("confirm") CONFIRM,
    @SerialName("menu_select") MENU_SELECT,
    @SerialName("message") MESSAGE,
    @SerialName("camera_input") CAMERA_INPUT,
    @SerialName("api_call") API_CALL,
    @SerialName("exception_menu") EXCEPTION_MENU,
    @SerialName("print") PRINT,
}

@Serializable
enum class Severity {
    @SerialName("info") INFO,
    @SerialName("error") ERROR,
    @SerialName("success") SUCCESS,
}

@Serializable
data class ApiCallConfig(
    val endpoint: String,
    val method: String,
    val payload: Map<String, String>? = null,
)

@Serializable
data class ValidationConfig(
    val type: String? = null,
    val endpoint: String? = null,
    val payload: Map<String, String>? = null,
    @SerialName("error_message") val errorMessage: String? = null,
    val min: String? = null,
    val max: String? = null,
    @SerialName("short_pick_threshold") val shortPickThreshold: Int? = null,
)

@Serializable
data class MenuOption(
    val label: String,
    val value: String,
    @SerialName("next_step") val nextStep: String,
)

@Serializable
data class ConditionalTransition(
    val condition: String,
    @SerialName("set_context") val setContext: Map<String, String>? = null,
    @SerialName("next_step") val nextStep: String,
)

@Serializable
data class TransitionHandler(
    @SerialName("set_context") val setContext: Map<String, String>? = null,
    @SerialName("api_call") val apiCall: ApiCallConfig? = null,
    @SerialName("next_step") val nextStep: String,
    @SerialName("on_api_failure") val onApiFailure: String? = null,
)

@Serializable(with = TransitionValueSerializer::class)
sealed class TransitionValue {
    data class Target(val stepId: String) : TransitionValue()
    data class Handler(
        val nextStep: String,
        val setContext: Map<String, String>? = null,
        val apiCall: ApiCallConfig? = null,
        val onApiFailure: String? = null,
    ) : TransitionValue()
    data class Conditionals(val conditions: List<ConditionalTransition>) : TransitionValue()
}

object TransitionValueSerializer : KSerializer<TransitionValue> {
    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("TransitionValue")

    override fun deserialize(decoder: Decoder): TransitionValue {
        val jsonDecoder = decoder as kotlinx.serialization.json.JsonDecoder
        return when (val element = jsonDecoder.decodeJsonElement()) {
            is JsonPrimitive -> TransitionValue.Target(element.content)
            is JsonObject -> {
                val handler = Json { ignoreUnknownKeys = true }
                    .decodeFromJsonElement(TransitionHandler.serializer(), element)
                TransitionValue.Handler(
                    nextStep = handler.nextStep,
                    setContext = handler.setContext,
                    apiCall = handler.apiCall,
                    onApiFailure = handler.onApiFailure,
                )
            }
            is JsonArray -> {
                val conditions = element.map { elem ->
                    Json { ignoreUnknownKeys = true }
                        .decodeFromJsonElement(ConditionalTransition.serializer(), elem)
                }
                TransitionValue.Conditionals(conditions)
            }
        }
    }

    override fun serialize(encoder: Encoder, value: TransitionValue) {
        val jsonElement: JsonElement = when (value) {
            is TransitionValue.Target -> JsonPrimitive(value.stepId)
            is TransitionValue.Handler -> Json.encodeToJsonElement(
                TransitionHandler.serializer(),
                TransitionHandler(value.setContext, value.apiCall, value.nextStep, value.onApiFailure),
            )
            is TransitionValue.Conditionals -> Json.encodeToJsonElement(
                kotlinx.serialization.builtins.ListSerializer(ConditionalTransition.serializer()),
                value.conditions,
            )
        }
        val jsonEncoder = encoder as JsonEncoder
        jsonEncoder.encodeJsonElement(jsonElement)
    }
}

@Serializable
data class FlowStep(
    val id: String,
    val type: StepType,
    val prompt: String,
    val display: Map<String, String>? = null,
    val body: String? = null,
    val severity: Severity? = null,
    @SerialName("expected_value") val expectedValue: String? = null,
    val validation: ValidationConfig? = null,
    val uom: String? = null,
    val target: String? = null,
    @SerialName("summary_fields") val summaryFields: List<String>? = null,
    val options: List<MenuOption>? = null,
    val endpoint: String? = null,
    val method: String? = null,
    val payload: Map<String, String>? = null,
    @SerialName("on_success") val onSuccess: TransitionValue? = null,
    @SerialName("on_failure") val onFailure: TransitionValue? = null,
    @SerialName("on_confirm") val onConfirm: TransitionValue? = null,
    @SerialName("on_back") val onBack: TransitionValue? = null,
    @SerialName("on_dismiss") val onDismiss: TransitionValue? = null,
    @SerialName("on_skip") val onSkip: TransitionValue? = null,
    @SerialName("on_exception") val onException: TransitionValue? = null,
    @SerialName("on_short_pick") val onShortPick: TransitionValue? = null,
    @SerialName("on_api_failure") val onApiFailure: TransitionValue? = null,
)

@Serializable
data class FlowDefinition(
    val id: String,
    val name: String,
    val version: String,
    @SerialName("display_name") val displayName: String,
    val extends: String? = null,
    @SerialName("context_schema") val contextSchema: Map<String, JsonElement> = emptyMap(),
    @SerialName("entry_step") val entryStep: String,
    val steps: List<FlowStep>,
)
