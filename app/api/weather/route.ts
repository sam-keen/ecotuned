import { NextRequest, NextResponse } from 'next/server'
import { fetchPostcodeData, fetchTodayAndTomorrowWeather } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postcode = searchParams.get('postcode')

    if (!postcode) {
      return NextResponse.json({ error: 'Postcode is required' }, { status: 400 })
    }

    // Fetch postcode data
    const postcodeData = await fetchPostcodeData(postcode)

    // Fetch weather for both days
    const weather = await fetchTodayAndTomorrowWeather(
      postcodeData.latitude,
      postcodeData.longitude
    )

    return NextResponse.json(
      {
        postcodeData,
        weather,
      },
      {
        // Cache for 5 minutes - balances freshness with API usage
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Weather API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
