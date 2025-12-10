import { getValidHotWaterOptions, isValidHeatingCombination } from '@/lib/heatingUtils'

describe('getValidHotWaterOptions', () => {
  test('gas heating allows combi, tank, other', () => {
    const options = getValidHotWaterOptions('gas')
    expect(options).toEqual(['combi', 'tank', 'other'])
  })

  test('electric heating allows tank, electric, other (not combi)', () => {
    const options = getValidHotWaterOptions('electric')
    expect(options).toEqual(['tank', 'electric', 'other'])
  })

  test('heat pump allows tank, other (not combi)', () => {
    const options = getValidHotWaterOptions('heat-pump')
    expect(options).toEqual(['tank', 'other'])
  })

  test('oil allows tank, other (not combi)', () => {
    const options = getValidHotWaterOptions('oil')
    expect(options).toEqual(['tank', 'other'])
  })

  test('other allows all options', () => {
    const options = getValidHotWaterOptions('other')
    expect(options).toHaveLength(4)
    expect(options).toContain('combi')
    expect(options).toContain('tank')
    expect(options).toContain('electric')
    expect(options).toContain('other')
  })

  test('unknown heating type defaults to all options', () => {
    const options = getValidHotWaterOptions('unknown')
    expect(options).toHaveLength(4)
  })
})

describe('isValidHeatingCombination', () => {
  // Gas combinations
  test('gas + combi is valid', () => {
    expect(isValidHeatingCombination('gas', 'combi')).toBe(true)
  })

  test('gas + tank is valid', () => {
    expect(isValidHeatingCombination('gas', 'tank')).toBe(true)
  })

  test('gas + electric is invalid', () => {
    expect(isValidHeatingCombination('gas', 'electric')).toBe(false)
  })

  // Electric combinations
  test('electric + combi is invalid', () => {
    expect(isValidHeatingCombination('electric', 'combi')).toBe(false)
  })

  test('electric + tank is valid', () => {
    expect(isValidHeatingCombination('electric', 'tank')).toBe(true)
  })

  test('electric + electric is valid', () => {
    expect(isValidHeatingCombination('electric', 'electric')).toBe(true)
  })

  // Heat pump combinations
  test('heat-pump + combi is invalid', () => {
    expect(isValidHeatingCombination('heat-pump', 'combi')).toBe(false)
  })

  test('heat-pump + tank is valid', () => {
    expect(isValidHeatingCombination('heat-pump', 'tank')).toBe(true)
  })

  // Oil combinations
  test('oil + tank is valid', () => {
    expect(isValidHeatingCombination('oil', 'tank')).toBe(true)
  })

  test('oil + combi is invalid', () => {
    expect(isValidHeatingCombination('oil', 'combi')).toBe(false)
  })

  test('oil + electric is invalid', () => {
    expect(isValidHeatingCombination('oil', 'electric')).toBe(false)
  })

  // Other combinations
  test('other + combi is valid', () => {
    expect(isValidHeatingCombination('other', 'combi')).toBe(true)
  })

  test('other + tank is valid', () => {
    expect(isValidHeatingCombination('other', 'tank')).toBe(true)
  })
})
