'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import { Toast } from '@/components/Toast'
import styles from './admin.module.css'

interface User {
  id: string
  email: string
  role: string
  token_balance: number
  created_at: string
}

interface Stats {
  total_users: number
  total_queries: number
  total_tokens_allocated: number
  total_tokens_consumed: number
  total_tokens_available: number
}

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [tokenAmount, setTokenAmount] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'tokens' | 'stats'>('users')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const supabase = createClientSupabase()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      setToast({ message: 'Acceso denegado. Se requieren permisos de administrador.', type: 'error' })
      setTimeout(() => router.push('/dashboard'), 2000)
      return
    }

    setCurrentUser(user)
    await loadData()
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([
      loadUsers(),
      loadStats()
    ])
    setLoading(false)
  }

  const loadUsers = async () => {
    const supabase = createClientSupabase()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && !error) {
      setUsers(data)
    }
  }

  const loadStats = async () => {
    if (!currentUser) return

    const supabase = createClientSupabase()
    const { data, error } = await supabase.rpc('get_system_stats', {
      p_admin_id: currentUser.id
    })

    if (data?.success && !error) {
      setStats(data.stats)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!currentUser) return

    const supabase = createClientSupabase()
    const { data, error } = await supabase.rpc('change_user_role', {
      p_user_id: userId,
      p_new_role: newRole,
      p_admin_id: currentUser.id
    })

    if (data?.success) {
      setToast({ message: 'Rol actualizado correctamente', type: 'success' })
      await loadUsers()
    } else {
      setToast({ message: data?.error || 'Error al cambiar rol', type: 'error' })
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userEmail}? Esta acción no se puede deshacer.`)) {
      return
    }

    if (!currentUser) return

    const supabase = createClientSupabase()
    const { data, error } = await supabase.rpc('delete_user', {
      p_user_id: userId,
      p_admin_id: currentUser.id
    })

    if (data?.success) {
      setToast({ message: 'Usuario eliminado correctamente', type: 'success' })
      await loadUsers()
    } else {
      setToast({ message: data?.error || 'Error al eliminar usuario', type: 'error' })
    }
  }

  const handleAllocateTokens = async () => {
    if (!selectedUser || !tokenAmount || !currentUser) return

    const amount = parseInt(tokenAmount)
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Cantidad de tokens inválida', type: 'error' })
      return
    }

    const supabase = createClientSupabase()
    const { data, error } = await supabase.rpc('allocate_tokens', {
      p_user_id: selectedUser.id,
      p_amount: amount,
      p_admin_id: currentUser.id,
      p_description: `Asignación manual por admin`
    })

    if (data?.success) {
      setToast({ message: `${amount} tokens asignados a ${selectedUser.email}`, type: 'success' })
      setTokenAmount('')
      setSelectedUser(null)
      await loadUsers()
      await loadStats()
    } else {
      setToast({ message: data?.error || 'Error al asignar tokens', type: 'error' })
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>⚽</div>
        <p>Cargando panel de administración...</p>
      </div>
    )
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminContainer}>
        {/* Header */}
        <header className={styles.adminHeader}>
          <div>
            <h1>🔧 Panel de Administración</h1>
            <p>Gestión de usuarios, tokens y sistema</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className={styles.btnBack}>
            ← Volver al Dashboard
          </button>
        </header>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuarios
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'tokens' ? styles.active : ''}`}
            onClick={() => setActiveTab('tokens')}
          >
            🪙 Tokens
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Estadísticas
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className={styles.usersSection}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="🔍 Buscar usuario por email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Tokens</th>
                      <th>Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.token_balance}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actions}>
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeRole(user.id, e.target.value)}
                              className={styles.roleSelect}
                              disabled={user.id === currentUser?.id}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                            <button
                              onClick={() => setSelectedUser(user)}
                              className={styles.btnAction}
                              title="Asignar tokens"
                            >
                              🪙
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className={styles.btnDelete}
                              disabled={user.id === currentUser?.id}
                              title="Eliminar usuario"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className={styles.tokensSection}>
              <div className={styles.card}>
                <h3>Asignar Tokens</h3>
                <div className={styles.tokenForm}>
                  <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                      const user = users.find(u => u.id === e.target.value)
                      setSelectedUser(user || null)
                    }}
                    className={styles.userSelect}
                  >
                    <option value="">Seleccionar usuario...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.email} ({user.token_balance} tokens)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Cantidad de tokens"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    className={styles.tokenInput}
                    min="1"
                  />
                  <button
                    onClick={handleAllocateTokens}
                    className={styles.btnPrimary}
                    disabled={!selectedUser || !tokenAmount}
                  >
                    Asignar Tokens
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className={styles.statsSection}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statValue}>{stats.total_users}</div>
                  <div className={styles.statLabel}>Usuarios Totales</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📝</div>
                  <div className={styles.statValue}>{stats.total_queries}</div>
                  <div className={styles.statLabel}>Consultas Realizadas</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>🪙</div>
                  <div className={styles.statValue}>{stats.total_tokens_available}</div>
                  <div className={styles.statLabel}>Tokens Disponibles</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>✅</div>
                  <div className={styles.statValue}>{stats.total_tokens_allocated}</div>
                  <div className={styles.statLabel}>Tokens Asignados</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📉</div>
                  <div className={styles.statValue}>{stats.total_tokens_consumed}</div>
                  <div className={styles.statLabel}>Tokens Consumidos</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
