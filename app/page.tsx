import { getPreferences } from './actions'
import { fetchPostcodeData, fetchTodayAndTomorrowWeather } from '@/lib/api'
import SetupForm from '@/components/SetupForm'
import Dashboard from '@/components/Dashboard'
import Badge from '@/components/Badge'

export default async function Home() {
  // Read preferences from cookie
  const preferences = await getPreferences()

  // If no preferences, show setup form
  if (!preferences) {
    return (
      <div className="max-w-2xl lg:max-w-5xl mx-auto">
        <div className="eco-card p-10">
          <Badge>Welcome</Badge>
          <h2 className="text-4xl font-display font-black text-eco-black mb-4 mt-4 uppercase tracking-tight">
            Welcome to EcoTuned
          </h2>
          <p className="text-eco-black mb-8 font-medium leading-relaxed">
            Answer a few questions to get personalised energy-saving tips based on today and tomorrow's weather.
          </p>
          <SetupForm />
        </div>
      </div>
    )
  }

  // Fetch initial data server-side for fast first load
  let initialData
  try {
    const postcodeData = await fetchPostcodeData(preferences.postcode)
    const weather = await fetchTodayAndTomorrowWeather(
      postcodeData.latitude,
      postcodeData.longitude
    )

    initialData = {
      postcodeData,
      weather,
    }
  } catch (error) {
    // If server-side fetch fails, pass no initial data
    // Client will show loading state and retry
    console.error('Failed to fetch initial data:', error)
  }

  // Render Dashboard client component with initial data
  // React Query will manage subsequent fetches and caching
  return <Dashboard preferences={preferences} initialData={initialData} />
}
