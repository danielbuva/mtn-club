import assert from 'node:assert/strict'
import test from 'node:test'
import { extractOpenBetaAreas } from '../scripts/kraft-openbeta-serialization.ts'

test('OpenBeta Flight literal dollar names decode once without becoming record references', () => {
  const literalText = '$$literal café'
  const length = Buffer.byteLength(literalText).toString(16)
  const stream =
    `a:T${length},${literalText}\n` +
    'b:{"uuid":"area-id","areaName":"$$600 Boulder","climbs":[{"name":"$$600"},{"name":"$$500"},{"name":"$$dead"}],"description":"$a"}\n' +
    'dead:"wrong token value"\n'
  const html = `<script>self.__next_f.push(${JSON.stringify([1, stream])})</script>`
  const area = extractOpenBetaAreas(html).find(item => item.uuid === 'area-id')
  assert.equal(area.areaName, '$600 Boulder')
  assert.deepEqual(
    area.climbs.map(climb => climb.name),
    ['$600', '$500', '$dead'],
  )
  assert.equal(area.description, literalText)
})
