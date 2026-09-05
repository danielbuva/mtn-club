import {
  LoadingField,
  LoadingPanel,
  LoadingTable,
  LoadingValue,
} from './primitives'

export function ActivityHistoryLoading() {
  return (
    <LoadingPanel title="Activity history" className="mt-6">
      <LoadingValue className="mt-2 h-5 w-3/4" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {['By', 'Action', 'From', 'Through', 'Sort by'].map(label => (
          <LoadingField key={label} label={label} />
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <LoadingValue className="h-9 w-28" />
        <LoadingValue className="h-9 w-28" />
      </div>
      <LoadingValue className="mt-5 h-5 w-36" />
      <LoadingTable
        columns={['Activity', 'By', 'Action', 'Date (UTC)']}
        className="mt-3"
      />
      <LoadingValue className="mt-5 h-9 w-28" />
    </LoadingPanel>
  )
}
