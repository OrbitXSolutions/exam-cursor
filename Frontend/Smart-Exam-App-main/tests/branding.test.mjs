import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../lib/branding.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
const { DEFAULT_BRANDING, BRAND_ASSETS, brandingAssetUrl, normalizeBranding, hexToHsl, contrastForeground } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('missing/empty branding and invalid colors retain complete Digital Dubai defaults', () => {
  assert.deepEqual(normalizeBranding(null), DEFAULT_BRANDING)
  const result = normalizeBranding({ name: ' ', logoUrl: '', faviconUrl: '', footerText: ' ', primaryColor: 'url(https://invalid)' })
  assert.deepEqual(result, DEFAULT_BRANDING)
  assert.equal(normalizeBranding({ primaryColor: '#AABBCC', name: 'Configured portal' }).primaryColor, '#AABBCC')
})

test('bundled assets stay local while backend uploads use the existing proxy', () => {
  assert.equal(brandingAssetUrl(BRAND_ASSETS.digitalDubai), '/branding/digital-dubai.png')
  assert.equal(brandingAssetUrl('/organization/logo.png'), '/api/backend-files/organization/logo.png')
  assert.equal(brandingAssetUrl('https://example.invalid/logo.png'), 'https://example.invalid/logo.png')
  for (const unsafe of ['javascript:alert(1)', '//example.invalid/logo.png', 'data:text/html,evil', '/\\example.invalid/image', 'https://user:password@example.invalid/image'])
    assert.equal(brandingAssetUrl(unsafe, BRAND_ASSETS.favicon), BRAND_ASSETS.favicon)
})

test('HSL conversion covers the primary palette and achromatic colors', () => {
  assert.equal(hexToHsl('#0076a8'), '198 100% 33%')
  assert.equal(hexToHsl('#000000'), '0 0% 0%')
  assert.equal(hexToHsl('#ffffff'), '0 0% 100%')
  assert.equal(hexToHsl('#ff0000'), '0 100% 50%')
  assert.equal(hexToHsl('invalid'), hexToHsl(DEFAULT_BRANDING.primaryColor))
})

test('configurable primary button labels maintain WCAG AA contrast across the color cube', () => {
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
    const hex = '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')
    const [red, green, blue] = [r, g, b].map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
    const luminance = .2126 * red + .7152 * green + .0722 * blue
    const contrast = contrastForeground(hex) === '0 0% 100%' ? 1.05 / (luminance + .05) : (luminance + .05) / .05
    assert.ok(contrast >= 4.5, `${hex} label contrast ${contrast}`)
  }
})
