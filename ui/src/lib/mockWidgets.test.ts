import { describe, expect, it } from 'vitest'
import { mockElement } from './mockWidgets'
import { pageElementName, widgetElementName } from './widgets'

describe('mockElement tag derivation', () => {
  it('maps a shared widget-kind module to sx-widget-<stem>', () => {
    expect(mockElement('config/widgets/minibar.js')).toEqual({
      kind: 'widget',
      name: 'minibar',
      tag: widgetElementName('minibar'),
    })
  })

  it('maps the sparkline widget module to sx-widget-sparkline', () => {
    expect(mockElement('config/widgets/sparkline.js').tag).toBe(widgetElementName('sparkline'))
  })

  it('maps a flat page module to sx-page-<slug>, not the whole path', () => {
    expect(mockElement('reconcile.js')).toEqual({
      kind: 'page',
      name: 'reconcile',
      tag: pageElementName('reconcile'),
    })
  })

  it('maps a pathy page module by its slug stem', () => {
    expect(mockElement('overview/ops/ops.js')).toEqual({
      kind: 'page',
      name: 'ops',
      tag: pageElementName('ops'),
    })
  })
})
