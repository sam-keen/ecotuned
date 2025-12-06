'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userPreferencesSchema, type UserPreferences } from '@/lib/schemas'
import { savePreferences, clearPreferences } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import Badge from './Badge'

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
    formState: { errors },
  } = useForm<UserPreferences>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: currentPreferences,
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
                This will delete all your preferences and return you to the setup screen.
                You'll need to enter your postcode and preferences again.
              </Dialog.Description>
              <p className="text-eco-black/80 font-medium text-sm">
                This action cannot be undone.
              </p>
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
                  className="flex-1 px-5 py-3 font-bold uppercase text-sm bg-eco-coral border-2 border-eco-coral text-eco-black rounded-lg hover:bg-eco-sunset hover:border-eco-sunset transition shadow-[4px_4px_0px_#FF9B7A]"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Postcode */}
            <div>
              <label htmlFor="edit-postcode" className="block text-xs font-black text-black mb-2 uppercase">
                Postcode
              </label>
              <input
                {...register('postcode')}
                id="edit-postcode"
                type="text"
                className="w-full px-4 py-3 border-2 border-eco-border rounded-lg font-medium focus:ring-4 focus:ring-eco-mint"
              />
              {errors.postcode && (
                <p className="text-eco-black bg-eco-lemon font-bold text-sm mt-2 px-3 py-2 rounded-lg">{errors.postcode.message}</p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-mint/20 transition">
                <input
                  {...register('hasGarden')}
                  id="edit-hasGarden"
                  type="checkbox"
                  className="h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
                />
                <span className="ml-3 text-sm font-bold text-eco-black">Garden / Balcony</span>
              </label>

              <label className="flex items-center border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-mint/20 transition">
                <input
                  {...register('hasEV')}
                  id="edit-hasEV"
                  type="checkbox"
                  className="h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
                />
                <span className="ml-3 text-sm font-bold text-eco-black">Electric Vehicle</span>
              </label>

              <label className="flex items-center border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-mint/20 transition">
                <input
                  {...register('cycleToWork')}
                  id="edit-cycleToWork"
                  type="checkbox"
                  className="h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
                />
                <span className="ml-3 text-sm font-bold text-eco-black">Cycle to Work</span>
              </label>

              <label className="flex items-center border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-mint/20 transition">
                <input
                  {...register('hasSolar')}
                  id="edit-hasSolar"
                  type="checkbox"
                  className="h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sage"
                />
                <span className="ml-3 text-sm font-bold text-eco-black">Solar Panels</span>
              </label>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <p className="text-xs font-black text-black uppercase tracking-wide">
                When are you home on weekdays?
              </p>

              <label className="flex items-center border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-sky/20 transition">
                <input
                  {...register('homeWeekdayMorning')}
                  id="edit-homeWeekdayMorning"
                  type="checkbox"
                  className="h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sky"
                />
                <span className="ml-3 text-sm font-bold text-eco-black">Mornings</span>
              </label>

              <label className="flex items-center border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-sky/20 transition">
                <input
                  {...register('homeWeekdayAfternoon')}
                  id="edit-homeWeekdayAfternoon"
                  type="checkbox"
                  className="h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sky"
                />
                <span className="ml-3 text-sm font-bold text-eco-black">Afternoons</span>
              </label>

              <label className="flex items-center border-2 border-eco-border rounded-lg p-3 cursor-pointer hover:bg-eco-sky/20 transition">
                <input
                  {...register('homeWeekdayEvening')}
                  id="edit-homeWeekdayEvening"
                  type="checkbox"
                  className="h-5 w-5 border-2 border-eco-border cursor-pointer accent-eco-sky"
                />
                <span className="ml-3 text-sm font-bold text-eco-black">Evenings</span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="eco-card-gold p-3">
                <p className="text-eco-black font-bold text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 eco-btn py-3 px-5"
              >
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
