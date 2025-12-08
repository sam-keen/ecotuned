import { NextResponse } from 'next/server'
import { fetchGridIntensity } from '@/lib/api'

export async function GET() {
  try {
    const gridData = await fetchGridIntensity()

    return NextResponse.json(gridData, {
      // Cache for 30 minutes - matches Carbon Intensity API update frequency
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Grid API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch grid data' },
      { status: 500 }
    )
  }
}
