interface BadgeProps {
  children: React.ReactNode
  color?: 'mint' | 'sky' | 'azure' | 'sage' | 'lemon' | 'coral' | 'sunset'
}

export default function Badge({ children, color = 'sage' }: BadgeProps) {
  // Map colors to full Tailwind classes (required for JIT compilation)
  const colorClasses = {
    mint: 'bg-eco-mint border-eco-mint',
    sky: 'bg-eco-sky border-eco-sky',
    azure: 'bg-eco-azure border-eco-azure',
    sage: 'bg-eco-sage border-eco-sage',
    lemon: 'bg-eco-lemon border-eco-lemon',
    coral: 'bg-eco-coral border-eco-coral',
    sunset: 'bg-eco-sunset border-eco-sunset',
  }

  return (
    <div className={`eco-badge ${colorClasses[color]} border-2 text-eco-black`}>{children}</div>
  )
}
