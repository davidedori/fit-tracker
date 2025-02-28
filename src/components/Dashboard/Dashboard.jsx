import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import FeatherIcon from 'feather-icons-react'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Benvenuto, {user.email}</h1>
        <p className="text-gray-600">Ecco un riepilogo dei tuoi allenamenti</p>
      </div>

      {/* Grid a 2 colonne con larghezza minima forzata */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 min-w-[300px]">
          <div className="flex items-center gap-2 mb-4">
            <FeatherIcon icon="play-circle" className="text-blue-500" />
            <h2 className="text-xl font-bold">Prossimo allenamento</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">Oggi</p>
              <p className="text-gray-600">5 esercizi programmati</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
              Inizia <FeatherIcon icon="arrow-right" size={16} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 min-w-[300px]">
          <div className="flex items-center gap-2 mb-4">
            <FeatherIcon icon="activity" className="text-blue-500" />
            <h2 className="text-xl font-bold">Ultimi allenamenti</h2>
          </div>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <FeatherIcon icon="target" size={16} className="text-gray-500" />
                  <div>
                    <p className="font-medium">Allenamento {i}</p>
                    <p className="text-sm text-gray-500">2 giorni fa</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">45 min</p>
                  <p className="text-sm text-gray-500">6 esercizi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 