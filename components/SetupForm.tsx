'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userPreferencesSchema, type UserPreferences } from '@/lib/schemas'
import { savePreferences } from '@/app/actions'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getValidHotWaterOptions } from '@/lib/heatingUtils'

export default function SetupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserPreferences>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      hasGarden: false,
      hasEV: false,
      hasSolar: false,
      hasTimeOfUseTariff: false,
      preferredTemperature: 19,
      heatingType: 'gas' as const,
      hotWaterSystem: 'combi' as const,
    },
  })

  const preferredTemp = watch('preferredTemperature', 19)
  const heatingType = watch('heatingType', 'gas')

  // Compute valid hot water options based on heating type
  const validHotWaterOptions = useMemo(() => getValidHotWaterOptions(heatingType), [heatingType])

  // Auto-reset hot water system if current selection becomes invalid
  useEffect(() => {
    const currentHotWater = watch('hotWaterSystem')
    if (!validHotWaterOptions.includes(currentHotWater)) {
      setValue('hotWaterSystem', validHotWaterOptions[0] as any)
    }
  }, [heatingType, validHotWaterOptions, watch, setValue])

  const onSubmit = async (data: UserPreferences) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('postcode', data.postcode)
      formData.append('hasGarden', String(data.hasGarden))
      formData.append('hasEV', String(data.hasEV))
      formData.append('hasSolar', String(data.hasSolar))
      formData.append('hasTimeOfUseTariff', String(data.hasTimeOfUseTariff))
      formData.append('preferredTemperature', String(data.preferredTemperature))
      formData.append('heatingType', data.heatingType)
      formData.append('hotWaterSystem', data.hotWaterSystem)

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
        <label
          htmlFor="postcode"
          className="block text-sm font-black text-black mb-2 uppercase tracking-wide"
        >
          UK postcode
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

      {/* Your Home Setup */}
      <div className="space-y-4">
        <p className="text-sm font-black text-black uppercase tracking-wide">Your Home Setup:</p>

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
              <span className="text-sm text-eco-black/70">For smart EV charging tips</span>
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
              <span className="text-sm text-eco-black/70">For solar generation forecasts</span>
            </span>
          </label>

          <label className="flex items-start border-2 border-eco-border rounded-lg p-4 cursor-pointer hover:bg-eco-mint/20 transition">
            <input
              {...register('hasTimeOfUseTariff')}
              id="hasTimeOfUseTariff"
              type="checkbox"
              className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
            />
            <span className="ml-4">
              <span className="font-bold text-eco-black block">Cheaper Night-Time Electricity</span>
              <span className="text-sm text-eco-black/70">Economy 7, Octopus Agile, etc.</span>
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Heating Type */}
          <div className="border-2 border-eco-border rounded-lg p-4">
            <label
              htmlFor="heatingType"
              className="block text-xs font-black text-black mb-2 uppercase"
            >
              Heating Type
            </label>
            <select
              {...register('heatingType')}
              id="heatingType"
              className="w-full pl-4 pr-10 py-3 border-2 border-eco-border rounded-lg font-medium focus:outline-none focus:ring-4 focus:ring-eco-mint bg-white"
            >
              <option value="gas">Gas Boiler</option>
              <option value="electric">Electric Heating</option>
              <option value="heat-pump">Heat Pump</option>
              <option value="oil">Oil Boiler</option>
              <option value="other">Other</option>
            </select>
            <p className="text-xs text-eco-black/70 mt-2">For heating-specific recommendations</p>
          </div>

          {/* Hot Water System */}
          <div className="border-2 border-eco-border rounded-lg p-4">
            <label
              htmlFor="hotWaterSystem"
              className="block text-xs font-black text-black mb-2 uppercase"
            >
              Hot Water System
            </label>
            <select
              {...register('hotWaterSystem')}
              id="hotWaterSystem"
              className="w-full pl-4 pr-10 py-3 border-2 border-eco-border rounded-lg font-medium focus:outline-none focus:ring-4 focus:ring-eco-mint bg-white"
            >
              {validHotWaterOptions.includes('combi') && (
                <option value="combi">Combi Boiler (instant hot water)</option>
              )}
              {validHotWaterOptions.includes('tank') && (
                <option value="tank">Hot Water Tank (stores hot water)</option>
              )}
              {validHotWaterOptions.includes('electric') && (
                <option value="electric">Electric Immersion</option>
              )}
              {validHotWaterOptions.includes('other') && <option value="other">Other</option>}
            </select>
            <p className="text-xs text-eco-black/70 mt-2">For hot water timing recommendations</p>
          </div>
        </div>

        {/* Preferred Temperature */}
        <div className="border-2 border-eco-border rounded-lg p-4">
          <label
            htmlFor="preferredTemperature"
            className="block text-xs font-black text-black mb-2 uppercase"
          >
            Preferred Home Temperature
          </label>
          <div className="flex items-center gap-4">
            <input
              {...register('preferredTemperature', { valueAsNumber: true })}
              id="preferredTemperature"
              type="range"
              min="15"
              max="25"
              step="0.5"
              defaultValue="19"
              className="flex-1 h-2 bg-eco-mint/30 rounded-lg appearance-none cursor-pointer accent-eco-sage"
            />
            <span className="text-2xl font-display font-black text-eco-black min-w-[4rem] text-center">
              {preferredTemp}°C
            </span>
          </div>
          <p className="text-xs text-eco-black/70 mt-2">
            Used to personalise heating recommendations
          </p>
          {errors.preferredTemperature && (
            <p className="text-eco-black font-bold text-sm mt-2 bg-eco-lemon border-2 border-eco-lemon rounded-lg px-3 py-2">
              {errors.preferredTemperature.message}
            </p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="eco-card-gold p-4">
          <p className="text-eco-black font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-4 font-bold uppercase text-sm border-2 border-eco-border rounded-lg hover:bg-eco-lemon hover:text-eco-black transition"
        >
          Start Again
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 eco-btn py-4 px-6 disabled:opacity-50"
        >
          {isSubmitting ? 'Loading...' : 'Get My Tips'}
        </button>
      </div>
    </form>
  )
}
