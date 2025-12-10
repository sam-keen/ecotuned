'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userPreferencesSchema, type UserPreferences } from '@/lib/schemas'
import { savePreferences, clearPreferences } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import Badge from './Badge'
import { getValidHotWaterOptions } from '@/lib/heatingUtils'

interface EditPreferencesProps {
  currentPreferences: UserPreferences
}

export default function EditPreferences({ currentPreferences }: EditPreferencesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserPreferences>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: currentPreferences,
  })

  const heatingType = watch('heatingType', currentPreferences.heatingType)

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

      // Invalidate weather query to refetch with new postcode if changed
      queryClient.invalidateQueries({ queryKey: ['weather'] })

      // Close modal and reset state
      setIsOpen(false)
      setIsSubmitting(false)

      // Refresh the page to get new server data
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
      setIsSubmitting(false)
    }
  }

  const handleClear = async () => {
    try {
      await clearPreferences()
      // Refresh will redirect to setup form since preferences are cleared
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear preferences')
      setShowClearConfirmation(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset state when closing
      setIsSubmitting(false)
      setShowClearConfirmation(false)
      setError(null)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button className="eco-btn px-4 py-2 text-sm">Edit</button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-eco-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] eco-card !shadow-none max-w-md w-full p-8 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="mb-3">
                <Badge color={showClearConfirmation ? 'coral' : 'sage'}>
                  {showClearConfirmation ? 'Warning' : 'Settings'}
                </Badge>
              </div>
              <Dialog.Title className="text-2xl font-display font-black text-eco-black uppercase">
                {showClearConfirmation ? 'Clear All Data?' : 'Edit Preferences'}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="text-2xl font-black hover:bg-eco-lemon hover:text-eco-black px-3 py-1 rounded-lg transition"
                aria-label="Close"
              >
                ×
              </button>
            </Dialog.Close>
          </div>

          {showClearConfirmation ? (
            <div className="space-y-6">
              <Dialog.Description className="text-eco-black font-medium leading-relaxed">
                This will delete all your preferences and return you to the setup screen. You'll
                need to enter your postcode and preferences again.
              </Dialog.Description>
              <p className="text-eco-black/80 font-medium text-sm">This action cannot be undone.</p>
              {error && (
                <div className="eco-card-gold p-3">
                  <p className="text-eco-black font-bold text-sm">{error}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowClearConfirmation(false)}
                  className="flex-1 px-5 py-3 font-bold uppercase text-sm border-2 border-eco-border rounded-lg hover:bg-eco-mint hover:text-eco-black transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 px-5 py-3 font-bold uppercase text-sm bg-eco-coral/80 border-2 border-eco-coral text-eco-black rounded-lg hover:bg-eco-sunset/80 hover:border-eco-sunset transition shadow-[4px_4px_0px_#FF9B7A]"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Postcode */}
              <div>
                <label
                  htmlFor="edit-postcode"
                  className="block text-xs font-black text-black mb-2 uppercase"
                >
                  UK postcode
                </label>
                <input
                  {...register('postcode')}
                  id="edit-postcode"
                  type="text"
                  className="w-full px-4 py-3 border-2 border-eco-border rounded-lg font-medium focus:ring-4 focus:ring-eco-mint"
                />
                {errors.postcode && (
                  <p className="text-eco-black bg-eco-lemon font-bold text-sm mt-2 px-3 py-2 rounded-lg">
                    {errors.postcode.message}
                  </p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <p className="text-xs font-black text-black uppercase tracking-wide mb-2">
                  Your Setup:
                </p>

                <label className="flex items-start border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-mint/20 transition">
                  <input
                    {...register('hasGarden')}
                    id="edit-hasGarden"
                    type="checkbox"
                    className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
                  />
                  <span className="ml-3">
                    <span className="text-sm font-bold text-eco-black block">Garden / Balcony</span>
                    <span className="text-xs text-eco-black/70">
                      For line-drying recommendations
                    </span>
                  </span>
                </label>

                <label className="flex items-start border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-mint/20 transition">
                  <input
                    {...register('hasEV')}
                    id="edit-hasEV"
                    type="checkbox"
                    className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
                  />
                  <span className="ml-3">
                    <span className="text-sm font-bold text-eco-black block">Electric Vehicle</span>
                    <span className="text-xs text-eco-black/70">For smart EV charging tips</span>
                  </span>
                </label>

                <label className="flex items-start border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-mint/20 transition">
                  <input
                    {...register('hasSolar')}
                    id="edit-hasSolar"
                    type="checkbox"
                    className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
                  />
                  <span className="ml-3">
                    <span className="text-sm font-bold text-eco-black block">Solar Panels</span>
                    <span className="text-xs text-eco-black/70">
                      For solar generation forecasts
                    </span>
                  </span>
                </label>

                <label className="flex items-start border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-mint/20 transition">
                  <input
                    {...register('hasTimeOfUseTariff')}
                    id="edit-hasTimeOfUseTariff"
                    type="checkbox"
                    className="mt-1 h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
                  />
                  <span className="ml-3">
                    <span className="text-sm font-bold text-eco-black block">
                      Cheaper Night-Time Electricity
                    </span>
                    <span className="text-xs text-eco-black/70">
                      Economy 7, Octopus Agile, etc.
                    </span>
                  </span>
                </label>
              </div>

              {/* Heating Type */}
              <div className="border-2 border-eco-border rounded-lg p-3">
                <label
                  htmlFor="edit-heatingType"
                  className="block text-xs font-black text-black mb-2 uppercase"
                >
                  Heating Type
                </label>
                <select
                  {...register('heatingType')}
                  id="edit-heatingType"
                  className="w-full pl-4 pr-10 py-3 border-2 border-eco-border rounded-lg font-medium focus:ring-4 focus:ring-eco-mint bg-white"
                >
                  <option value="gas">Gas Boiler</option>
                  <option value="electric">Electric Heating</option>
                  <option value="heat-pump">Heat Pump</option>
                  <option value="oil">Oil Boiler</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Hot Water System */}
              <div className="border-2 border-eco-border rounded-lg p-3">
                <label
                  htmlFor="edit-hotWaterSystem"
                  className="block text-xs font-black text-black mb-2 uppercase"
                >
                  Hot Water System
                </label>
                <select
                  {...register('hotWaterSystem')}
                  id="edit-hotWaterSystem"
                  className="w-full pl-4 pr-10 py-3 border-2 border-eco-border rounded-lg font-medium focus:ring-4 focus:ring-eco-mint bg-white"
                >
                  {validHotWaterOptions.includes('combi') && (
                    <option value="combi">Combi Boiler (instant)</option>
                  )}
                  {validHotWaterOptions.includes('tank') && (
                    <option value="tank">Hot Water Tank</option>
                  )}
                  {validHotWaterOptions.includes('electric') && (
                    <option value="electric">Electric Immersion</option>
                  )}
                  {validHotWaterOptions.includes('other') && <option value="other">Other</option>}
                </select>
              </div>

              {/* Preferred Temperature */}
              <div className="border-2 border-eco-border rounded-lg p-3">
                <label
                  htmlFor="edit-preferredTemperature"
                  className="block text-xs font-black text-black mb-2 uppercase"
                >
                  Preferred Home Temperature
                </label>
                <input
                  {...register('preferredTemperature', { valueAsNumber: true })}
                  id="edit-preferredTemperature"
                  type="number"
                  min="15"
                  max="25"
                  step="0.5"
                  className="w-full px-4 py-3 border-2 border-eco-border rounded-lg font-medium focus:ring-4 focus:ring-eco-mint"
                />
                <p className="text-xs text-eco-black/70 mt-2">
                  Used to personalise heating recommendations
                </p>
                {errors.preferredTemperature && (
                  <p className="text-eco-black bg-eco-lemon font-bold text-sm mt-2 px-3 py-2 rounded-lg">
                    {errors.preferredTemperature.message}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="eco-card-gold p-3">
                  <p className="text-eco-black font-bold text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="flex-1 eco-btn py-3 px-5">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirmation(true)}
                  className="px-5 py-3 font-bold uppercase text-sm border-2 border-eco-border rounded-lg hover:bg-eco-lemon hover:text-eco-black transition"
                >
                  Clear
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
