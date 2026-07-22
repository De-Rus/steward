import { describe, expect, it } from 'vitest'
import type { ColumnMeta } from '../api/types'
import { buildBulkSet, coerceValue, editorString, isInlineEditable } from './editing'

const col = (partial: Partial<ColumnMeta>): ColumnMeta => ({
  name: 'c',
  kind: 'text',
  widget: 'text',
  params: {},
  nullable: true,
  readonly: false,
  masked: false,
  fk: null,
  ...partial,
})

describe('coerceValue', () => {
  it('coerces numbers and blanks to null', () => {
    expect(coerceValue(col({ widget: 'number' }), '42')).toBe(42)
    expect(coerceValue(col({ widget: 'money' }), '')).toBeNull()
    expect(coerceValue(col({ widget: 'number' }), 'abc')).toBeNull()
  })
  it('coerces toggles from truthy strings', () => {
    expect(coerceValue(col({ widget: 'toggle' }), 'true')).toBe(true)
    expect(coerceValue(col({ widget: 'toggle' }), false)).toBe(false)
  })
  it('splits arrays and parses json', () => {
    expect(coerceValue(col({ widget: 'array' }), 'a, b ,c')).toEqual(['a', 'b', 'c'])
    expect(coerceValue(col({ widget: 'json' }), '{"a":1}')).toEqual({ a: 1 })
    expect(coerceValue(col({ widget: 'json' }), 'not json')).toBe('not json')
  })
  it('passes text through', () => {
    expect(coerceValue(col({ widget: 'text' }), 'hi')).toBe('hi')
  })
})

describe('editorString', () => {
  it('renders values back to editable strings', () => {
    expect(editorString(col({ widget: 'array' }), ['a', 'b'])).toBe('a, b')
    expect(editorString(col({ widget: 'json' }), { a: 1 })).toBe('{"a":1}')
    expect(editorString(col({}), null)).toBe('')
    expect(editorString(col({ widget: 'number' }), 7)).toBe('7')
  })
})

describe('buildBulkSet', () => {
  it('builds a single-column typed payload', () => {
    expect(buildBulkSet(col({ name: 'active', widget: 'toggle' }), '1')).toEqual({ active: true })
    expect(buildBulkSet(col({ name: 'qty', widget: 'number' }), '3.5')).toEqual({ qty: 3.5 })
  })
})

describe('isInlineEditable', () => {
  it('permits scalar widgets and rejects structural ones', () => {
    expect(isInlineEditable(col({ widget: 'text' }))).toBe(true)
    expect(isInlineEditable(col({ widget: 'toggle' }))).toBe(true)
    expect(isInlineEditable(col({ widget: 'json' }))).toBe(false)
    expect(isInlineEditable(col({ widget: 'image' }))).toBe(false)
  })
})
