import { render, screen } from '@testing-library/react'
import GridMix from './GridMix'
import type { GridData } from '@/lib/schemas'

describe('GridMix', () => {
  const mockGridData: GridData = {
    carbonIntensity: 150,
    carbonIndex: 'moderate' as const,
    renewablePercent: 45.5,
    fossilPercent: 30.2,
    nuclearPercent: 15.3,
    otherPercent: 9.0,
    fuelBreakdown: [
      { fuel: 'wind', perc: 35.5, category: 'renewable' as const },
      { fuel: 'solar', perc: 10.0, category: 'renewable' as const },
      { fuel: 'gas', perc: 25.2, category: 'fossil' as const },
      { fuel: 'coal', perc: 5.0, category: 'fossil' as const },
      { fuel: 'nuclear', perc: 15.3, category: 'nuclear' as const },
      { fuel: 'biomass', perc: 9.0, category: 'other' as const },
    ],
    timestamp: '2025-01-08T12:00:00Z',
  }

  test('should render all category percentages in bars', () => {
    render(<GridMix gridData={mockGridData} />)

    // Check that percentages are displayed (rounded to nearest integer)
    expect(screen.getAllByText('46%')).toBeTruthy() // Renewables
    expect(screen.getAllByText('30%')).toBeTruthy() // Fossil
    expect(screen.getAllByText('15%')).toBeTruthy() // Nuclear
    // 9% for Other is below 6% desktop threshold and 8% mobile threshold, so might not show
  })

  test('should filter out categories with 0%', () => {
    const dataWithZeros: GridData = {
      ...mockGridData,
      nuclearPercent: 0,
      otherPercent: 0,
      renewablePercent: 50,
      fossilPercent: 50,
      fuelBreakdown: [
        { fuel: 'wind', perc: 50, category: 'renewable' as const },
        { fuel: 'gas', perc: 50, category: 'fossil' as const },
      ],
    }

    const { container } = render(<GridMix gridData={dataWithZeros} />)

    // Should only show renewables and fossil (check for bars with these percentages)
    const bars = container.querySelectorAll('[style*="width: 50%"]')
    expect(bars.length).toBeGreaterThan(0)

    // Check that categories appear in legend
    expect(screen.getAllByText(/Wind/)).toBeTruthy()
    expect(screen.getAllByText(/Gas/)).toBeTruthy()
  })

  test('should render fuel breakdown legend', () => {
    render(<GridMix gridData={mockGridData} />)

    // Check individual fuel types appear in legend (capitalized)
    expect(screen.getAllByText(/Wind 35.5%/)).toBeTruthy()
    expect(screen.getAllByText(/Solar 10.0%/)).toBeTruthy()
    expect(screen.getAllByText(/Gas 25.2%/)).toBeTruthy()
    expect(screen.getAllByText(/Coal 5.0%/)).toBeTruthy()
    expect(screen.getAllByText(/Nuclear 15.3%/)).toBeTruthy()
    expect(screen.getAllByText(/Biomass 9.0%/)).toBeTruthy()
  })

  test('should sort fuel breakdown by category then percentage', () => {
    const { container } = render(<GridMix gridData={mockGridData} />)

    // Find all fuel items in the legend
    const fuelItems = container.querySelectorAll('.text-\\[10px\\] > div')

    // Extract text content to verify order
    const fuelTexts = Array.from(fuelItems)
      .slice(0, 6) // First 6 items (desktop view)
      .map((item) => item.textContent)

    // Should be: renewables (wind 35.5, solar 10), fossil (gas 25.2, coal 5), nuclear (15.3), other (biomass 9)
    expect(fuelTexts[0]).toContain('Wind') // Renewable category, highest %
    expect(fuelTexts[1]).toContain('Solar') // Renewable category, lower %
    expect(fuelTexts[2]).toContain('Gas') // Fossil category, highest %
    expect(fuelTexts[3]).toContain('Coal') // Fossil category, lower %
    expect(fuelTexts[4]).toContain('Nuclear') // Nuclear category
    expect(fuelTexts[5]).toContain('Biomass') // Other category
  })

  test('should display live indicator and update info', () => {
    render(<GridMix gridData={mockGridData} />)

    expect(screen.getByText('Live Energy Grid')).toBeInTheDocument()
    expect(screen.getByText('GB')).toBeInTheDocument()
    expect(screen.getByText('Updates every 30min')).toBeInTheDocument()
  })

  test('should filter out fuels with 0%', () => {
    const dataWithZeroFuels: GridData = {
      ...mockGridData,
      fuelBreakdown: [
        { fuel: 'wind', perc: 50, category: 'renewable' as const },
        { fuel: 'solar', perc: 0, category: 'renewable' as const },
        { fuel: 'gas', perc: 50, category: 'fossil' as const },
      ],
    }

    render(<GridMix gridData={dataWithZeroFuels} />)

    // Solar should not appear
    expect(screen.queryByText(/Solar/)).not.toBeInTheDocument()
    // Wind and Gas should appear
    expect(screen.getAllByText(/Wind/)).toBeTruthy()
    expect(screen.getAllByText(/Gas/)).toBeTruthy()
  })

  test('should capitalize fuel names', () => {
    render(<GridMix gridData={mockGridData} />)

    // All fuel names should be capitalized
    expect(screen.getAllByText(/Wind/)).toBeTruthy() // not 'wind'
    expect(screen.getAllByText(/Solar/)).toBeTruthy() // not 'solar'
    expect(screen.getAllByText(/Gas/)).toBeTruthy() // not 'gas'
  })
})
