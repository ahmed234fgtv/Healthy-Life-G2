import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const endpoint = 'http://localhost:3001/api/activities'
const successMessage = 'Actividad registrada correctamente.'

async function completeForm(page: Page) {
  await page.getByLabel('Tipo de actividad').selectOption('walking')
  await page.getByLabel('Fecha de la actividad').fill('2026-10-09')
}

async function assertNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
}

async function assertAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
}

test('presentación, teclado, foco, hover y accesibilidad inicial', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Registrar actividad física' }),
  ).toBeVisible()
  const entrance = await page
    .getByRole('region', { name: 'Nuevo registro' })
    .evaluate((element) => ({
      name: getComputedStyle(element).animationName,
      duration: parseFloat(getComputedStyle(element).animationDuration),
    }))
  expect(entrance.name).not.toBe('none')
  expect(entrance.duration).toBeGreaterThan(0)
  expect(entrance.duration).toBeLessThanOrEqual(0.3)
  await assertNoOverflow(page)
  await assertAccessible(page)
  await page.screenshot({
    path: testInfo.outputPath('initial.png'),
    fullPage: true,
  })

  const type = page.getByLabel('Tipo de actividad')
  for (let tab = 0; tab < 12; tab += 1) {
    await page.keyboard.press('Tab')
    if (await type.evaluate((element) => element === document.activeElement))
      break
  }
  await expect(type).toBeFocused()
  await expect(type).toHaveCSS('outline-style', 'solid')
  await page.screenshot({
    path: testInfo.outputPath('keyboard-focus.png'),
    fullPage: true,
  })

  const save = page.getByRole('button', { name: 'Guardar actividad' })
  const normalBackground = await save.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  )
  await save.hover()
  await expect
    .poll(() =>
      save.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .not.toBe(normalBackground)
  await expect(save).toBeEnabled()
  await page.screenshot({
    path: testInfo.outputPath('save-hover.png'),
    fullPage: true,
  })
  await page.mouse.down()
  await expect(save).not.toHaveCSS('transform', 'none')
  await page.screenshot({
    path: testInfo.outputPath('save-pressed.png'),
    fullPage: true,
  })
  await page.mouse.up()
})

test('valida, enfoca el primer error y permite corregirlo', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByLabel('Fecha de la actividad').fill('')
  await page.getByRole('button', { name: 'Guardar actividad' }).click()
  await expect(page.getByLabel('Tipo de actividad')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(page.getByLabel('Tipo de actividad')).toBeFocused()
  await expect(page.getByLabel('Fecha de la actividad')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await assertNoOverflow(page)
  await assertAccessible(page)
  await page.screenshot({
    path: testInfo.outputPath('validation-errors.png'),
    fullPage: true,
  })

  await completeForm(page)
  await page.getByLabel('Observaciones', { exact: false }).fill('a'.repeat(501))
  await page.getByRole('button', { name: 'Guardar actividad' }).click()
  await expect(
    page.getByLabel('Observaciones', { exact: false }),
  ).toHaveAttribute('aria-invalid', 'true')
  await assertNoOverflow(page)
})

test('espera al 201, evita duplicados y anuncia la confirmación', async ({
  page,
}, testInfo) => {
  let releaseResponse!: () => void
  const responseReady = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })
  let requestCount = 0
  let requestBody: unknown
  await page.route(endpoint, async (route) => {
    requestCount += 1
    requestBody = route.request().postDataJSON()
    await responseReady
    await route.fulfill({
      status: 201,
      json: {
        id: 3,
        activityType: 'walking',
        activityDate: '2026-10-09',
        notes: 'Vuelta al parque',
        createdAt: '2026-10-09T10:30:00.000Z',
      },
    })
  })
  await page.goto('/')
  await completeForm(page)
  await page
    .getByLabel('Observaciones', { exact: false })
    .fill('Vuelta al parque')
  await page.getByRole('button', { name: 'Guardar actividad' }).click()

  const pending = page.getByRole('button', { name: 'Guardando actividad…' })
  await expect(pending).toBeDisabled()
  await expect(page.getByLabel('Tipo de actividad')).toBeDisabled()
  await expect(page.getByText(successMessage)).toHaveCount(0)
  await expect.poll(() => requestCount).toBe(1)
  await page.screenshot({
    path: testInfo.outputPath('saving.png'),
    fullPage: true,
  })
  expect(requestBody).toEqual({
    activityType: 'walking',
    activityDate: '2026-10-09',
    notes: 'Vuelta al parque',
  })

  releaseResponse()
  await expect(page.getByText(successMessage)).toBeVisible()
  await expect(page.getByLabel('Tipo de actividad')).toHaveValue('')
  await expect(page.getByLabel('Observaciones', { exact: false })).toHaveValue(
    '',
  )
  await assertNoOverflow(page)
  await assertAccessible(page)
  await page.screenshot({
    path: testInfo.outputPath('success.png'),
    fullPage: true,
  })
})

test('muestra el error real del servidor sin perder el formulario', async ({
  page,
}, testInfo) => {
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 400,
      json: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'La fecha de la actividad no es válida.',
        },
      },
    }),
  )
  await page.goto('/')
  await completeForm(page)
  await page
    .getByLabel('Observaciones', { exact: false })
    .fill('Paseo por la tarde')
  await page.getByRole('button', { name: 'Guardar actividad' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'La fecha de la actividad no es válida.',
  )
  await expect(page.getByText(successMessage)).toHaveCount(0)
  await expect(page.getByLabel('Tipo de actividad')).toHaveValue('walking')
  await expect(page.getByLabel('Observaciones', { exact: false })).toHaveValue(
    'Paseo por la tarde',
  )
  await assertNoOverflow(page)
  await assertAccessible(page)
  await page.screenshot({
    path: testInfo.outputPath('server-error.png'),
    fullPage: true,
  })
})

test('una desconexión no produce una confirmación falsa', async ({
  page,
}, testInfo) => {
  await page.route(endpoint, (route) => route.abort('connectionrefused'))
  await page.goto('/')
  await completeForm(page)
  await page.getByRole('button', { name: 'Guardar actividad' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText(successMessage)).toHaveCount(0)
  await expect(page.getByLabel('Tipo de actividad')).toHaveValue('walking')
  await expect(
    page.getByRole('button', { name: 'Guardar actividad' }),
  ).toBeEnabled()
  await page.screenshot({
    path: testInfo.outputPath('network-error.png'),
    fullPage: true,
  })
})

test('respeta movimiento reducido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const movingElements = await page
    .locator('main, form, button, input, select, textarea')
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const style = getComputedStyle(element)
          return [style.animationDuration, style.transitionDuration].some(
            (durations) =>
              durations
                .split(',')
                .some((duration) => parseFloat(duration) > 0.01),
          )
        })
        .map((element) => element.tagName),
    )
  expect(movingElements).toEqual([])
})

test('se adapta a móvil estrecho, tablet y portátil sin desbordar', async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await assertNoOverflow(page)
    const submit = page.getByRole('button', { name: 'Guardar actividad' })
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toBeInViewport()
    const box = await submit.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  }
})
