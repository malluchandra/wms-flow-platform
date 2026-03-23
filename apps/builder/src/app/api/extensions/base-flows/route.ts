import { NextRequest, NextResponse } from 'next/server';
import { getBaseFlows } from '@/lib/extension-actions';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const flows = await getBaseFlows();
    return NextResponse.json({
      flows: flows.map((f) => ({
        id: f.id,
        name: f.name,
        display_name: f.display_name,
        version: f.version,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
