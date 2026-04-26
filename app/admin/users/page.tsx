'use client'
import { useState, useEffect } from 'react'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => { fetch('/api/admin-data?resource=users').then(r => r.json()).then(d => setUsers(d.data || [])) }, [])

  const toggleUser = async (id: string) => {
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_user', id }) })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u))
  }

  const changeRole = async (id: string, role: string) => {
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'change_role', id, role }) })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  return (
    <div>
      <h1 style={{ color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>Users ({users.length})</h1>
      <div className="ac">
        <div style={{ overflowX: 'auto' }}>
          <table className="atable">
            <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ color: '#f0f0f0', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ color: '#888', fontSize: '.82rem' }}>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                      style={{ background: '#222', border: '1px solid rgba(255,255,255,.08)', borderRadius: 4, padding: '2px 6px', color: u.role === 'admin' ? 'var(--primary)' : '#888', fontSize: '.78rem', cursor: 'pointer' }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td><span style={{ background: u.is_active ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)', color: u.is_active ? '#22c55e' : '#ef4444', padding: '2px 7px', borderRadius: 4, fontSize: '.68rem', fontWeight: 700 }}>{u.is_active ? 'Active' : 'Banned'}</span></td>
                  <td style={{ color: '#555', fontSize: '.78rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td><button className="abtn abtn-sm" onClick={() => toggleUser(u.id)}><i className={`fas fa-${u.is_active ? 'ban' : 'check'}`} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
