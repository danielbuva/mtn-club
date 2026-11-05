/** The registration summaries RPC accepts at most 200 IDs per call. */
export async function fetchRegistrationSummaryBatches<T>(
  tripIds: readonly string[],
  fetchBatch: (ids: string[]) => Promise<T[]>,
): Promise<T[]> {
  const batches: Promise<T[]>[] = []
  for (let offset = 0; offset < tripIds.length; offset += 200) {
    batches.push(fetchBatch(tripIds.slice(offset, offset + 200)))
  }
  return (await Promise.all(batches)).flat()
}
