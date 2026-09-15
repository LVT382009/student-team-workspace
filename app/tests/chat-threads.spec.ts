import { test, expect } from '@playwright/test';
import { registerUser, authContext, seedWorkspace } from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('chat threads, reactions, edit/delete', () => {
  test('thread panel opens, reply lands in thread', async ({ browser }) => {
    const seed = await registerUser();
    const ws = await seedWorkspace(seed);
    const { context, page } = await authContext(browser, seed);
    await page.goto('/dashboard/chat');

    await page.getByText(ws.channelName).first().click();
    const composer = page.getByPlaceholder(new RegExp(`message #?${ws.channelName}`, 'i'));
    await composer.fill('thread root message');
    await composer.press('Enter');
    await expect(page.getByText('thread root message')).toBeVisible();

    // Reply via main composer reply flow
    await page
      .getByRole('button', { name: /Reply to/ })
      .first()
      .click();
    await page.getByPlaceholder(/Reply to/).fill('thread reply one');
    await page.getByPlaceholder(/Reply to/).press('Enter');
    await expect(page.getByText(/1 reply/)).toBeVisible();

    // Open thread panel
    await page.getByRole('button', { name: /open thread/ }).click();
    const panel = page.getByRole('complementary', { name: /Thread started by/ });
    await expect(panel.getByText('thread root message')).toBeVisible();
    await expect(panel.getByText('thread reply one')).toBeVisible();

    // Reply from panel composer
    await panel.getByPlaceholder(/Reply to/).fill('panel reply');
    await panel.getByPlaceholder(/Reply to/).press('Enter');
    await expect(panel.getByText('panel reply')).toBeVisible();

    await panel.getByRole('button', { name: 'Close thread' }).click();
    await expect(panel).not.toBeVisible();

    await context.close();
  });

  test('edit and delete own message', async ({ browser }) => {
    const seed = await registerUser();
    const ws = await seedWorkspace(seed);
    const { context, page } = await authContext(browser, seed);
    await page.goto('/dashboard/chat');

    await page.getByText(ws.channelName).first().click();
    const composer = page.getByPlaceholder(new RegExp(`message #?${ws.channelName}`, 'i'));
    await composer.fill('original content');
    await composer.press('Enter');
    await expect(page.getByText('original content')).toBeVisible();

    // Edit
    await page.getByText('original content').hover();
    await page.getByRole('button', { name: /Edit message/ }).click();
    await page.getByLabel('Edit message').fill('edited content');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('edited content')).toBeVisible();

    // Delete
    await page.getByText('edited content').hover();
    await page.getByRole('button', { name: /Delete message/ }).click();
    await expect(page.getByText('edited content')).not.toBeVisible();

    await context.close();
  });
});
