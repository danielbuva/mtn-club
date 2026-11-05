import assert from 'node:assert/strict'
import test from 'node:test'
import { escapeCsvCell } from '../lib/admin/csv.ts'

test('CSV cells neutralize formulas after whitespace and control characters', () => {
  const prefixes = [
    '',
    ' ',
    '\t',
    '\r',
    '\n',
    '\u0000',
    '\u001f',
    '\u007f',
    '\u00a0',
    ' \t\u0001',
  ]
  for (const prefix of prefixes) {
    for (const marker of ['=', '+', '-', '@', '\t', '\r', '\n']) {
      const value = `${prefix}${marker}HYPERLINK("bad"),value`
      assert.equal(escapeCsvCell(value), `"'${value.replaceAll('"', '""')}"`)
    }
  }
})

test('CSV cells preserve ordinary text, quotes, commas, and embedded newlines', () => {
  for (const value of [
    '',
    'Member, One',
    '  Member',
    'A+B',
    'A\tB',
    'A\rB',
    'A\nB',
    'Dax "D"',
    "'=1+1",
  ]) {
    assert.equal(escapeCsvCell(value), `"${value.replaceAll('"', '""')}"`)
  }
})
