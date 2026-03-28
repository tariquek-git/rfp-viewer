import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

/**
 * Safely parses AI JSON output with regex fallback.
 * Logs failures and returns the fallback value instead of throwing.
 */
export function parseAIJson<T>(content: string, fallback: T, route: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    // Try to extract the first JSON object or array from the response
    const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        console.warn(`[${route}] Extracted JSON was invalid:`, match[0].slice(0, 150));
      }
    } else {
      console.warn(`[${route}] No JSON found in AI response:`, content.slice(0, 200));
    }
    return fallback;
  }
}

/**
 * Classifies Anthropic SDK errors and returns an appropriate NextResponse.
 * Call this in catch blocks for all AI API routes.
 */
export function handleAnthropicError(error: unknown, route: string): NextResponse {
  if (error instanceof Anthropic.APIError) {
    console.error(`[${route}] Anthropic API error ${error.status}:`, error.message);
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited — wait a moment and try again' },
        { status: 429 },
      );
    }
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'API authentication failed — check ANTHROPIC_API_KEY' },
        { status: 502 },
      );
    }
    if (error.status === 529) {
      return NextResponse.json(
        { error: 'Anthropic API is overloaded — try again shortly' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: `Anthropic API error (${error.status})` },
      { status: 502 },
    );
  }
  console.error(`[${route}] Unexpected error:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
