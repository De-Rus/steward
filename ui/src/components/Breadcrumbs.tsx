import { Link, useLocation, useParams } from 'react-router-dom'
import type { Meta } from '../api/types'
import { useT } from '../lib/i18n'

interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ meta }: { meta: Meta }) {
  const t = useT()
  const location = useLocation()
  const params = useParams()
  const seg = location.pathname.split('/').filter(Boolean)

  const crumbs: Crumb[] = []
  if (seg.length === 0) {
    crumbs.push({ label: t('nav_dashboard') })
  } else if (seg[0] === 'audit') {
    crumbs.push({ label: t('nav_audit') })
  } else if (seg[0] === '_access') {
    crumbs.push({ label: t('access_group') })
    crumbs.push({ label: t(seg[1] === 'roles' ? 'access_roles' : 'access_users') })
  } else if (seg[0] === 'p') {
    const id = seg.slice(1).join('/')
    const page = meta.pages?.find((p) => p.id === id)
    if (page) {
      if (page.group) crumbs.push({ label: page.group })
      crumbs.push({ label: page.label })
    } else {
      crumbs.push({ label: id })
    }
  } else {
    const table = meta.tables.find((tb) => tb.name === seg[0])
    if (table) {
      if (table.group) crumbs.push({ label: table.group })
      crumbs.push({ label: table.label_plural, to: seg.length > 1 ? `/${table.name}` : undefined })
      if (seg[1] === 'new') crumbs.push({ label: t('page_new_suffix') })
      else if (params.pk) crumbs.push({ label: decodeURIComponent(params.pk) })
    } else {
      crumbs.push({ label: seg[0] })
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1
        return (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span className="text-muted">/</span>}
            {c.to && !last ? (
              <Link to={c.to} className="truncate text-muted hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span
                className={last ? 'truncate font-medium text-ink' : 'truncate text-muted'}
                style={last ? { maxWidth: '40ch' } : undefined}
              >
                {c.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
