import { test, expect, Page } from '@playwright/test';

const URL = 'http://localhost:8080';
const CORREO_VALIDO = 'xielidayana@gmail.com';
const PASSWORD_VALIDO = 'tiami123';

// CP-001 — Login exitoso como usuario
test('CP-001 Login exitoso redirige según rol', async ({ page }) => {
  await page.goto(URL);
  await page.fill('input[type="email"]', CORREO_VALIDO);
  await page.fill('input[type="password"]', PASSWORD_VALIDO);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/simplifyText|admin/);
});

// CP-002 — Contraseña incorrecta
test('CP-002 Login con contraseña incorrecta muestra error', async ({ page }) => {
  await page.goto(URL);
  await page.fill('input[type="email"]', CORREO_VALIDO);
  await page.fill('input[type="password"]', 'contraseñaMal999');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Correo o contraseña incorrectos')).toBeVisible();
  await expect(page).not.toHaveURL(/simplifyText/);
});

// CP-003 — Cuenta inactiva
test('CP-003 Login con cuenta inactiva muestra mensaje específico', async ({ page }) => {
  await page.goto(URL);
  await page.fill('input[type="email"]', 'sol@gmail.com');
  await page.fill('input[type="password"]', 'solquiros123');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Su cuenta está inactiva')).toBeVisible();
});

// CP-004 — Cierre de sesión
test('CP-004 Cierre de sesión limpia sesión y redirige a login', async ({ page }) => {
  // Primero hace login
  await page.goto(URL);
  await page.fill('input[type="email"]', CORREO_VALIDO);
  await page.fill('input[type="password"]', PASSWORD_VALIDO);
  await page.click('button[type="submit"]');
  await page.waitForURL(/simplifyText|admin/);

  // Luego cierra sesión
  await page.click('text=Perfil');
  await page.click('text=Cerrar sesión');

  await expect(page).toHaveURL(URL + '/');

  // Verifica que localStorage quedó vacío
  const role = await page.evaluate(() => localStorage.getItem('role'));
  expect(role).toBeNull();
});