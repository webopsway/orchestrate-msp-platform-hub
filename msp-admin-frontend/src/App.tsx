import { useEffect, useState } from 'react'
import './App.css'
import { userService } from './services/userService'

function App() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Pour le développement, utilise un token de test
        localStorage.setItem('auth_token', 'dev')
        const usersData = await userService.getUsers()
        setUsers(usersData)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des utilisateurs')
        console.error('Erreur API:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold">🔧 MSP Admin Platform</h1>
            <div className="text-sm">
              Port 3000 | API: http://localhost:3002
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">👥 Gestion des Utilisateurs</h2>

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Chargement des utilisateurs...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Erreur:</strong> {error}
              <br />
              <small>Assurez-vous que l'API Backend est démarrée sur http://localhost:3002</small>
            </div>
          )}

          {!loading && !error && (
            <div>
              <p className="text-green-600 mb-4">
                ✅ Connexion API réussie ! {users.length} utilisateur(s) trouvé(s).
              </p>

              <div className="grid gap-4">
                {users.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    Aucun utilisateur trouvé. Créez votre premier utilisateur avec l'API !
                  </div>
                ) : (
                  users.map((user: any) => (
                    <div key={user.id} className="border rounded p-4 bg-gray-50">
                      <h3 className="font-semibold">{user.first_name} {user.last_name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      {user.organization && (
                        <p className="text-sm text-blue-600">Org: {user.organization.name}</p>
                      )}
                      {user.team && (
                        <p className="text-sm text-green-600">Équipe: {user.team.name}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">🚀 Architecture Séparée Active</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>📡 <strong>API Backend:</strong> http://localhost:3002</li>
              <li>🔧 <strong>MSP Admin:</strong> http://localhost:3000 (cette interface)</li>
              <li>👥 <strong>Client Portal:</strong> http://localhost:3001</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
