import React, { useState, useEffect } from 'react'
import { User, Activity, FileText, Tool, Target, Play, Edit, LogOut, BarChart2 } from 'react-feather'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import StatCard from '../common/StatCard'
import QuickActionCard from '../common/QuickActionCard'
import { PlayCircle, ArrowRight, Calendar } from 'react-feather'
import { dayNames } from '../../constants/days'
import { Link } from 'react-router-dom'

const Profile = () => {
  const { user, loading, signOut } = useAuth()
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalExercises: 0,
    mostUsedEquipment: '-',
    favoriteBodyPart: '-'
  })
  const [todayWorkout, setTodayWorkout] = useState({
    exerciseCount: 0,
    estimatedDuration: 0
  })
  const [hasAnyExercises, setHasAnyExercises] = useState(true)
  const [loadingData, setLoadingData] = useState(true)

  const currentDay = new Date().getDay() || 7

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      try {
        // Carica gli esercizi di oggi
        const { data: todayExercises } = await supabase
          .from('exercises')
          .select('*')
          .eq('day_of_week', currentDay)

        if (todayExercises) {
          const totalDuration = todayExercises.reduce((acc, ex) => {
            const exerciseDuration = ex.mode === 'timer' 
              ? parseInt(ex.duration) 
              : (parseInt(ex.sets) * parseInt(ex.reps) * 3) // stima 3 secondi per rep
            const restDuration = parseInt(ex.rest) * (parseInt(ex.sets) - 1)
            return acc + exerciseDuration + restDuration
          }, 0)

          setTodayWorkout({
            exerciseCount: todayExercises.length,
            estimatedDuration: Math.ceil(totalDuration / 60) // converti in minuti
          })
        }

        // Carica tutte le statistiche
        const { data: allExercises } = await supabase
          .from('exercises')
          .select('*')

        if (allExercises) {
          const equipmentCount = {}
          const bodyPartCount = {}
          
          allExercises.forEach(ex => {
            if (ex.equipment) equipmentCount[ex.equipment] = (equipmentCount[ex.equipment] || 0) + 1
            if (ex.body_part) bodyPartCount[ex.body_part] = (bodyPartCount[ex.body_part] || 0) + 1
          })

          const mostUsed = Object.entries(equipmentCount).sort((a, b) => b[1] - a[1])[0]
          const favorite = Object.entries(bodyPartCount).sort((a, b) => b[1] - a[1])[0]

          setStats({
            totalWorkouts: 0, // TODO: implementare il conteggio degli allenamenti completati
            totalExercises: allExercises.length,
            mostUsedEquipment: mostUsed ? mostUsed[0] : '-',
            favoriteBodyPart: favorite ? favorite[0] : '-'
          })
          
          // Verifica se ci sono esercizi in qualsiasi giorno
          setHasAnyExercises(allExercises.length > 0)
        }

        // Carica il conteggio degli allenamenti completati
        const { data: workoutLogs, error: workoutError } = await supabase
          .from('workout_logs')
          .select('id');

        if (!workoutError) {
          setStats(prevStats => ({
            ...prevStats,
            totalWorkouts: workoutLogs.length
          }));
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error)
      }
      setLoadingData(false)
    }

    fetchData()
  }, [currentDay])

  if (loading || loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con icona utente e pulsante logout */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-gray-400" />
          <h1 className="text-2xl font-bold truncate" title={user.email}>
            {user.email}
          </h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm ml-2"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
      </div>

      {/* Box allenamento di oggi o pianificazione */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          {!hasAnyExercises ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold">Pianifica i tuoi allenamenti</h2>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Inizia a configurare la tua routine settimanale di allenamento
                </p>
                <Link 
                  to="/planner"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
                >
                  Pianifica <ArrowRight size={18} />
                </Link>
              </div>
            </>
          ) : todayWorkout.exerciseCount > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-full">
                  <PlayCircle className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold">Allenamento di oggi</h2>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-gray-600">{todayWorkout.exerciseCount} esercizi programmati</p>
                  <p className="text-sm text-gray-500">
                    Durata stimata: {todayWorkout.estimatedDuration} minuti
                  </p>
                </div>
                <Link 
                  to="/workout"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
                >
                  Inizia <ArrowRight size={18} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold">Nessun allenamento oggi</h2>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Non hai esercizi programmati per oggi, ma hai configurato altri giorni
                </p>
                <Link 
                  to="/planner"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
                >
                  Modifica <ArrowRight size={18} />
                </Link>
              </div>
            </>
          )}
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
        <QuickActionCard
          title="Storico Allenamenti"
          description="Visualizza i tuoi allenamenti completati"
          Icon={BarChart2}
          link="/history"
        />
      </div>
    </div>
  )
}

export default Profile 