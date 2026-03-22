import type { FlowDefinition } from '@wms/types';

export const validPickingFlow: FlowDefinition = {
  id: 'korber-outbound-picking-v1.0.0',
  name: 'outbound-picking',
  version: '1.0.0',
  display_name: 'Outbound Picking',
  extends: null,
  context_schema: {
    task_id: 'uuid',
    wave_id: 'uuid',
    session_id: 'uuid',
    worker_id: 'uuid',
    current_line_index: 'number',
    total_lines: 'number',
    location_confirmed: 'boolean',
    location_barcode: 'string',
    item_sku: 'string',
    lot_number: 'string',
    qty_picked: 'number',
    task_line: {
      id: 'uuid',
      qty_required: 'number',
      status: 'string',
      item: { sku: 'string', name: 'string', uom: 'string' },
      location: {
        barcode: 'string',
        zone: 'string',
        aisle: 'string',
        bay: 'string',
        level: 'string',
      },
    },
  },
  entry_step: 'navigate-to-location',
  steps: [
    {
      id: 'navigate-to-location',
      type: 'navigate',
      prompt: 'Go to Location',
      display: {
        zone: '{{context.task_line.location.zone}}',
        aisle: '{{context.task_line.location.aisle}}',
        bay: '{{context.task_line.location.bay}}',
        level: '{{context.task_line.location.level}}',
      },
      on_confirm: 'scan-location',
      on_skip: 'scan-location',
      on_exception: 'exception-handler',
    },
    {
      id: 'scan-location',
      type: 'scan',
      prompt: 'Scan Location Barcode',
      expected_value: '{{context.task_line.location.barcode}}',
      validation: {
        type: 'exact_match',
        error_message:
          'Wrong location. Expected {{context.task_line.location.barcode}}',
      },
      on_success: {
        set_context: { location_confirmed: true },
        next_step: 'scan-item',
      },
      on_failure: 'wrong-location-error',
      on_exception: 'exception-handler',
    },
    {
      id: 'scan-item',
      type: 'scan',
      prompt: 'Scan Item Barcode',
      validation: {
        type: 'api_lookup',
        endpoint: '/scans/validate',
        payload: {
          barcode: '{{input}}',
          expected_sku: '{{context.task_line.item.sku}}',
        },
      },
      on_success: {
        set_context: {
          item_sku: '{{response.sku}}',
          lot_number: '{{response.lot}}',
        },
        next_step: 'enter-quantity',
      },
      on_failure: 'wrong-item-error',
      on_exception: 'exception-handler',
    },
    {
      id: 'enter-quantity',
      type: 'number_input',
      prompt: 'Enter Quantity',
      uom: '{{context.task_line.item.uom}}',
      target: '{{context.task_line.qty_required}}',
      validation: {
        min: 0,
        max: '{{context.task_line.qty_required}}',
        short_pick_threshold: 1,
      },
      on_success: {
        set_context: { qty_picked: '{{input}}' },
        next_step: 'confirm-pick',
      },
      on_short_pick: 'short-pick-handler',
      on_exception: 'exception-handler',
    },
    {
      id: 'confirm-pick',
      type: 'confirm',
      prompt: 'Confirm Pick',
      summary_fields: [
        'location_barcode',
        'item_sku',
        'lot_number',
        'qty_picked',
      ],
      on_confirm: {
        api_call: {
          endpoint:
            '/tasks/{{context.task_id}}/lines/{{context.task_line.id}}/complete',
          method: 'POST',
          payload: {
            qty_picked: '{{context.qty_picked}}',
            lot_number: '{{context.lot_number}}',
          },
        },
        next_step: 'next-line-or-complete',
      },
      on_back: 'enter-quantity',
      on_exception: 'exception-handler',
    },
    {
      id: 'short-pick-handler',
      type: 'menu_select',
      prompt: 'Short Pick — What would you like to do?',
      options: [
        {
          label: 'Pick Available Qty',
          value: 'pick_short',
          next_step: 'confirm-pick',
        },
        {
          label: 'Try Alternate Location',
          value: 'alternate',
          next_step: 'navigate-to-location',
        },
        {
          label: 'Skip This Line',
          value: 'skip',
          next_step: 'next-line-or-complete',
        },
        {
          label: 'Escalate to Supervisor',
          value: 'escalate',
          next_step: 'escalate-handler',
        },
      ],
    },
    {
      id: 'exception-handler',
      type: 'menu_select',
      prompt: 'Exception',
      options: [
        {
          label: 'Cannot Scan — Enter Manually',
          value: 'manual',
          next_step: '{{caller_step}}',
        },
        {
          label: 'Item Not Found',
          value: 'not_found',
          next_step: 'short-pick-handler',
        },
        {
          label: 'Escalate to Supervisor',
          value: 'escalate',
          next_step: 'escalate-handler',
        },
        {
          label: 'Cancel Task',
          value: 'cancel',
          next_step: 'cancel-confirm',
        },
      ],
    },
    {
      id: 'wrong-location-error',
      type: 'message',
      prompt: 'Wrong Location',
      body: 'Expected: {{context.task_line.location.barcode}}. Please scan the correct shelf label.',
      severity: 'error',
      on_dismiss: 'scan-location',
    },
    {
      id: 'wrong-item-error',
      type: 'message',
      prompt: 'Wrong Item Scanned',
      body: 'Expected SKU {{context.task_line.item.sku}}. You scanned a different item.',
      severity: 'error',
      on_dismiss: 'scan-item',
    },
    {
      id: 'escalate-handler',
      type: 'api_call',
      prompt: 'Escalating...',
      endpoint: '/tasks/{{context.task_id}}/escalate',
      method: 'POST',
      payload: {
        worker_id: '{{context.worker_id}}',
        step_id: '{{context.caller_step}}',
      },
      on_success: { next_step: 'waiting-for-supervisor' },
      on_failure: { next_step: 'exception-handler' },
    },
    {
      id: 'waiting-for-supervisor',
      type: 'message',
      prompt: 'Supervisor Notified',
      body: 'A supervisor has been alerted. Please wait.',
      severity: 'info',
      on_dismiss: 'exception-handler',
    },
    {
      id: 'next-line-or-complete',
      type: 'api_call',
      prompt: 'Loading next line...',
      endpoint: '/sessions/{{context.session_id}}/advance-line',
      method: 'POST',
      on_success: [
        {
          condition: '{{response.has_more}} == true',
          set_context: {
            current_line_index: '{{response.current_line_index}}',
            task_line: '{{response.next_task_line}}',
          },
          next_step: 'navigate-to-location',
        },
        {
          condition: '{{response.has_more}} == false',
          next_step: 'task-complete',
        },
      ],
    },
    {
      id: 'task-complete',
      type: 'message',
      prompt: 'Task Complete',
      body: 'All {{context.total_lines}} lines picked. Well done!',
      severity: 'success',
      on_dismiss: '__exit__',
    },
    {
      id: 'cancel-confirm',
      type: 'confirm',
      prompt: 'Cancel this task? Progress will be saved.',
      on_confirm: {
        api_call: {
          endpoint: '/sessions/{{context.session_id}}/abandon',
          method: 'POST',
        },
        next_step: '__exit__',
      },
      on_back: 'exception-handler',
    },
  ],
};
