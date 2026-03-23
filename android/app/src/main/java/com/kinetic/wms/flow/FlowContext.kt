package com.kinetic.wms.flow

class FlowContext(private val data: MutableMap<String, Any?> = mutableMapOf()) {

    private val templatePattern = Regex("""\{\{(.*?)\}\}""")

    fun resolve(template: String, input: String? = null): String {
        return templatePattern.replace(template) { match ->
            val path = match.groupValues[1].trim()
            when {
                path == "input" -> input ?: match.value
                path.startsWith("context.") -> {
                    val resolved = resolvePath(path.removePrefix("context."))
                    resolved?.toString() ?: match.value
                }
                else -> match.value
            }
        }
    }

    fun get(key: String): Any? = data[key]

    fun set(key: String, value: Any?) {
        data[key] = value
    }

    fun mergeStateData(stateData: Map<String, Any?>) {
        data.putAll(stateData)
    }

    fun toMap(): Map<String, Any?> = data.toMap()

    @Suppress("UNCHECKED_CAST")
    private fun resolvePath(path: String): Any? {
        val parts = path.split(".")
        var current: Any? = data
        for (part in parts) {
            current = when (current) {
                is Map<*, *> -> (current as Map<String, Any?>)[part]
                else -> return null
            }
        }
        return current
    }
}
