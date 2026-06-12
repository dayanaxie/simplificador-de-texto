import { test, expect, Page } from '@playwright/test';

const URL = 'http://localhost:8080';

test.describe.configure({ timeout: 90000 });

async function login(page: Page): Promise<void> {
  await page.goto(URL);

  await page.locator('input[type="email"]').fill('xielidayana@gmail.com');
  await page.locator('input[type="password"]').fill('tiami123');
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/simplifyText/, { timeout: 15000 });
}

function generarTexto(cantidadPalabras: number): string {
  return Array.from({ length: cantidadPalabras }, (_, i) => `palabra${i + 1}`).join(' ');
}

async function esperarResultadoSimplificacion(
  page: Page,
  timeout: number
): Promise<void> {
  const salida = page.getByPlaceholder('Texto simplificado');

  await expect.poll(
    async () => {
      return (await salida.inputValue()).trim();
    },
    {
      timeout,
      message: 'Se esperaba que el área de resultado tuviera texto simplificado.',
    }
  ).not.toBe('');
}

// RND-001 — Carga inicial menor a 3 segundos
test('RND-001 Carga inicial menor a 3 segundos', async ({ page }) => {
  const start = Date.now();

  await page.goto(URL);
  await page.waitForLoadState('domcontentloaded');

  const elapsed = Date.now() - start;

  console.log(`Tiempo de carga inicial: ${elapsed}ms`);
  expect(elapsed).toBeLessThan(3000);
});

// RND-002 — Simplificación de 200 palabras en menos de 30 segundos
test('RND-002 Simplificación 200 palabras menor a 30 segundos', async ({ page }) => {
  await login(page);

  const entrada = page.getByPlaceholder('Ingrese el texto original');
  const botonSimplificar = page.getByRole('button', {
    name: 'Simplificar',
    exact: true,
  });

  const texto = generarTexto(200);
  await entrada.fill(texto);
  const start = Date.now();
  await botonSimplificar.click();
  await esperarResultadoSimplificacion(page, 30000);
  const elapsed = Date.now() - start;

  console.log(`Tiempo simplificación 200 palabras: ${elapsed}ms`);
  expect(elapsed).toBeLessThan(30000);
});

// RND-003 — Simplificación de 500 palabras en menos de 50 segundos
test('RND-003 Simplificación 500 palabras menor a 50 segundos', async ({ page }) => {
  await login(page);

  const entrada = page.getByPlaceholder('Ingrese el texto original');
  const botonSimplificar = page.getByRole('button', {
    name: 'Simplificar',
    exact: true,
  });

  const texto = generarTexto(500);
  await entrada.fill(texto);
  const start = Date.now();
  await botonSimplificar.click();
  await esperarResultadoSimplificacion(page, 50000);
  const elapsed = Date.now() - start;

  console.log(`Tiempo simplificación 500 palabras: ${elapsed}ms`);
  expect(elapsed).toBeLessThan(50000);
});