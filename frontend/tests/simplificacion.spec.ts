import { test, expect, Page } from '@playwright/test';

const URL = process.env.PW_BASE_URL ?? 'http://localhost:8080';

const EMAIL = process.env.E2E_USER_EMAIL ?? 'xielidayana@gmail.com';
const PASSWORD = process.env.E2E_USER_PASSWORD ?? 'tiami123';

async function login(page: Page): Promise<void> {
  await page.goto(URL);

  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/simplifyText/, { timeout: 15000 });
}

async function simplificarTexto(page: Page, texto: string): Promise<string> {
  const entrada = page.getByPlaceholder('Ingrese el texto original');
  const salida = page.getByPlaceholder('Texto simplificado');

  await entrada.fill(texto);
  await page.getByRole('button', { name: 'Simplificar', exact: true }).click();
  await expect.poll(
    async () => await salida.inputValue(),
    {
      timeout: 30000,
      message: 'Se esperaba que el área de resultado tuviera texto simplificado.',
    }
  ).not.toBe('');

  return await salida.inputValue();
}

async function mockClipboard(page: Page, initialText = ''): Promise<void> {
  await page.evaluate((text) => {
    Object.defineProperty(window, '__clipboardText', {
      value: text,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: async () => {
          return (window as any).__clipboardText;
        },
        writeText: async (value: string) => {
          (window as any).__clipboardText = value;
        },
      },
    });
  }, initialText);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

// CP-007 — Simplificación exitosa
test('CP-007 Simplificación exitosa muestra resultado', async ({ page }) => {
  const salida = page.getByPlaceholder('Texto simplificado');

  await simplificarTexto(
    page,
    'El estudiante debe comprender los conceptos fundamentales.'
  );

  await expect(salida).not.toHaveValue('');
  await expect(page.getByText('Texto simplificado correctamente.')).toBeVisible();
});

// CP-008 — Texto que supera el límite
test('CP-008 Botón deshabilitado al superar límite de palabras', async ({ page }) => {
  const entrada = page.getByPlaceholder('Ingrese el texto original');
  const botonSimplificar = page.getByRole('button', {
    name: 'Simplificar',
    exact: true,
  });

  const textoLargo = 'palabra '.repeat(501);

  await entrada.fill(textoLargo);

  await expect(botonSimplificar).toBeDisabled();
  await expect(
    page.getByText(/El texto supera el límite permitido/i)
  ).toBeVisible();
});

// CP-009 — Pegar texto desde portapapeles
test('CP-009 Botón pegar inserta texto en el área de entrada', async ({ page }) => {
  const entrada = page.getByPlaceholder('Ingrese el texto original');
  const textoPegado = 'Texto copiado de prueba';

  await mockClipboard(page, textoPegado);

  await page.getByRole('button', { name: 'Pegar', exact: true }).click();

  await expect(entrada).toHaveValue(textoPegado, { timeout: 10000 });
  await expect(page.getByText('Texto pegado correctamente.')).toBeVisible({
    timeout: 10000,
  });
});

// CP-010 — Copiar resultado
test('CP-010 Botón copiar guarda el resultado en portapapeles', async ({ page }) => {
  await mockClipboard(page);

  const resultado = await simplificarTexto(
    page,
    'El estudiante debe comprender los conceptos.'
  );

  await page.getByRole('button', { name: 'Copiar texto', exact: true }).click();

  await expect(page.getByText('Texto copiado correctamente.')).toBeVisible({
    timeout: 10000,
  });

  const textoCopiado = await page.evaluate(() => {
    return (window as any).__clipboardText;
  });

  expect(textoCopiado).toBe(resultado);
});

// CP-011 — Exportar como .txt
test('CP-011 Exportar resultado descarga archivo .txt', async ({ page }) => {
  await simplificarTexto(
    page,
    'El estudiante debe comprender los conceptos.'
  );

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar texto' }).click(),
  ]);

  expect(download.suggestedFilename()).toBe('texto-simplificado.txt');
});

// CP-012 — Nueva simplificación limpia formulario
test('CP-012 Nueva simplificación vacía las áreas de texto', async ({ page }) => {
  const entrada = page.getByPlaceholder('Ingrese el texto original');
  const salida = page.getByPlaceholder('Texto simplificado');

  await simplificarTexto(
    page,
    'Texto de prueba para limpiar.'
  );

  await page.getByRole('button', { name: 'Nueva simplificación' }).click();

  await expect(entrada).toHaveValue('');
  await expect(salida).toHaveValue('');
});

// CP-013 — Reportar resultado
test('CP-013 Reporte se envía y modal se cierra', async ({ page }) => {
  await simplificarTexto(
    page,
    'El estudiante debe comprender los conceptos.'
  );

  await page.getByRole('button', { name: 'Reportar resultado' }).click();

  await expect(
    page.getByText('Ingrese el motivo del reporte')
  ).toBeVisible();

  await page
    .getByPlaceholder('Escriba su descripción aquí...')
    .fill('El resultado no es correcto');

  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(
    page.getByText('Ingrese el motivo del reporte')
  ).toBeHidden();

  await expect(page.getByText('Reporte enviado correctamente.')).toBeVisible();
});