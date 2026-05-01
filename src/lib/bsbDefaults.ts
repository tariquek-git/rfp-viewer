/**
 * Default DealContext for Bangor Savings Bank, derived from the legacy engine's
 * bsb_context table (now data/knowledge/bsb_context.json) and CLAUDE.md.
 *
 * Used as the initial state when no deal context has been saved yet. The user
 * can edit any field; subsequent loads come from localStorage.
 *
 * When the platform supports multiple deals, this becomes one of N seed
 * profiles (or just an example) rather than a hardcoded default.
 */

import type { DealContext } from '@/types';

export const BSB_DEAL_CONTEXT: DealContext = {
  accountName: 'Bangor Savings Bank',
  accountProfile:
    'Mutual savings bank, depositor-owned, no shareholders. Founded 1852. ~$7B+ assets, 60+ branches across Maine and New Hampshire, ~900 employees. Conservative, community-focused. "You Matter More" brand positioning.',
  relationshipStage: 'cold',
  priorEngagement:
    'No prior relationship. Principal Mastercard member (not BIN-sponsored). Replacing Centrix DTS by October 2027.',
  mustEmphasize: [
    'Mutual ownership and depositor benefit framing — no shareholder language',
    'Jack Henry jXchange integration depth and methodology (do not name proactively unless asked)',
    'Community bank fit for $7B mutual; right-sized vendor, not enterprise overkill',
    'Migration de-risking from Centrix DTS — clear plan for cardholder, dispute, rewards data',
    'Examiner-readiness: every answer holds up to OCC/FDIC third-party risk review',
  ],
  mustAvoid: [
    'Never use "Canada and US" or "Canadian and US" framing — US-only perspective',
    'Do not name Jack Henry proactively; if asked, frame as "same process as every prior integration"',
    'No shareholder-centric language; depositor benefit and community impact instead',
    'Do not cite AFFINITY CREDIT UNION in US regulatory context (provincially regulated CA)',
    'No transformation, world-class, frictionless, or motivational closers',
  ],
  evaluatorPrimary:
    'Procurement committee + Maine Bureau / FDIC examiner lens. Every answer must show BSB retains oversight, control, and decision authority.',
  evaluatorTechnical:
    'Centrix DTS replacement team and Jack Henry jXchange integration owners. Specific about API patterns, data flow, and migration mechanics.',
  evaluatorBusiness:
    'EVP of Card Services / Everblue program owner. Frame in terms of cardholder experience, time-to-value, and depositor benefit.',
  competitors: [],
  freeformNotes: '',
  sectionContexts: [],
  lastUpdated: 0,
};

export const EMPTY_DEAL_CONTEXT: DealContext = {
  accountName: '',
  accountProfile: '',
  relationshipStage: 'cold',
  priorEngagement: '',
  mustEmphasize: [],
  mustAvoid: [],
  evaluatorPrimary: '',
  evaluatorTechnical: '',
  evaluatorBusiness: '',
  competitors: [],
  freeformNotes: '',
  sectionContexts: [],
  lastUpdated: 0,
};
