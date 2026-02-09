'use client'

/** Animated ɃU logo loading indicator. Use instead of "Loading..." text. */
export default function BULoading({ className = '', size = 'default' }: { className?: string; size?: 'default' | 'compact' }) {
  const isCompact = size === 'compact'
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} aria-hidden>
      <div className="relative">
        <span className={`font-bold text-primary animate-pulse ${isCompact ? 'text-xl' : 'text-3xl'}`}>Ƀ</span>
        <span
          className={`absolute inset-0 font-bold text-primary opacity-30 animate-ping ${isCompact ? 'text-xl' : 'text-3xl'}`}
          style={{ animationDuration: '1.5s' }}
          aria-hidden
        >
          Ƀ
        </span>
      </div>
      <div className="flex gap-1">
        <span className={`rounded-full bg-primary animate-bounce [animation-delay:0ms] ${isCompact ? 'h-1 w-1' : 'h-1.5 w-1.5'}`} />
        <span className={`rounded-full bg-primary animate-bounce [animation-delay:150ms] ${isCompact ? 'h-1 w-1' : 'h-1.5 w-1.5'}`} />
        <span className={`rounded-full bg-primary animate-bounce [animation-delay:300ms] ${isCompact ? 'h-1 w-1' : 'h-1.5 w-1.5'}`} />
      </div>
    </div>
  )
}
