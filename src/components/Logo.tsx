import Image from 'next/image'

export default function Logo({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizes = {
    small: { width: 24, height: 24 },    // For smaller contexts
    medium: { width: 36, height: 36 },    // For court page header
    large: { width: 48, height: 48 }      // For landing page
  }

  return (
    <Image
      src="/images/LogoDone.png"  // Updated to match your actual file name
      alt="LineupMan Logo"
      {...sizes[size]}
      className="w-auto h-auto"
      priority
      quality={100}
    />
  )
} 