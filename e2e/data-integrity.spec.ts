import { test, expect } from '@playwright/test';

test.describe('RFP Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('rfp-onboarded', 'true'));
    await page.reload();
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('has exactly 383 questions', async ({ page }) => {
    // Check the header shows 383
    await expect(page.locator('header')).toContainText('383');
    // Check the grid shows 383 when "All" is selected
    const countText = page.locator('text=/383/').first();
    await expect(countText).toBeVisible();
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
      // Check the category name appears somewhere (in tabs or grid)
      const el = page.locator(`text=${cat}`).first();
      await expect(el).toBeVisible({ timeout: 5000 });
    }
  });

  test('category question counts are correct', async ({ page }) => {
    // Verify via the raw data
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
      expect(actual).toBe(expected);
    }
  });

  test('confidence counts match (309 green, 67 yellow, 7 red)', async ({ page }) => {
    // These appear in the header stats
    await expect(page.locator('header')).toContainText('309');
    await expect(page.locator('header')).toContainText('67');
    await expect(page.locator('header')).toContainText('7');
  });

  test('first question is Loyalty and Benefits 1', async ({ page }) => {
    const firstRef = page.locator('tbody tr:first-child button').first();
    await expect(firstRef).toContainText('Loyalty and Benefits 1');
  });

  test('question data fields are populated', async ({ page }) => {
    // Click first question to open detail
    await page.locator('tbody tr:first-child button').first().click();
    await expect(page.locator('.panel-slide-in')).toBeVisible();

    // Check essential fields exist
    await expect(page.locator('.panel-slide-in')).toContainText('BSB Requirement');
    await expect(page.locator('.panel-slide-in')).toContainText('Response (Bullet)');
    await expect(page.locator('.panel-slide-in')).toContainText('Loyalty and Benefits 1');
    await expect(page.locator('.panel-slide-in')).toContainText('Loyalty Offering and Features');
  });

  test('no empty bullet responses', async ({ page }) => {
    // Fetch the data directly and verify
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const emptyBullets = data.questions.filter(
      (q: { bullet: string }) => !q.bullet || q.bullet.trim() === '',
    );
    expect(emptyBullets.length).toBe(0);
  });

  test('no empty paragraph responses', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const emptyParagraphs = data.questions.filter(
      (q: { paragraph: string }) => !q.paragraph || q.paragraph.trim() === '',
    );
    expect(emptyParagraphs.length).toBe(0);
  });

  test('all questions have committee scores', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const noScore = data.questions.filter(
      (q: { committee_score: number }) => !q.committee_score && q.committee_score !== 0,
    );
    expect(noScore.length).toBe(0);
  });

  test('all questions have confidence values', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const validConf = ['GREEN', 'YELLOW', 'RED'];
    const invalid = data.questions.filter(
      (q: { confidence: string }) => !validConf.includes(q.confidence),
    );
    expect(invalid.length).toBe(0);
  });

  test('all questions have compliant values', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();
    const validComp = ['Y', 'N', 'Partial'];
    const invalid = data.questions.filter(
      (q: { compliant: string }) => !validComp.includes(q.compliant),
    );
    expect(invalid.length).toBe(0);
  });

  test('stats match actual question data', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();

    // Verify stats match actual counts
    const actualGreen = data.questions.filter(
      (q: { confidence: string }) => q.confidence === 'GREEN',
    ).length;
    const actualYellow = data.questions.filter(
      (q: { confidence: string }) => q.confidence === 'YELLOW',
    ).length;
    const actualRed = data.questions.filter(
      (q: { confidence: string }) => q.confidence === 'RED',
    ).length;
    const actualTotal = data.questions.length;

    expect(data.stats.total).toBe(actualTotal);
    expect(data.stats.green).toBe(actualGreen);
    expect(data.stats.yellow).toBe(actualYellow);
    expect(data.stats.red).toBe(actualRed);
    expect(actualTotal).toBe(383);
    expect(actualGreen).toBe(309);
    expect(actualYellow).toBe(67);
    expect(actualRed).toBe(7);
  });

  test('7 RED questions are the expected ones', async ({ page }) => {
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

  test('5 non-compliant questions are the expected ones', async ({ page }) => {
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

  test('question numbering is sequential within categories', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();

    // Group by category and check numbering
    const byCategory: Record<string, number[]> = {};
    for (const q of data.questions) {
      if (!byCategory[q.category]) byCategory[q.category] = [];
      byCategory[q.category].push(q.number);
    }

    for (const [, numbers] of Object.entries(byCategory)) {
      const sorted = [...numbers].sort((a, b) => a - b);
      // Check sequential (1, 2, 3, ...)
      for (let i = 0; i < sorted.length; i++) {
        expect(sorted[i]).toBe(i + 1);
      }
    }
  });

  test('humanized responses still contain key Brim content', async ({ page }) => {
    const response = await page.request.get('/rfp_data.json');
    const data = await response.json();

    // Spot check that humanization didn't remove key content
    const q1 = data.questions.find((q: { ref: string }) => q.ref === 'Loyalty and Benefits 1');
    expect(q1.bullet).toContain('Brim');
    expect(q1.bullet).toContain('Rewards');
    expect(q1.bullet.length).toBeGreaterThan(500);

    const tech6 = data.questions.find((q: { ref: string }) => q.ref === 'Technology 6');
    expect(tech6.bullet).toContain('Mastercard');
    expect(tech6.confidence).toBe('RED');
    expect(tech6.compliant).toBe('N');
  });
});
