import { NextResponse } from 'next/server';
import type { RFPData } from '@/types';
import { exportWordReview } from '@/lib/exportWordReview';

export async function POST(request: Request) {
  const body = (await request.json()) as { data: RFPData };

  const buffer = await exportWordReview(body.data, { returnBuffer: true });

  const buf = buffer as Buffer;
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="BSB_RFP_Working_Copy_Brim_Financial.docx"',
    },
  });
}
