import { useEffect, useState } from 'react'

export default function useIsMd() {
  const [isMd, setIsMd] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsMd(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isMd
}
