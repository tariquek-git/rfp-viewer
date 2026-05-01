import { NextResponse } from 'next/server';
import { recentAICalls, aiCostSummary } from '@/lib/aiLog';

/**
 * Live view into the last ~100 AI calls served by this server process.
 * Auth is enforced by the global middleware. In production this resets
 * on each cold start (Vercel) — fine for local debugging, replace with
 * a persistent log sink if/when needed.
 */
export async function GET() {
  return NextResponse.json({
    summary: aiCostSummary(),
    calls: recentAICalls(),
  });
}
