import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormShowroom } from './showroom'

export const metadata: Metadata = {
  title: 'Form language / MTN Club',
  robots: { index: false, follow: false },
}
export default function FormLabPage() {
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.VERCEL_ENV !== 'preview'
  )
    notFound()
  return <FormShowroom />
}
