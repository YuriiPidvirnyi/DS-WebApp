import { describe, it, expect } from 'vitest'
import { computeTotalCost, isItemInput } from './treatment-cost'

describe('computeTotalCost', () => {
  it('sums qty*price for valid lines (qty defaults to 1)', () => {
    expect(
      computeTotalCost([{ serviceId: 's', priceAtTime: 100, quantity: 2 }])
    ).toBe(200)
    expect(
      computeTotalCost([
        { serviceId: 's', priceAtTime: 100, quantity: 2 },
        { serviceId: 's2', priceAtTime: 50 },
      ])
    ).toBe(250)
  })

  it('drops negative prices and non-positive / non-finite qty', () => {
    expect(
      computeTotalCost([{ serviceId: 's', priceAtTime: -5, quantity: 1 }])
    ).toBe(0)
    expect(
      computeTotalCost([{ serviceId: 's', priceAtTime: 100, quantity: 0 }])
    ).toBe(0)
    expect(
      computeTotalCost([{ serviceId: 's', priceAtTime: 'abc', quantity: 1 }])
    ).toBe(0)
  })

  it('coerces string prices', () => {
    expect(
      computeTotalCost([{ serviceId: 's', priceAtTime: '150', quantity: 2 }])
    ).toBe(300)
  })
})

describe('isItemInput', () => {
  it('accepts valid items', () => {
    expect(isItemInput({ serviceId: 's', priceAtTime: 100 })).toBe(true)
    expect(isItemInput({ serviceId: 's', priceAtTime: '100' })).toBe(true)
  })

  it('rejects invalid items', () => {
    expect(isItemInput(null)).toBe(false)
    expect(isItemInput({ serviceId: '', priceAtTime: 100 })).toBe(false)
    expect(isItemInput({ serviceId: 's' })).toBe(false)
    expect(isItemInput({ priceAtTime: 100 })).toBe(false)
  })
})
