'use client'

import { ChevronDown } from 'lucide-react'
import { useAdminViewer } from '../admin-view-frame'
import { roleCardClass, roleSummaryClass } from '../leadership-styles'
import { LoadingValue } from './primitives'

export function LeadershipLoading() {
  const viewer = useAdminViewer()
  return (
    <>
      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-brand text-3xl uppercase">Active roster</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Public names stay separate from accounts until an officer signs
              up.
            </p>
          </div>
        </div>
        <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
          {[0, 1].map(row => (
            <div key={row} className={roleCardClass}>
              <div className={roleSummaryClass}>
                <span className="min-w-0">
                  <span className="flex h-6 items-center">
                    <LoadingValue className="h-4 w-40" />
                  </span>
                  <span className="flex h-5 items-center">
                    <LoadingValue className="h-3 w-28" />
                  </span>
                </span>
                <ChevronDown
                  className="ml-3 size-4 shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
          {!viewer || viewer.isSuperAdmin ? (
            <div className={roleCardClass}>
              <div className={roleSummaryClass}>
                <span className="font-semibold">Add leader</span>
                <ChevronDown className="size-4" aria-hidden="true" />
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <section className="mt-12">
        <h2 className="font-brand text-3xl uppercase">Role permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Multiple roles combine; the most permissive scope wins. Protected
          super-admin powers are not delegable here.
        </p>
        <div className="mt-5 space-y-5">
          {[0, 1, 2].map(row => (
            <div key={row} className={roleCardClass}>
              <div className={roleSummaryClass}>
                <LoadingValue className="h-6 w-48" />
                <span className="flex items-center gap-3">
                  <LoadingValue className="h-5 w-24 rounded-full" />
                  <ChevronDown className="size-4" aria-hidden="true" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
