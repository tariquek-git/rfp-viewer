import { NextResponse } from 'next/server';
import { getManifest, getRules, getClients, getMetrics } from '@/lib/knowledge';

export async function GET() {
  const manifest = getManifest();
  const liveCounts = {
    rules: getRules().length,
    clients: getClients().length,
    metrics: getMetrics().length,
  };
  const knowledgeOk =
    manifest.tables.rules === liveCounts.rules &&
    manifest.tables.clients === liveCounts.clients &&
    manifest.tables.metrics === liveCounts.metrics;

  const checks = {
    anthropicKey: !!process.env.ANTHROPIC_API_KEY,
    sitePassword: !!process.env.SITE_PASSWORD,
    nodeEnv: process.env.NODE_ENV,
    knowledge: {
      ok: knowledgeOk,
      manifest: manifest.tables,
      live: liveCounts,
    },
    timestamp: new Date().toISOString(),
  };

  const healthy = checks.anthropicKey && checks.sitePassword && knowledgeOk;

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks },
    { status: healthy ? 200 : 503 },
  );
}
