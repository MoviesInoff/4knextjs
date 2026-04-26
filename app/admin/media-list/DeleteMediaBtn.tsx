'use client'
import { useRouter } from 'next/navigation'

export default function DeleteMediaBtn({ id, title }: { id: number, title: string }) {
  const router = useRouter()
  const handleDelete = async () => {
    if (!confirm(`Delete "${title}" permanently?`)) return
    await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_media', id })
    })
    router.refresh()
  }
  return (
    <button className="abtn abtn-danger abtn-sm" onClick={handleDelete} title="Delete">
      <i className="fas fa-trash" />
    </button>
  )
}
