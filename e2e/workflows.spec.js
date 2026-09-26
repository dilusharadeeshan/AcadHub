const { test, expect } = require('@playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');
const password = 'Browser-test-passphrase-42';
async function login(page, email = 'student@acadhub.test') {
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: false }).fill(email);
  await page.getByLabel('Password *', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
}
test('student uploads, moderator approves, peers download and discuss, and question owners accept answers', async ({
  browser,
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  await page.getByRole('link', { name: 'Share a resource', exact: true }).first().click();
  await page
    .getByLabel('Resource title', { exact: false })
    .fill('Browser verified graph theory notes');
  await page
    .getByLabel('Description', { exact: false })
    .fill('Original notes uploaded through the complete browser and database workflow.');
  await page
    .getByLabel('Subject', { exact: false })
    .selectOption({ label: 'CS201 · Data Structures & Algorithms' });
  await page.getByLabel('Resource file').setInputFiles({
    name: 'browser-notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Browser-created original graph theory learning notes.'),
  });
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
  await expect(page.getByText('Waiting for review', { exact: true })).toBeVisible();
  const resourcePath = new URL(page.url()).pathname;
  const staffContext = await browser.newContext(),
    staffPage = await staffContext.newPage();
  await login(staffPage, 'moderator@acadhub.test');
  await staffPage.goto('/admin');
  const row = staffPage.getByRole('row').filter({ hasText: 'Browser verified graph theory notes' });
  await row.getByRole('button', { name: 'Review', exact: true }).click();
  await staffPage
    .getByLabel('Reason / review notes')
    .fill('Verified the original text and subject.');
  await staffPage.getByRole('button', { name: 'Confirm decision' }).click();
  await expect(staffPage.getByRole('dialog')).not.toBeVisible();
  await page.reload();
  await expect(page.getByText('approved', { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download resource' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('browser-notes.txt');
  await page
    .getByLabel('Your comment')
    .fill('The browser workflow successfully saved this helpful comment.');
  await page.getByRole('button', { name: 'Post comment' }).click();
  await expect(
    page.getByText('The browser workflow successfully saved this helpful comment.'),
  ).toBeVisible();
  await page.goto('/questions/new');
  await page
    .getByLabel('Question title', { exact: false })
    .fill('How can we verify graph traversal in this browser test?');
  await page
    .getByLabel('Details', { exact: false })
    .fill(
      'I want a clear explanation of breadth first traversal and how to reason about its queue.',
    );
  await page
    .getByLabel('Subject', { exact: false })
    .selectOption({ label: 'CS201 · Data Structures & Algorithms' });
  await page.getByLabel('Topic tags').fill('graphs, testing');
  await page.getByRole('button', { name: 'Post question' }).click();
  await expect(page).toHaveURL(/\/questions\/[a-f0-9]{24}$/);
  const questionPath = new URL(page.url()).pathname;
  await staffPage.goto(questionPath);
  await staffPage
    .getByLabel('Your answer')
    .fill('Use a queue and visit each vertex at the shallowest remaining distance.');
  await staffPage.getByRole('button', { name: 'Post answer' }).click();
  await expect(
    staffPage.getByText('Use a queue and visit each vertex at the shallowest remaining distance.'),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Accept answer', exact: true }).click();
  await expect(page.getByText('Accepted answer', { exact: true })).toBeVisible();
  await expect(page.getByText('Solved', { exact: true })).toBeVisible();
  await staffPage.goto(resourcePath);
  await staffPage.getByRole('button', { name: 'Report', exact: true }).first().click();
  await staffPage
    .getByLabel('What should we know?', { exact: false })
    .fill('Review the source attribution for this demonstration resource.');
  await staffPage.getByRole('button', { name: 'Submit report' }).click();
  await expect(staffPage.getByRole('dialog')).not.toBeVisible();
  await staffPage.goto('/admin?tab=reports');
  await expect(
    staffPage.getByRole('row').filter({ hasText: 'Browser verified graph theory notes' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await staffContext.close();
});
test('phone, tablet and desktop layouts remain usable, with no horizontal page overflow', async ({
  page,
}) => {
  await login(page);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      '/dashboard',
      '/resources',
      '/questions',
      '/subjects',
      '/profile',
      '/resources/new',
    ]) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      await expect(page.getByRole('status')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    await page.goto('/dashboard');
    await expect(page.locator('.dashboard-hero')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await page.screenshot({ path: 'artifacts/dashboard-' + width + '.png', fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('link', { name: 'Resource library' })).toBeVisible();
  await page.getByRole('link', { name: 'Resource library' }).click();
  await expect(page).toHaveURL('/resources');
});
test('core screens pass automated accessibility checks', async ({ page }) => {
  await page.goto('/login');
  let results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect
    .soft(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    )
    .toEqual([]);
  await login(page);
  for (const path of ['/dashboard', '/resources', '/questions', '/profile', '/resources/new']) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect
      .soft(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
        path,
      )
      .toEqual([]);
  }
});
test('new accounts see pending approval and students cannot access moderation', async ({
  page,
}) => {
  await page.goto('/register');
  await page.getByLabel('Full name', { exact: false }).fill('Browser New Student');
  await page
    .getByLabel('Email address', { exact: false })
    .fill('new-browser-' + Date.now() + '@acadhub.test');
  await page.getByLabel('Password *', { exact: true }).fill(password);
  await page.getByLabel('Department', { exact: false }).fill('Computer Science');
  await page.getByLabel('Batch', { exact: false }).fill('2024/2025');
  await page.getByRole('checkbox').check();
  const email = await page.getByLabel('Email address', { exact: false }).inputValue();
  await page.getByRole('button', { name: 'Create your account' }).click();
  await expect(page).toHaveURL('/login');
  await page.getByLabel('Email address', { exact: false }).fill(email);
  await page.getByLabel('Password *', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/pending');
  await page.getByRole('link', { name: 'Edit profile' }).click();
  await expect(page.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible();
  await page.goto('/pending');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL('/login');
  await login(page);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Permission denied' })).toBeVisible();
});

test('administrators approve accounts, manage subjects, and inspect reports and audit history', async ({
  browser,
  page,
}) => {
  await page.goto('/register');
  const email = 'approve-browser-' + Date.now() + '@acadhub.test';
  await page.getByLabel('Full name', { exact: false }).fill('Approval Test Student');
  await page.getByLabel('Email address', { exact: false }).fill(email);
  await page.getByLabel('Password *', { exact: true }).fill(password);
  await page.getByLabel('Department', { exact: false }).fill('Computer Science');
  await page.getByLabel('Batch', { exact: false }).fill('2024/2025');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create your account' }).click();
  await expect(page).toHaveURL('/login');
  await page.getByLabel('Email address', { exact: false }).fill(email);
  await page.getByLabel('Password *', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/pending');
  const context = await browser.newContext(),
    admin = await context.newPage();
  await login(admin, 'admin@acadhub.test');
  await admin.goto('/admin?tab=users&status=pending');
  await admin
    .getByRole('row')
    .filter({ hasText: email })
    .getByRole('button', { name: 'Manage access' })
    .click();
  await admin.getByLabel('Account status').selectOption('active');
  await admin
    .getByLabel('Reason / review notes', { exact: false })
    .fill('Verified membership through the browser workflow.');
  await admin.getByRole('button', { name: 'Confirm decision' }).click();
  await expect(admin.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Check approval status' }).click();
  await expect(page).toHaveURL('/login');
  await login(page, email);
  await admin.goto('/subjects');
  await admin.getByRole('button', { name: 'Add subject' }).click();
  await admin.getByLabel('Subject name', { exact: false }).fill('Browser Subject');
  await admin.getByLabel('Subject code', { exact: false }).fill('E2E101');
  await admin.getByLabel('Department', { exact: false }).fill('Computer Science');
  await admin.getByRole('button', { name: 'Save subject' }).click();
  await expect(admin.getByRole('heading', { name: 'Browser Subject' })).toBeVisible();
  const subjectCard = admin.locator('.subject-card').filter({ hasText: 'Browser Subject' });
  await subjectCard.getByRole('button', { name: 'Edit', exact: true }).click();
  await admin.getByLabel('Subject name', { exact: false }).fill('Browser Subject Updated');
  await admin.getByRole('button', { name: 'Save subject' }).click();
  await expect(admin.getByRole('heading', { name: 'Browser Subject Updated' })).toBeVisible();
  await admin
    .locator('.subject-card')
    .filter({ hasText: 'Browser Subject Updated' })
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await admin.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(admin.getByRole('heading', { name: 'Browser Subject Updated' })).toHaveCount(0);
  for (const path of ['/admin?tab=users', '/admin?tab=reports', '/admin?tab=audit']) {
    await admin.goto(path);
    await expect(admin.getByRole('status')).toHaveCount(0);
    await expect(admin.getByRole('heading', { name: 'Moderation workspace' })).toBeVisible();
    const result = await new AxeBuilder({ page: admin })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect
      .soft(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
        path,
      )
      .toEqual([]);
  }
  await context.close();
});
