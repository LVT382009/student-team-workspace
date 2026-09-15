import { expect, test } from '@playwright/test';
import { authContext, registerUser, seedWorkspace, url } from './helpers';

const THEMES = [
  'teamspace',
  'claude',
  'discord',
  'supabase',
  'vercel',
  'mono',
  'notebook',
  'light-green',
  'zen',
  'astro-vista',
  'whatsapp'
];

test.describe('theme integrity', () => {
  test('all 11 themes apply in dark mode with distinct backgrounds and no missing surfaces', async ({
    browser
  }) => {
    const seed = await registerUser();
    await seedWorkspace(seed);

    const seen = new Set<string>();
    for (const theme of THEMES) {
      // Fresh context per theme: the client provider mirrors state into
      // cookies/localStorage, so reusing one context races the next theme.
      const { context, page } = await authContext(browser, seed);
      await context.addCookies([
        { name: 'theme', value: 'dark', domain: 'localhost', path: '/' },
        { name: 'active_theme', value: theme, domain: 'localhost', path: '/' }
      ]);
      await page.goto(url('/dashboard'));

      // Theme attribute lands on <html>
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme, {
        timeout: 15000
      });

      // Background token resolves to a real color, and differs per theme
      const bg = await page.evaluate(() =>
        getComputedStyle(document.body).backgroundColor
      );
      expect(bg, `${theme}: background should resolve`).not.toBe('rgba(0, 0, 0, 0)');
      seen.add(bg);

      // Core surfaces render: sidebar nav + header
      await expect(page.getByRole('link', { name: 'Overview' }).first()).toBeVisible({
        timeout: 15000
      });
      await context.close();
    }
    expect(seen.size).toBe(THEMES.length);
  });
});
