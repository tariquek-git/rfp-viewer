import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    anthropicKey: !!process.env.ANTHROPIC_API_KEY,
    sitePassword: !!process.env.SITE_PASSWORD,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  const healthy = checks.anthropicKey && checks.sitePassword;

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks },
    { status: healthy ? 200 : 503 },
  );
}
