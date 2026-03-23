import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Outbound Picking Flow Definition (from spec section 6) ──
const outboundPickingFlow = {
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
      extension_point: 'after-location-scan',
      expected_value: '{{context.task_line.location.barcode}}',
      validation: {
        type: 'exact_match',
        error_message: 'Wrong location. Expected {{context.task_line.location.barcode}}',
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
      extension_point: 'after-item-scan',
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
      extension_point: 'after-quantity-entry',
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
      extension_point: 'after-pick-confirm',
      summary_fields: ['location_barcode', 'item_sku', 'lot_number', 'qty_picked'],
      on_confirm: {
        api_call: {
          endpoint: '/tasks/{{context.task_id}}/lines/{{context.task_line.id}}/complete',
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
        { label: 'Pick Available Qty', value: 'pick_short', next_step: 'confirm-pick' },
        { label: 'Try Alternate Location', value: 'alternate', next_step: 'navigate-to-location' },
        { label: 'Skip This Line', value: 'skip', next_step: 'next-line-or-complete' },
        { label: 'Escalate to Supervisor', value: 'escalate', next_step: 'escalate-handler' },
      ],
    },
    {
      id: 'exception-handler',
      type: 'menu_select',
      prompt: 'Exception',
      options: [
        { label: 'Cannot Scan — Enter Manually', value: 'manual', next_step: '{{caller_step}}' },
        { label: 'Item Not Found', value: 'not_found', next_step: 'short-pick-handler' },
        { label: 'Escalate to Supervisor', value: 'escalate', next_step: 'escalate-handler' },
        { label: 'Cancel Task', value: 'cancel', next_step: 'cancel-confirm' },
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

// ─── Item definitions ─────────────────────────────────────────
const itemDefs = [
  { sku: 'WIDGET-A', name: 'Widget Alpha', upc: ['100000000001', '100000000002'], uom: 'EA', velocity_class: 'A' },
  { sku: 'WIDGET-B', name: 'Widget Beta', upc: ['100000000003'], uom: 'EA', velocity_class: 'A' },
  { sku: 'WIDGET-C', name: 'Widget Charlie', upc: ['100000000004', '100000000005'], uom: 'CS', velocity_class: 'B' },
  { sku: 'WIDGET-D', name: 'Widget Delta', upc: ['100000000006'], uom: 'EA', velocity_class: 'A' },
  { sku: 'WIDGET-E', name: 'Widget Echo', upc: ['100000000007'], uom: 'PL', velocity_class: 'C' },
  { sku: 'WIDGET-F', name: 'Widget Foxtrot', upc: ['100000000008', '100000000009'], uom: 'EA', velocity_class: 'B' },
  { sku: 'WIDGET-G', name: 'Widget Golf', upc: ['100000000010'], uom: 'CS', velocity_class: 'B' },
  { sku: 'WIDGET-H', name: 'Widget Hotel', upc: ['100000000011'], uom: 'EA', velocity_class: 'A' },
  { sku: 'WIDGET-I', name: 'Widget India', upc: ['100000000012', '100000000013'], uom: 'EA', velocity_class: 'C' },
  { sku: 'WIDGET-J', name: 'Widget Juliet', upc: ['100000000014'], uom: 'CS', velocity_class: 'B' },
  { sku: 'WIDGET-K', name: 'Widget Kilo', upc: ['100000000015'], uom: 'EA', velocity_class: 'A' },
  { sku: 'WIDGET-L', name: 'Widget Lima', upc: ['100000000016', '100000000017'], uom: 'PL', velocity_class: 'C' },
  { sku: 'WIDGET-M', name: 'Widget Mike', upc: ['100000000018'], uom: 'EA', velocity_class: 'A' },
  { sku: 'WIDGET-N', name: 'Widget November', upc: ['100000000019'], uom: 'EA', velocity_class: 'B' },
  { sku: 'WIDGET-O', name: 'Widget Oscar', upc: ['100000000020', '100000000021'], uom: 'CS', velocity_class: 'B' },
  { sku: 'WIDGET-P', name: 'Widget Papa', upc: ['100000000022'], uom: 'EA', velocity_class: 'A' },
  { sku: 'WIDGET-Q', name: 'Widget Quebec', upc: ['100000000023'], uom: 'EA', velocity_class: 'C' },
  { sku: 'WIDGET-R', name: 'Widget Romeo', upc: ['100000000024', '100000000025'], uom: 'PL', velocity_class: 'C' },
  { sku: 'WIDGET-S', name: 'Widget Sierra', upc: ['100000000026'], uom: 'EA', velocity_class: 'B' },
  { sku: 'WIDGET-T', name: 'Widget Tango', upc: ['100000000027'], uom: 'CS', velocity_class: 'A' },
];

// ─── Location definitions ─────────────────────────────────────
const locationDefs = [
  { barcode: 'A-01-01-A', zone: 'A', aisle: '01', bay: '01', level: 'A' },
  { barcode: 'A-01-02-A', zone: 'A', aisle: '01', bay: '02', level: 'A' },
  { barcode: 'A-01-03-A', zone: 'A', aisle: '01', bay: '03', level: 'A' },
  { barcode: 'A-01-04-A', zone: 'A', aisle: '01', bay: '04', level: 'A' },
  { barcode: 'A-01-05-A', zone: 'A', aisle: '01', bay: '05', level: 'A' },
  { barcode: 'B-01-01-A', zone: 'B', aisle: '01', bay: '01', level: 'A' },
  { barcode: 'B-01-02-A', zone: 'B', aisle: '01', bay: '02', level: 'A' },
  { barcode: 'B-01-03-A', zone: 'B', aisle: '01', bay: '03', level: 'A' },
  { barcode: 'B-01-04-A', zone: 'B', aisle: '01', bay: '04', level: 'A' },
  { barcode: 'B-01-05-A', zone: 'B', aisle: '01', bay: '05', level: 'A' },
];

async function main() {
  console.log('Seeding database...');

  // 1. Create tenant (upsert for idempotency)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'korber-internal' },
    update: {},
    create: {
      name: 'Korber Internal',
      slug: 'korber-internal',
      is_active: true,
    },
  });
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Create workers
  const workerDefs = [
    { name: 'Alex Supervisor', badge_id: 'SUP-001', role: 'supervisor' },
    { name: 'Jordan Picker', badge_id: 'PICK-001', role: 'picker' },
    { name: 'Casey Picker', badge_id: 'PICK-002', role: 'picker' },
    { name: 'Morgan Picker', badge_id: 'PICK-003', role: 'picker' },
    { name: 'Riley Picker', badge_id: 'PICK-004', role: 'picker' },
  ];

  const workers = [];
  for (const w of workerDefs) {
    const worker = await prisma.worker.upsert({
      where: {
        tenant_id_badge_id: { tenant_id: tenant.id, badge_id: w.badge_id },
      },
      update: {},
      create: { tenant_id: tenant.id, ...w, is_active: true },
    });
    workers.push(worker);
  }
  console.log(`  Workers: ${workers.length} created`);

  // 2b. Create default builder admin user
  // Password: "admin123" — change in production
  // Generate fresh hash: node -e "require('bcrypt').hash('admin123',10).then(console.log)"
  const bcryptHash = '$2b$10$vtXj.mrLUq/Z/uhD20zwzOhJSM8NAvbstIwzKCSL4QrfyjEhPXasK';
  await prisma.$executeRaw`
    INSERT INTO auth.builder_users (id, tenant_id, email, name, password_hash, role, is_super, is_active, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      ${tenant.id}::uuid,
      'admin@korber.com',
      'Korber Admin',
      ${bcryptHash},
      'admin',
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (tenant_id, email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      is_super = EXCLUDED.is_super
  `;
  console.log('  Builder User: admin@korber.com (password: admin123)');

  // 3. Create items
  const items = [];
  for (const itemDef of itemDefs) {
    const item = await prisma.item.upsert({
      where: {
        tenant_id_sku: { tenant_id: tenant.id, sku: itemDef.sku },
      },
      update: {},
      create: {
        tenant_id: tenant.id,
        sku: itemDef.sku,
        name: itemDef.name,
        upc: itemDef.upc,
        uom: itemDef.uom,
        velocity_class: itemDef.velocity_class,
        storage_type: 'ambient',
        is_active: true,
      },
    });
    items.push(item);
  }
  console.log(`  Items: ${items.length} created`);

  // 4. Create locations
  const locations = [];
  for (const locDef of locationDefs) {
    const location = await prisma.location.upsert({
      where: {
        tenant_id_barcode: {
          tenant_id: tenant.id,
          barcode: locDef.barcode,
        },
      },
      update: {},
      create: {
        tenant_id: tenant.id,
        barcode: locDef.barcode,
        zone: locDef.zone,
        aisle: locDef.aisle,
        bay: locDef.bay,
        level: locDef.level,
        type: 'rack',
        status: 'active',
      },
    });
    locations.push(location);
  }
  console.log(`  Locations: ${locations.length} created`);

  // 5. Create inventory (2 items per location, qty 50-200)
  for (let i = 0; i < locations.length; i++) {
    const item1 = items[i * 2];
    const item2 = items[i * 2 + 1];
    const qty1 = 50 + Math.floor(Math.random() * 150);
    const qty2 = 50 + Math.floor(Math.random() * 150);

    await prisma.inventory.deleteMany({
      where: { tenant_id: tenant.id, location_id: locations[i].id },
    });

    await prisma.inventory.create({
      data: {
        tenant_id: tenant.id,
        item_id: item1.id,
        location_id: locations[i].id,
        qty_on_hand: qty1,
        qty_reserved: 0,
      },
    });
    await prisma.inventory.create({
      data: {
        tenant_id: tenant.id,
        item_id: item2.id,
        location_id: locations[i].id,
        qty_on_hand: qty2,
        qty_reserved: 0,
      },
    });
  }
  console.log('  Inventory: stocked (2 items per location)');

  // 6. Create orders + order_lines
  const orders = [];
  const allOrderLines = [];
  for (let o = 0; o < 5; o++) {
    const orderNumber = `ORD-${String(o + 1).padStart(3, '0')}`;

    const existingOrder = await prisma.order.findUnique({
      where: {
        tenant_id_order_number: {
          tenant_id: tenant.id,
          order_number: orderNumber,
        },
      },
    });
    if (existingOrder) {
      await prisma.taskLine.deleteMany({
        where: { order_line: { order_id: existingOrder.id } },
      });
      await prisma.orderLine.deleteMany({
        where: { order_id: existingOrder.id },
      });
      await prisma.waveOrder.deleteMany({
        where: { order_id: existingOrder.id },
      });
      await prisma.order.delete({ where: { id: existingOrder.id } });
    }

    const order = await prisma.order.create({
      data: {
        tenant_id: tenant.id,
        order_number: orderNumber,
        status: 'released',
        ship_to: {
          name: `Customer ${o + 1}`,
          address1: `${100 + o} Warehouse Lane`,
          city: 'Louisville',
          state: 'KY',
          zip: '40202',
          country: 'US',
        },
      },
    });
    orders.push(order);

    const lineCount = 2 + (o % 3);
    const orderLines = [];
    for (let l = 0; l < lineCount; l++) {
      const itemIndex = (o * 4 + l) % items.length;
      const orderLine = await prisma.orderLine.create({
        data: {
          tenant_id: tenant.id,
          order_id: order.id,
          item_id: items[itemIndex].id,
          qty_ordered: 5 + l * 3,
          status: 'open',
        },
      });
      orderLines.push(orderLine);
    }
    allOrderLines.push(...orderLines);
  }
  console.log(`  Orders: ${orders.length} created with ${allOrderLines.length} lines`);

  // 7. Create wave + wave_orders
  await prisma.taskLine.deleteMany({
    where: { task: { tenant_id: tenant.id } },
  });
  await prisma.task.deleteMany({ where: { tenant_id: tenant.id } });
  await prisma.waveOrder.deleteMany({
    where: { wave: { tenant_id: tenant.id } },
  });
  await prisma.wave.deleteMany({ where: { tenant_id: tenant.id } });

  const wave = await prisma.wave.create({
    data: {
      tenant_id: tenant.id,
      status: 'planning',
    },
  });

  for (const order of orders) {
    await prisma.waveOrder.create({
      data: { wave_id: wave.id, order_id: order.id },
    });
  }
  console.log(`  Wave: created with ${orders.length} orders`);

  // 8. Create tasks + task_lines (2 tasks per order, 10 total)
  const tasks = [];
  let orderLineIdx = 0;
  for (let o = 0; o < orders.length; o++) {
    const lineCount = 2 + (o % 3);
    const linesPerTask1 = Math.ceil(lineCount / 2);

    for (let t = 0; t < 2; t++) {
      const taskLinesForThisTask =
        t === 0
          ? allOrderLines.slice(orderLineIdx, orderLineIdx + linesPerTask1)
          : allOrderLines.slice(
              orderLineIdx + linesPerTask1,
              orderLineIdx + lineCount
            );

      const sourceLocIdx = (o * 2 + t) % locations.length;

      const task = await prisma.task.create({
        data: {
          tenant_id: tenant.id,
          wave_id: wave.id,
          type: 'pick',
          status: 'unassigned',
          priority: (o % 5) + 1,
          source_location_id: locations[sourceLocIdx].id,
        },
      });
      tasks.push(task);

      for (const ol of taskLinesForThisTask) {
        const locIdx = (tasks.length + taskLinesForThisTask.indexOf(ol)) % locations.length;
        await prisma.taskLine.create({
          data: {
            task_id: task.id,
            order_line_id: ol.id,
            item_id: ol.item_id,
            location_id: locations[locIdx].id,
            qty_required: ol.qty_ordered,
            status: 'open',
          },
        });
      }
    }
    orderLineIdx += lineCount;
  }
  console.log(`  Tasks: ${tasks.length} created`);

  // 9. Create flow definition
  await prisma.flowDefinition.upsert({
    where: {
      tenant_id_name_version_environment: {
        tenant_id: tenant.id,
        name: 'outbound-picking',
        version: '1.0.0',
        environment: 'dev',
      },
    },
    update: { definition: outboundPickingFlow },
    create: {
      tenant_id: tenant.id,
      name: 'outbound-picking',
      display_name: 'Outbound Picking',
      version: '1.0.0',
      definition: outboundPickingFlow,
      is_active: true,
      environment: 'dev',
    },
  });
  console.log('  Flow: outbound-picking v1.0.0 (dev) created');

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
