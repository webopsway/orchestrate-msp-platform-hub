import { useEffect, useState } from 'react'
import './App.css'
import { extractTenantFromSubdomain } from './services/apiClient'

function App() {
  const [tenant, setTenant] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Extraire le tenant du sous-domaine
    const currentTenant = extractTenantFromSubdomain(window.location.hostname)
    setTenant(currentTenant)
    setLoading(false)
  }, [])

  const isLocalDevelopment = window.location.hostname === 'localhost'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold">
              👥 {tenant ? `Portal ${tenant.toUpperCase()}` : 'Client Portal'}
            </h1>
            <div className="text-sm">
              Port 3001 | API: http://localhost:3002
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">🏢 Interface Client</h2>

          {isLocalDevelopment ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <strong>Mode Développement:</strong> En production, ce portail sera accessible via des sous-domaines comme <code>client1.msp.com</code>
            </div>
          ) : (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <strong>Tenant actuel:</strong> {tenant || 'Non détecté'}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded p-4 bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-2">🔐 Authentification</h3>
              <p className="text-sm text-blue-700">
                Interface sécurisée pour les clients et ESN avec isolation des données par organisation.
              </p>
            </div>

            <div className="border rounded p-4 bg-purple-50">
              <h3 className="font-semibold text-purple-800 mb-2">🎨 Branding</h3>
              <p className="text-sm text-purple-700">
                Interface personnalisable selon l'organisation cliente avec branding spécifique.
              </p>
            </div>

            <div className="border rounded p-4 bg-indigo-50">
              <h3 className="font-semibold text-indigo-800 mb-2">📊 Dashboard</h3>
              <p className="text-sm text-indigo-700">
                Métriques et KPIs limités aux données de l'organisation cliente.
              </p>
            </div>

            <div className="border rounded p-4 bg-emerald-50">
              <h3 className="font-semibold text-emerald-800 mb-2">👥 Équipe</h3>
              <p className="text-sm text-emerald-700">
                Gestion des membres de l'équipe avec permissions restreintes.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded">
            <h3 className="font-semibold text-green-800 mb-2">🌐 Multi-Tenant Architecture</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>🏢 <strong>Isolation des données</strong> par organisation</li>
              <li>🔐 <strong>Row Level Security</strong> dans la base de données</li>
              <li>🎯 <strong>Tenant resolution</strong> par sous-domaine</li>
              <li>⚡ <strong>Performance</strong> optimisée pour les clients</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold text-gray-800 mb-2">🚀 Architecture Séparée</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-blue-600 font-semibold">API Backend</div>
                <div>Port 3002</div>
                <div className="text-xs text-gray-500">Logique métier commune</div>
              </div>
              <div className="text-center">
                <div className="text-blue-600 font-semibold">MSP Admin</div>
                <div>Port 3000</div>
                <div className="text-xs text-gray-500">Administration globale</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 font-semibold">Client Portal</div>
                <div>Port 3001</div>
                <div className="text-xs text-gray-500">Interface clients (ici)</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
