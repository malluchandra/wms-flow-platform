import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface ValidateBody {
  barcode: string;
  expected_sku?: string;
  task_id?: string;
  step_id?: string;
  flow_id?: string;
  barcode_type?: string;
  device_id?: string;
}

export default async function scanRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // POST /scans/validate — validate barcode against item master
  app.post('/validate', {
    schema: {
      body: {
        type: 'object',
        required: ['barcode'],
        properties: {
          barcode: { type: 'string' },
          expected_sku: { type: 'string' },
          task_id: { type: 'string' },
          step_id: { type: 'string' },
          flow_id: { type: 'string' },
          barcode_type: { type: 'string' },
          device_id: { type: 'string' },
        },
      },
    },
  }, async (req: FastifyRequest<{ Body: ValidateBody }>, reply: FastifyReply) => {
    const { barcode, expected_sku, task_id, step_id, flow_id, barcode_type, device_id } = req.body;
    const workerId = req.user.sub;
    const tenantId = req.user.tenant_id;

    // Look up item by UPC using GIN index: WHERE upc @> ARRAY[$1]
    // Prisma doesn't support @> on arrays natively, so use raw query
    const items = await app.prisma.$queryRaw<Array<{
      id: string;
      sku: string;
      name: string;
      uom: string;
      lot_tracked: boolean;
      serial_tracked: boolean;
    }>>`
      SELECT id, sku, name, uom, lot_tracked, serial_tracked
      FROM core.items
      WHERE tenant_id = ${tenantId}::uuid
        AND upc @> ARRAY[${barcode}::text]
        AND is_active = true
      LIMIT 1
    `;

    const item = items[0] ?? null;

    // Determine validity
    let rejectionReason: string | null = null;

    if (!item) {
      rejectionReason = `No item found for barcode ${barcode}`;
    } else if (expected_sku && item.sku !== expected_sku) {
      rejectionReason = `Expected ${expected_sku}, scanned ${item.sku}`;
    }

    const finalResult = rejectionReason ? 'invalid' : 'valid';

    // Log scan event (always — both valid and invalid)
    await app.prisma.scanEvent.create({
      data: {
        tenant_id: tenantId,
        worker_id: workerId,
        task_id: task_id ?? null,
        flow_id: flow_id ?? null,
        step_id: step_id ?? null,
        barcode_raw: barcode,
        barcode_type: barcode_type ?? null,
        parsed_data: item ? { sku: item.sku, name: item.name } : null,
        result: finalResult,
        rejection_reason: rejectionReason,
        device_id: device_id ?? null,
      },
    });

    if (finalResult === 'invalid') {
      return reply.code(422).send({
        error: rejectionReason,
        barcode,
      });
    }

    return {
      sku: item!.sku,
      name: item!.name,
      uom: item!.uom,
      lot_tracked: item!.lot_tracked,
      serial_tracked: item!.serial_tracked,
      lot: null, // GS1-128 lot parsing is Phase 2
    };
  });
}
