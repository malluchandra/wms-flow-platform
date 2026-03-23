package com.kinetic.wms.fixtures

import com.kinetic.wms.data.model.*

object TestFixtures {

    val SAMPLE_WORKER = Worker(
        id = "worker-001",
        name = "Alice",
        role = WorkerRole.PICKER,
        badgeId = "BADGE-001",
    )

    val SAMPLE_AUTH_RESPONSE = AuthResponse(
        token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ3b3JrZXItMDAxIiwidGVuYW50X2lkIjoidGVuYW50LTAwMSIsInJvbGUiOiJwaWNrZXIifQ.fake",
        worker = SAMPLE_WORKER,
    )

    val SAMPLE_TASK_LINE = TaskLineExpanded(
        id = "tl-001",
        qtyRequired = 5,
        item = TaskLineItem(sku = "SKU-100", name = "Widget A", uom = "EA"),
        location = TaskLineLocation(barcode = "A-01-01-A", zone = "A", aisle = "01", bay = "01", level = "A"),
    )

    val SAMPLE_TASK = Task(
        id = "task-001",
        assignedTo = "worker-001",
        status = TaskStatus.ASSIGNED,
        priority = 1,
        taskLines = listOf(SAMPLE_TASK_LINE),
    )

    val SIMPLE_PICKING_FLOW = FlowDefinition(
        id = "flow-001",
        name = "outbound-picking",
        version = "1.0.0",
        displayName = "Outbound Picking",
        extends = null,
        entryStep = "navigate-to-location",
        steps = listOf(
            FlowStep(
                id = "navigate-to-location",
                type = StepType.NAVIGATE,
                prompt = "Go to {{context.location.zone}}-{{context.location.aisle}}",
                display = mapOf("zone" to "{{context.location.zone}}", "aisle" to "{{context.location.aisle}}"),
                onSuccess = TransitionValue.Target("scan-location"),
            ),
            FlowStep(
                id = "scan-location",
                type = StepType.SCAN,
                prompt = "Scan location barcode",
                expectedValue = "{{context.location.barcode}}",
                onSuccess = TransitionValue.Handler(
                    nextStep = "scan-sku",
                    setContext = mapOf("scanned_location" to "{{input}}"),
                ),
                onFailure = TransitionValue.Target("scan-location"),
            ),
            FlowStep(
                id = "scan-sku",
                type = StepType.SCAN,
                prompt = "Scan item {{context.item.sku}}",
                validation = ValidationConfig(type = "api_lookup", endpoint = "/scans/validate"),
                onSuccess = TransitionValue.Target("enter-qty"),
                onFailure = TransitionValue.Target("scan-sku"),
            ),
            FlowStep(
                id = "enter-qty",
                type = StepType.NUMBER_INPUT,
                prompt = "Enter quantity picked",
                uom = "{{context.item.uom}}",
                target = "{{context.qty_required}}",
                onSuccess = TransitionValue.Conditionals(listOf(
                    ConditionalTransition(
                        condition = "{{input}} < {{context.qty_required}}",
                        nextStep = "short-pick-menu",
                    ),
                    ConditionalTransition(
                        condition = "true",
                        nextStep = "confirm-pick",
                    ),
                )),
            ),
            FlowStep(
                id = "short-pick-menu",
                type = StepType.MENU_SELECT,
                prompt = "Short pick — what happened?",
                options = listOf(
                    MenuOption(label = "Accept Short", value = "accept", nextStep = "confirm-pick"),
                    MenuOption(label = "Escalate", value = "escalate", nextStep = "escalate"),
                ),
            ),
            FlowStep(
                id = "confirm-pick",
                type = StepType.CONFIRM,
                prompt = "Confirm pick complete",
                summaryFields = listOf("sku", "qty_picked", "location"),
                onConfirm = TransitionValue.Target("navigate-to-location"),
            ),
        ),
    )

    val SAMPLE_SESSION = WorkerSession(
        id = "session-001",
        workerId = "worker-001",
        flowId = "flow-001",
        taskId = "task-001",
        stepIndex = 0,
        status = SessionStatus.ACTIVE,
    )

    const val AUTH_RESPONSE_JSON = """{"token":"test-jwt-token","worker":{"id":"worker-001","name":"Alice","role":"picker","badge_id":"BADGE-001"}}"""
    const val TASKS_JSON = """[{"id":"task-001","assigned_to":"worker-001","status":"assigned","priority":1,"task_lines":[{"id":"tl-001","qty_required":5,"item":{"sku":"SKU-100","name":"Widget A","uom":"EA"},"location":{"barcode":"A-01-01-A","zone":"A","aisle":"01","bay":"01","level":"A"},"status":"open"}]}]"""
    const val SESSION_JSON = """{"id":"session-001","worker_id":"worker-001","flow_id":"flow-001","task_id":"task-001","step_index":2,"state_data":{},"status":"active"}"""
    const val SCAN_VALID_JSON = """{"sku":"SKU-100","name":"Widget A","uom":"EA","lot_tracked":false,"serial_tracked":false,"lot":null}"""
    const val SCAN_INVALID_JSON = """{"error":"UPC not found in item master","barcode":"9999999999"}"""
}
