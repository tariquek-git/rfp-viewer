import { test, expect } from '@playwright/test';

test.describe('RFP Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('rfp-onboarded', 'true'));
    await page.reload();
    await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
  });

  test('has exactly 383 questions', async ({ page }) => {
    await expect(page.locator('header')).toContainText('383');
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    expect(data.questions.length).toBe(383);
  });

  test('has exactly 12 categories', async ({ page }) => {
    await expect(page.locator('header')).toContainText('12');
  });

  test('all 12 category tabs are present', async ({ page }) => {
    const expectedCategories = [
      'Loyalty and Benefits',
      'Partner Relationships',
      'Technology',
      'Application Processing',
      'Activation and Fulfillment',
      'Acquisition and Lifecycle Marketing',
      'Compliance & Reporting',
      'Processing',
      'Customer Experience',
      'Collections and Recovery',
      'Accounting & Finance',
      'Product Operations',
    ];
    for (const cat of expectedCategories) {
      await expect(page.locator(`[data-tour="tour-category-nav"] button`, { hasText: cat }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('category question counts are correct', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const expectedCounts: Record<string, number> = {
      'Loyalty and Benefits': 12,
      'Partner Relationships': 33,
      Technology: 37,
      'Application Processing': 50,
      'Activation and Fulfillment': 29,
      'Acquisition and Lifecycle Marketing': 27,
      'Compliance & Reporting': 29,
      Processing: 43,
      'Customer Experience': 42,
      'Collections and Recovery': 16,
      'Accounting & Finance': 15,
      'Product Operations': 50,
    };
    for (const [cat, expected] of Object.entries(expectedCounts)) {
      const actual = data.questions.filter((q: { category: string }) => q.category === cat).length;
      expect(actual, `${cat} count`).toBe(expected);
    }
  });

  test('confidence counts are 376 GREEN, 0 YELLOW, 7 RED', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const green = data.questions.filter((q: { confidence: string }) => q.confidence === 'GREEN').length;
    const yellow = data.questions.filter((q: { confidence: string }) => q.confidence === 'YELLOW').length;
    const red = data.questions.filter((q: { confidence: string }) => q.confidence === 'RED').length;
    expect(green).toBe(376);
    expect(yellow).toBe(0);
    expect(red).toBe(7);
  });

  test('header confidence dots show correct live counts', async ({ page }) => {
    // 376 green shown as first dot stat
    const stats = page.locator('[data-tour="tour-confidence-stats"]');
    await expect(stats).toContainText('376');
    await expect(stats).toContainText('7');
  });

  test('stats object matches actual question data', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const green = data.questions.filter((q: { confidence: string }) => q.confidence === 'GREEN').length;
    const yellow = data.questions.filter((q: { confidence: string }) => q.confidence === 'YELLOW').length;
    const red = data.questions.filter((q: { confidence: string }) => q.confidence === 'RED').length;
    expect(data.stats.total).toBe(383);
    expect(data.stats.green).toBe(green);
    expect(data.stats.yellow).toBe(yellow);
    expect(data.stats.red).toBe(red);
  });

  test('7 RED questions are the expected refs', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const redRefs = data.questions
      .filter((q: { confidence: string }) => q.confidence === 'RED')
      .map((q: { ref: string }) => q.ref)
      .sort();
    expect(redRefs).toEqual([
      'Activation and Fulfillment 15',
      'Processing 26',
      'Product Operations 45',
      'Product Operations 46',
      'Technology 24',
      'Technology 28',
      'Technology 6',
    ]);
  });

  test('5 non-compliant (N) questions are the expected refs', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const nonCompliant = data.questions
      .filter((q: { compliant: string }) => q.compliant === 'N')
      .map((q: { ref: string }) => q.ref)
      .sort();
    expect(nonCompliant).toEqual([
      'Activation and Fulfillment 15',
      'Processing 26',
      'Product Operations 45',
      'Product Operations 46',
      'Technology 6',
    ]);
  });

  test('3 partial-compliant questions are the expected refs', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const partial = data.questions
      .filter((q: { compliant: string }) => q.compliant === 'Partial')
      .map((q: { ref: string }) => q.ref)
      .sort();
    expect(partial).toEqual(['Product Operations 1', 'Technology 24', 'Technology 28']);
  });

  test('no empty bullet responses', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const empty = data.questions.filter((q: { bullet: string }) => !q.bullet || q.bullet.trim() === '');
    expect(empty.length).toBe(0);
  });

  test('no empty paragraph responses', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const empty = data.questions.filter((q: { paragraph: string }) => !q.paragraph || q.paragraph.trim() === '');
    expect(empty.length).toBe(0);
  });

  test('all questions have valid confidence values', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const invalid = data.questions.filter((q: { confidence: string }) => !['GREEN', 'YELLOW', 'RED'].includes(q.confidence));
    expect(invalid.length).toBe(0);
  });

  test('all questions have valid compliant values', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const invalid = data.questions.filter((q: { compliant: string }) => !['Y', 'N', 'Partial'].includes(q.compliant));
    expect(invalid.length).toBe(0);
  });

  test('question numbering is sequential within each category', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const byCategory: Record<string, number[]> = {};
    for (const q of data.questions) {
      if (!byCategory[q.category]) byCategory[q.category] = [];
      byCategory[q.category].push(q.number);
    }
    for (const [cat, numbers] of Object.entries(byCategory)) {
      const sorted = [...numbers].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        expect(sorted[i], `${cat}[${i}]`).toBe(i + 1);
      }
    }
  });

  test('first question ref is Loyalty and Benefits 1', async ({ page }) => {
    const firstRef = page.locator('tbody tr:first-child td button').first();
    await expect(firstRef).toContainText('Loyalty and Benefits 1');
  });

  test('Q1 bullet contains key Brim content', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const q1 = data.questions.find((q: { ref: string }) => q.ref === 'Loyalty and Benefits 1');
    expect(q1.bullet).toContain('Brim');
    expect(q1.bullet).toContain('Reward');
    expect(q1.bullet.length).toBeGreaterThan(500);
  });

  test('Technology 6 is RED and non-compliant', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const tech6 = data.questions.find((q: { ref: string }) => q.ref === 'Technology 6');
    expect(tech6.confidence).toBe('RED');
    expect(tech6.compliant).toBe('N');
  });
});
