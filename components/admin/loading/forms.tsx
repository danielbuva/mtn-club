import { LoadingPanel, LoadingValue } from './primitives'

export { LeadershipLoading } from './leadership'
export { SettingsLoading } from './settings'

export function AccountDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
      <p className="mb-6 text-sm font-semibold">← Accounts</p>
      <p className="font-brand text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Leadership admin
      </p>
      <LoadingValue className="mt-2 h-12 w-56" />
      <LoadingValue className="mt-3 h-6 w-64" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <LoadingPanel title="Account access">
          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            {['Created', 'Last sign in', 'Application', 'Mailing list'].map(
              label => (
                <div key={label}>
                  <p className="text-muted-foreground">{label}</p>
                  <LoadingValue className="mt-1" />
                </div>
              ),
            )}
          </div>
        </LoadingPanel>
        {['Leadership roles', 'Membership history', 'Zelle payments'].map(
          title => (
            <LoadingPanel key={title} title={title}>
              <LoadingValue className="mt-5 h-12 w-full" />
              <LoadingValue className="mt-3 h-12 w-full" />
            </LoadingPanel>
          ),
        )}
      </div>
    </div>
  )
}
