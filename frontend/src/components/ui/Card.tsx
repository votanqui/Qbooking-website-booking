'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'none', children, ...props }, ref) => {
    const baseClasses = 'rounded-xl transition-all duration-200'
    
    const variants = {
      default: 'bg-white shadow-sm border border-gray-200',
      elevated: 'bg-white shadow-lg border border-gray-100',
      outlined: 'bg-transparent border-2 border-gray-200'
    }
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }

    return (
      <div
        className={cn(baseClasses, variants[variant], paddings[padding], className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }