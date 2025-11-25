import { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export default function Button({ variant = 'primary', className, ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<typeof variant, string> = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white focus:ring-brand-500',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-100 focus:ring-slate-600'
  }

  return <button className={clsx(base, variants[variant], className)} {...props} />
}
