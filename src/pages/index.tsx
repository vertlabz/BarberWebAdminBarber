import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getAuth } from '@/lib/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()
    if (!auth) {
      router.replace('/login')
      return
    }
    if (auth.user.isProvider) router.replace('/provider/dashboard')
    else router.replace('/dashboard')
  }, [router])

  return <div className="text-sm text-slate-400">Redirecionando...</div>
}
