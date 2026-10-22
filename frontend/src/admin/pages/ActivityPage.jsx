import { useMemo, useState } from 'react'
import { History } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useStore } from '../../store/hooks.js'
import { clearActivity } from '../../store/store.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useConfirm } from '../components/ConfirmContext.jsx'
import { Card, DemoNote, PageHeader, SearchInput } from '../components/ui.jsx'
import { formatDateTime, timeAgo } from '../lib/listUtils.js'

const KINDS = [
  ['all', 'All changes'],
  ['product', 'Products'],
  ['inventory', 'Inventory'],
  ['collection', 'Collections'],
  ['content', 'Content'],
  ['settings', 'Settings'],
  ['setBuilder', 'Build a Set'],
  ['order', 'Orders'],
  ['store', 'Resets'],
]

export default function ActivityPage() {
  const { activity } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const list = useMemo(
    () => activity.filter((a) => (kind === 'all' || a.type.startsWith(`${kind}.`)) && (!query.trim() || `${a.message} ${a.actor}`.toLowerCase().includes(query.trim().toLowerCase()))),
    [activity, kind, query],
  )

  const clear = async () => {
    if (!(await confirm({ title: 'Clear the activity history?', message: 'The local list of changes is deleted. Your catalog, content and settings are not affected.', confirmLabel: 'Clear history', tone: 'danger' }))) return
    clearActivity()
    notify({ tone: 'info', title: 'Activity history cleared' })
  }

  return (
    <>
      <PageHeader
        title="Activity"
        description="Changes made in this browser, newest first (last 200)."
        actions={
          activity.length > 0 && (
            <button type="button" className="btn btn--light btn--sm" onClick={clear}>
              Clear history
            </button>
          )
        }
      />
      <DemoNote tone="warning">Local demo activity, stored in this browser. It can be edited or cleared by anyone using it, so it is not a secure audit log.</DemoNote>
      <Card className="adm-card--flush">
        <div className="adm-card__head" style={{ marginBottom: 0 }}>
          <div className="adm-toolbar" style={{ width: '100%' }}>
            <SearchInput value={query} onChange={setQuery} placeholder="Search activity" label="Search activity" />
            <label className="adm-filter">
              Type
              <select className="select" value={kind} onChange={(e) => setKind(e.target.value)}>
                {KINDS.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={History} title={activity.length ? 'No activity matches' : 'No activity yet'}>
            <p>Saved changes to products, inventory, collections, content and settings are listed here.</p>
          </EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <caption className="visually-hidden">Activity history</caption>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Change</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id}>
                    <td className="nowrap" title={formatDateTime(a.at)}>
                      {timeAgo(a.at)}
                    </td>
                    <td>{a.message}</td>
                    <td className="nowrap muted">{a.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
