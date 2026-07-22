import { Navigate, useParams } from 'react-router-dom'
import { useMeta } from '../lib/meta'
import CustomPage from './CustomPage'
import { PageDashboard } from './Dashboard'

export default function SlugRoute() {
  const { '*': id = '' } = useParams()
  const meta = useMeta()
  const page = meta.pages?.find((p) => p.id === id)
  if (!page) return <Navigate to="/" replace />
  return page.declarative ? <PageDashboard /> : <CustomPage />
}
