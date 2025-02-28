import React from 'react'
import { User, Activity, FileText, Tool, Target, Play, Edit } from 'react-feather'
import { useAuth } from '../../contexts/AuthContext'
import StatCard from '../common/StatCard'
import QuickActionCard from '../common/QuickActionCard'

const Profile = () => {
  const { user, loading } = useAuth()
  
  // Dati di esempio per le statistiche
  const stats = {
    totalWorkouts: 0,
    totalExercises: 3,
    mostUsedEquipment: '-',
    favoriteBodyPart: 'braccia'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500 rounded-full p-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.email}</h1>
            <p className="text-gray-600">Membro dal {new Date(user.created_at).toLocaleDateString('it-IT')}</p>
          </div>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Allenamenti Totali"
          value={stats.totalWorkouts}
          Icon={Activity}
        />
        <StatCard
          title="Esercizi Configurati"
          value={stats.totalExercises}
          Icon={FileText}
        />
        <StatCard
          title="Attrezzo Più Usato"
          value={stats.mostUsedEquipment}
          Icon={Tool}
        />
        <StatCard
          title="Parte del Corpo Preferita"
          value={stats.favoriteBodyPart}
          Icon={Target}
        />
      </div>

      {/* Azioni rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickActionCard
          title="Inizia Allenamento"
          description="Avvia una nuova sessione di allenamento"
          Icon={Play}
          link="/workout"
        />
        <QuickActionCard
          title="Modifica Routine"
          description="Personalizza il tuo programma di allenamento"
          Icon={Edit}
          link="/planner"
        />
      </div>
    </div>
  )
}

export default Profile 