'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong!</h2>
        <p className="text-red-600 mb-4">
          We encountered an error while processing your request. This could be due to:
        </p>
        <ul className="list-disc list-inside text-red-600 mb-4 space-y-1">
          <li>A problem with the weather service</li>
          <li>An invalid postcode</li>
          <li>A temporary network issue</li>
        </ul>
        <button
          onClick={reset}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
