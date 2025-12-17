import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img src='/arivihan.jpeg' alt='Arivihan' className='size-9 rounded-md object-contain' />
      <span className='text-xl font-semibold'>Internal Metrics</span>
    </div>
  )
}

export default Logo
