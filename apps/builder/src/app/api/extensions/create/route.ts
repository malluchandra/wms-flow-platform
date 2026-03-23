import { NextRequest, NextResponse } from 'next/server';
import { createFlowFromBase } from '@/lib/extension-actions';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { baseFlowId, mode, name, displayName } = body;
    if (!baseFlowId || !mode || !name || !displayName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const flow = await createFlowFromBase({ baseFlowId, mode, name, displayName });
    return NextResponse.json({ flow });
  } catch (err: any) {
    if (err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
