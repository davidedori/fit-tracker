import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { dayNames } from '../../constants/days'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Activity, 
  Clock, 
  RefreshCw, 
  Mail, 
  Calendar as CalendarIcon
} from 'react-feather'
import WeeklyPlanner from '../Planner/WeeklyPlanner'
import Button from '../common/Button'

const ClientPlanner = () => {
  const { clientId } = useParams()
  const { user, isTrainer } = useAuth()
  const navigate = useNavigate()
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    plannedDays: 0,
    totalExercises: 0,
    weeklyTime: 0,
    mostUsedEquipment: '',
    mostTrainedBodyPart: ''
  })

  useEffect(() => {
    if (isTrainer && clientId) {
      fetchClientData()
    }
  }, [clientId, isTrainer])

  const fetchClientData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Recupera i dati del profilo utente
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (profileError) {
        console.error('Errore nel recupero profilo:', profileError)
        setError(`Errore profilo: ${profileError.message}`)
        setLoading(false)
        return
      }
      
      // Recupera l'email dell'utente
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_email', { user_id: clientId })
      
      if (emailError) {
        console.error('Errore nel recupero email:', emailError)
      } else if (emailData && emailData.length > 0) {
        profileData.email = emailData[0].email
      }
      
      // Recupera gli esercizi del cliente
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', clientId)
        .order('day_of_week', { ascending: true })
        .order('order_index', { ascending: true })
      
      if (exercisesError) {
        console.error('Errore nel recupero esercizi:', exercisesError)
        setError(`Errore esercizi: ${exercisesError.message}`)
        setLoading(false)
        return
      }
      
      // Recupera i log di allenamento
      const { data: logsData, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (logsError) {
        console.error('Errore nel recupero log:', logsError)
      }
    
      setClientData({
        profile: profileData,
        exercises: exercisesData || [],
        logs: logsData || []
      })
      
      // Calcola le statistiche
      const plannedDays = new Set(exercisesData.map(e => e.day_of_week)).size
      const totalExercises = exercisesData.length
      
      // Calcola l'attrezzatura più utilizzata
      const equipmentCount = {}
      exercisesData.forEach(ex => {
        if (ex.equipment) {
          equipmentCount[ex.equipment] = (equipmentCount[ex.equipment] || 0) + 1
        }
      })
      
      const mostUsedEquipment = Object.entries(equipmentCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)[0] || 'Nessuna'
      
      // Calcola la parte del corpo più allenata
      const bodyPartCount = {}
      exercisesData.forEach(ex => {
        if (ex.body_part) {
          bodyPartCount[ex.body_part] = (bodyPartCount[ex.body_part] || 0) + 1
        }
      })
      
      const mostTrainedBodyPart = Object.entries(bodyPartCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)[0] || 'Nessuna'
      
      // Stima del tempo settimanale
      let weeklyTime = 0
      exercisesData.forEach(ex => {
        if (ex.mode === 'timer') {
          weeklyTime += parseInt(ex.duration) || 0
        } else {
          // Stima per esercizi a ripetizioni (30 secondi per serie)
          weeklyTime += (parseInt(ex.sets) || 0) * 30
        }
        // Aggiungi il tempo di riposo
        weeklyTime += (parseInt(ex.sets) || 1) * (parseInt(ex.rest) || 0)
      })
      
      // Converti in minuti
      weeklyTime = Math.ceil(weeklyTime / 60)
      
      setStats({
        plannedDays,
        totalExercises,
        weeklyTime,
        mostUsedEquipment,
        mostTrainedBodyPart
      })
    } catch (e) {
      console.error('Errore nel recupero dati cliente:', e)
      setError(`Errore: ${e.message}`)
    }
    
    setLoading(false)
  }

  const getDayName = (dayIndex) => {
    return dayNames[dayIndex] || 'Sconosciuto'
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchClientData}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => navigate('/trainer/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-1" /> Torna alla lista clienti
        </button>
      </div>

      {clientData && (
        <>
          {/* Scheda cliente */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {clientData.profile.nome} {clientData.profile.cognome}
                  </h1>
                  <div className="flex items-center text-gray-600 mt-1">
                    <Mail size={14} className="mr-1" />
                    <span>{clientData.profile.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mt-1">
                    <CalendarIcon size={14} className="mr-1" />
                    <span>Registrato il {new Date(clientData.profile.created_at).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistiche */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-full mr-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Giorni Pianificati</h3>
                  <p className="text-2xl font-bold">{stats.plannedDays}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-full mr-3">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Esercizi Totali</h3>
                  <p className="text-2xl font-bold">{stats.totalExercises}</p>
                </div>
              </div>
            </div>
            
            {clientData.logs && clientData.logs.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:col-span-2">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-50 rounded-full mr-3">
                    <Clock className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Ultimo Allenamento</h3>
                    <p className="text-lg font-bold">
                      {new Date(clientData.logs[0].completed_at).toLocaleDateString('it-IT')} - 
                      {getDayName(clientData.logs[0].day_of_week)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                Panoramica
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'planner'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('planner')}
              >
                Piano di Allenamento
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {activeTab === 'overview' ? (
                <div className="p-6 space-y-8">
                  {/* Tabella esercizi */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Esercizi Programmati</h3>
                    
                    {clientData.exercises.length === 0 ? (
                      <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
                        Nessun esercizio programmato per questo cliente.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Giorno
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Esercizio
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dettagli
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Parte del Corpo
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {clientData.exercises.map((exercise) => (
                              <tr key={exercise.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {dayNames[exercise.day_of_week - 1]}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-medium text-gray-900">{exercise.name}</div>
                                  <div className="text-sm text-gray-500">{exercise.equipment}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {exercise.mode === 'reps' ? (
                                    <span>{exercise.sets} serie × {exercise.reps} ripetizioni</span>
                                  ) : (
                                    <span>Timer: {exercise.duration}s</span>
                                  )}
                                  {exercise.rest > 0 && <span className="text-gray-500"> • {exercise.rest}s pausa</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {exercise.body_part || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  
                  {/* Ultimi allenamenti */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Ultimi Allenamenti</h3>
                    
                    {clientData.logs.length === 0 ? (
                      <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
                        Nessun allenamento registrato da questo cliente.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clientData.logs.map(log => (
                          <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-bold">{getDayName(log.day_of_week)}</p>
                                <p className="text-gray-600">
                                  {new Date(log.completed_at).toLocaleDateString('it-IT')} - 
                                  {new Date(log.completed_at).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <Clock className="text-gray-400 mr-1" size={16} />
                                <span>{log.duration_minutes} min</span>
                                <Activity className="text-gray-400 ml-3 mr-1" size={16} />
                                <span>{log.exercise_count} esercizi</span>
                              </div>
                            </div>
                            {log.notes && (
                              <div className="mt-2 bg-gray-50 p-2 rounded">
                                <p className="text-sm text-gray-700">{log.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <WeeklyPlanner externalUserId={clientId} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ClientPlanner