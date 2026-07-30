import { describe, expect, it } from 'vitest'
import { arbitraryRadius, offScaleRadius } from './radius-scale.js'

describe('offScaleRadius', () => {
  it('catches off-scale tiers', () => {
    expect(offScaleRadius.test('rounded-2xl border')).toBe(true)
    expect(offScaleRadius.test('rounded-3xl')).toBe(true)
    expect(offScaleRadius.test('overflow-hidden rounded-4xl bg-card')).toBe(true)
  })

  it('allows the single-radius tiers and shape classes', () => {
    expect(offScaleRadius.test('rounded-lg border')).toBe(false)
    expect(offScaleRadius.test('rounded-sm')).toBe(false)
    expect(offScaleRadius.test('rounded-full')).toBe(false)
    expect(offScaleRadius.test('rounded-none')).toBe(false)
    expect(offScaleRadius.test('rounded-t-xl rounded-b-xl')).toBe(false)
  })
})

describe('arbitraryRadius', () => {
  it('catches bare arbitrary values not derived from a radius token', () => {
    expect(arbitraryRadius.test('rounded-[2px]')).toBe(true)
    expect(arbitraryRadius.test('rounded-[10px]')).toBe(true)
    expect(arbitraryRadius.test('rounded-t-[6px]')).toBe(true)
  })

  it('allows values derived from var(--radius) and rounded-[inherit]', () => {
    expect(arbitraryRadius.test('rounded-[var(--radius-chrome)]')).toBe(false)
    expect(arbitraryRadius.test('rounded-[calc(var(--radius)-5px)]')).toBe(false)
    expect(arbitraryRadius.test('rounded-[min(var(--radius-md),10px)]')).toBe(false)
    expect(arbitraryRadius.test('rounded-[inherit]')).toBe(false)
  })
})
