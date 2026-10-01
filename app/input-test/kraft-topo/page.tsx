import { notFound } from 'next/navigation'
import { TopoTestFixture } from '@/components/kraft/topo-test-fixture'

export default function TopoTestPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <TopoTestFixture />
}
