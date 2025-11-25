import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('rounded-xl bg-slate-900/70 border border-slate-800 p-5 shadow-lg', className)}>
      {children}
    </div>
  )
}
