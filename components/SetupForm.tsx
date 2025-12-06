'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userPreferencesSchema, type UserPreferences } from '@/lib/schemas'
import { savePreferences } from '@/app/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserPreferences>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      hasGarden: false,
      hasEV: false,
      cycleToWork: false,
      hasSolar: false,
      homeWeekdayMorning: false,
      homeWeekdayAfternoon: false,
      homeWeekdayEvening: true,
    },
  })

  const onSubmit = async (data: UserPreferences) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('postcode', data.postcode)
      formData.append('hasGarden', String(data.hasGarden))
      formData.append('hasEV', String(data.hasEV))
      formData.append('cycleToWork', String(data.cycleToWork))
      formData.append('hasSolar', String(data.hasSolar))
      formData.append('homeWeekdayMorning', String(data.homeWeekdayMorning))
      formData.append('homeWeekdayAfternoon', String(data.homeWeekdayAfternoon))
      formData.append('homeWeekdayEvening', String(data.homeWeekdayEvening))

      await savePreferences(formData)

      // Refresh to show dashboard with new preferences
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Postcode input */}
      <div>
        <label htmlFor="postcode" className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
          Postcode
        </label>
        <input
          {...register('postcode')}
          id="postcode"
          type="text"
          placeholder="e.g. SW1A 2AA"
          className="w-full px-4 py-3 border-3 border-eco-border rounded-lg font-medium focus:outline-none focus:ring-4 focus:ring-eco-mint"
        />
        {errors.postcode && (
          <p className="text-eco-black font-bold text-sm mt-2 bg-eco-lemon border-2 border-eco-lemon rounded-lg px-3 py-2">
            {errors.postcode.message}
          </p>
        )}
      </div>

      {/* Your Setup - 2 column grid */}
      <div className="space-y-4">
        <p className="text-sm font-black text-black uppercase tracking-wide">
          Your Setup:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label className="flex items-start border-2 border-eco-border rounded-lg p-4 cursor-pointer hover:bg-eco-mint/20 transition">
            <input
              {...register('hasGarden')}
              id="hasGarden"
              type="checkbox"
              className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
            />
            <span className="ml-4">
              <span className="font-bold text-eco-black block">Garden / Balcony</span>
              <span className="text-sm text-eco-black/70">For line-drying recommendations</span>
            </span>
          </label>

          <label className="flex items-start border-2 border-eco-border rounded-lg p-4 cursor-pointer hover:bg-eco-mint/20 transition">
            <input
              {...register('hasEV')}
              id="hasEV"
              type="checkbox"
              className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
            />
            <span className="ml-4">
              <span className="font-bold text-eco-black block">Electric Vehicle</span>
              <span className="text-sm text-eco-black/70">For smart charging tips</span>
            </span>
          </label>

          <label className="flex items-start border-2 border-eco-border rounded-lg p-4 cursor-pointer hover:bg-eco-mint/20 transition">
            <input
              {...register('cycleToWork')}
              id="cycleToWork"
              type="checkbox"
              className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
            />
            <span className="ml-4">
              <span className="font-bold text-eco-black block">Cycle to Work</span>
              <span className="text-sm text-eco-black/70">For weather alerts</span>
            </span>
          </label>

          <label className="flex items-start border-2 border-eco-border rounded-lg p-4 cursor-pointer hover:bg-eco-mint/20 transition">
            <input
              {...register('hasSolar')}
              id="hasSolar"
              type="checkbox"
              className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
            />
            <span className="ml-4">
              <span className="font-bold text-eco-black block">Solar Panels</span>
              <span className="text-sm text-eco-black/70">For generation forecasts</span>
            </span>
          </label>
        </div>
      </div>

      {/* Availability - 2 column grid */}
      <div className="space-y-4">
        <p className="text-sm font-black text-black uppercase tracking-wide">
          When are you home on weekdays?
        </p>
        <p className="text-xs text-eco-black/70 -mt-2">
          This helps us show relevant recommendations during the work week
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label className="flex items-start border-2 border-eco-border rounded-lg p-4 cursor-pointer hover:bg-eco-sky/20 transition">
            <input
              {...register('homeWeekdayMorning')}
              id="homeWeekdayMorning"
              type="checkbox"
              className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sky"
            />
            <span className="ml-4">
              <span className="font-bold text-eco-black block">Mornings</span>
              <span className="text-sm text-eco-black/70">6am-12pm</span>
            </span>
          </label>

          <label className="flex items-start border-2 border-eco-border rounded-lg p-4 cursor-pointer hover:bg-eco-sky/20 transition">
            <input
              {...register('homeWeekdayAfternoon')}
              id="homeWeekdayAfternoon"
              type="checkbox"
              className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sky"
            />
            <span className="ml-4">
              <span className="font-bold text-eco-black block">Afternoons</span>
              <span className="text-sm text-eco-black/70">12pm-6pm</span>
            </span>
          </label>

          <label className="flex items-start border-2 border-eco-border rounded-lg p-4 cursor-pointer hover:bg-eco-sky/20 transition">
            <input
              {...register('homeWeekdayEvening')}
              id="homeWeekdayEvening"
              type="checkbox"
              className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sky"
            />
            <span className="ml-4">
              <span className="font-bold text-eco-black block">Evenings</span>
              <span className="text-sm text-eco-black/70">6pm-12am</span>
            </span>
          </label>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="eco-card-gold p-4">
          <p className="text-eco-black font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full eco-btn py-4 px-6 disabled:opacity-50"
      >
        {isSubmitting ? 'Loading...' : 'Get My Tips'}
      </button>
    </form>
  )
}
