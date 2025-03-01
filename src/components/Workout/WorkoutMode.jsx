import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import ExerciseGuide from './ExerciseGuide'
import { dayNames } from '../../constants/days'
import { Award, Calendar, ChevronRight, Clock, Activity, BarChart2, AlertCircle, Check } from 'react-feather'
import Button from '../common/Button'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const WorkoutMode = () => {
  const { user } = useAuth()
  const [currentDay, setCurrentDay] = useState(new Date().getDay() || 7)
  const [exercises, setExercises] = useState([])
  const [currentExercise, setCurrentExercise] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [hasExercisesInOtherDays, setHasExercisesInOtherDays] = useState(false)
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [workoutCompleted, setWorkoutCompleted] = useState(false)
  
  // Blocca lo scroll del body quando il modale è aperto
  useEffect(() => {
    if (showCompletionModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    // Cleanup quando il componente viene smontato
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [showCompletionModal])

  useEffect(() => {
    fetchDayExercises()
    checkOtherDays()
  }, [currentDay])

  const fetchDayExercises = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('day_of_week', currentDay)
      .order('order_index')

    if (!error && data) {
      const processedExercises = data.map(exercise => ({
        ...exercise,
        duration: exercise.mode === 'timer' ? (parseInt(exercise.duration) || 0) : 0,
        sets: exercise.mode === 'reps' ? (parseInt(exercise.sets) || 3) : 0,
        reps: exercise.mode === 'reps' ? (parseInt(exercise.reps) || 10) : 0,
        rest: parseInt(exercise.rest) || 0
      }))
      setExercises(processedExercises)
      setCurrentExercise(0)
    }
    setLoading(false)
  }
  
  const checkOtherDays = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('day_of_week')
      .neq('day_of_week', currentDay)
      
    if (!error && data && data.length > 0) {
      setHasExercisesInOtherDays(true)
    } else {
      setHasExercisesInOtherDays(false)
    }
  }

  const handleWorkoutComplete = () => {
    // Mostra il modale di completamento senza salvare subito
    setWorkoutCompleted(true)
    setShowCompletionModal(true)
  }

  const handleSaveWorkout = async () => {
    try {
      // Verifica che l'utente sia definito
      if (!user) {
        console.error('Utente non autenticato')
        return
      }

      // Registra l'allenamento completato nel database
      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          completed_at: new Date().toISOString(),
          day_of_week: currentDay,
          exercise_count: exercises.length,
          duration_minutes: calculateEstimatedTime(),
          notes: workoutNotes.trim()
        })
        
      if (error) throw error
      console.log('Allenamento registrato con successo')
    } catch (error) {
      console.error('Errore durante la registrazione dell\'allenamento:', error)
    }
  }

  const handleExerciseComplete = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1)
    } else {
      handleWorkoutComplete()
    }
  }

  const handleCloseCompletionModal = async () => {
    // Se l'allenamento è stato completato ma non ancora salvato, salvalo
    if (workoutCompleted) {
      await handleSaveWorkout()
      setWorkoutCompleted(false)
    }
    
    setShowCompletionModal(false)
    setCurrentExercise(0)
    setWorkoutNotes('')
  }

  // Calcola il tempo totale stimato dell'allenamento
  const calculateEstimatedTime = () => {
    if (!exercises.length) return 0
    
    const totalSeconds = exercises.reduce((total, ex) => {
      let exerciseTime = 0
      if (ex.mode === 'timer') {
        exerciseTime = ex.duration
      } else {
        exerciseTime = ex.sets * ex.reps * 3 // stima 3 secondi per rep
      }
      const restTime = ex.rest * (ex.sets - 1)
      return total + exerciseTime + restTime
    }, 0)
    
    return Math.ceil(totalSeconds / 60)
  }

  // Gestione del tocco per i modali
  const handleModalTouchMove = (e) => {
    // Previene lo scroll del body ma consente lo scroll all'interno del modale
    e.stopPropagation()
  }

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-4 sm:mb-6">
        {/* Header con titolo e selettore giorno */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Allenamento</h1>
          <select
            value={currentDay}
            onChange={(e) => setCurrentDay(Number(e.target.value))}
            className="px-2 py-1 sm:px-3 sm:py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            {dayNames.map((day, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1 === new Date().getDay() ? `${day} (Oggi)` : day}
              </option>
            ))}
          </select>
        </div>

        {exercises.length > 0 ? (
          <>
            {/* Sezione informazioni generali dell'allenamento */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
                <BarChart2 size={18} className="mr-2 text-blue-500" />
                Panoramica dell'allenamento
              </h2>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-blue-500" />
                  <span className="font-medium">{exercises.length} esercizi totali</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-blue-500" />
                  <span className="font-medium">Durata: ~{calculateEstimatedTime()} min</span>
                </div>
              </div>
            </div>
            
            {/* Indicatore di progresso migliorato con segmenti separati - solo blu */}
            <div className="mb-4 sm:mb-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                Esercizio {currentExercise + 1} di {exercises.length}
              </p>
              
              {/* Barra di progresso segmentata - ottimizzata per mobile */}
              <div className="flex w-full h-3 sm:h-4 mb-1 sm:mb-2 gap-1">
                {exercises.map((_, index) => (
                  <div 
                    key={index}
                    className={`flex-1 rounded-md relative
                      ${index < currentExercise ? 'bg-blue-400' : 
                        index === currentExercise ? 'bg-blue-600 animate-pulse' : 
                        'bg-gray-200'}`}
                  >
                    {/* Mostra i numeri solo su schermi più grandi o se sono pochi esercizi */}
                    {(exercises.length <= 8 || window.innerWidth >= 640) && (
                      <div 
                        className={`absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-medium
                          ${index <= currentExercise ? 'text-white' : 'text-gray-600'}`}
                      >
                        {index + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sezione esercizio corrente */}
            <div className="border-t pt-3 sm:pt-4">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Esercizio corrente</h2>
              <ExerciseGuide
                exercise={exercises[currentExercise]}
                onComplete={handleExerciseComplete}
                totalExercises={exercises.length}
                currentExerciseIndex={currentExercise}
              />
            </div>
          </>
        ) : loading ? (
          <div className="text-center py-8 sm:py-10">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600">Caricamento esercizi...</p>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Nessun esercizio per {dayNames[currentDay - 1]}</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
              Non hai programmato alcun esercizio per questo giorno. Puoi selezionare un altro giorno o aggiungere nuovi esercizi.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {hasExercisesInOtherDays && (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-0 sm:mr-4">
                  <h4 className="text-sm sm:text-base font-medium mb-2 flex items-center">
                    <Calendar size={16} className="mr-2 text-blue-500" />
                    Seleziona un altro giorno
                  </h4>
                  <select
                    value={currentDay}
                    onChange={(e) => setCurrentDay(Number(e.target.value))}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {dayNames.map((day, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1 === new Date().getDay() ? `${day} (Oggi)` : day}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <Link to="/planner">
                  <Button variant="primary" fullWidth>
                    Vai al planner
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  Aggiungi esercizi alla tua routine
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modale di completamento - migliorato per touch */}
      {showCompletionModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300]"
          onTouchMove={handleModalTouchMove}
        >
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Allenamento Completato!</h2>
              <p className="text-center text-gray-600 mb-6">
                Hai completato tutti gli esercizi programmati per oggi.
              </p>
              
              {/* Campo note */}
              <div className="mb-6">
                <label htmlFor="workout-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Note sull'allenamento (opzionale)
                </label>
                <textarea
                  id="workout-notes"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Come ti sei sentito? Qualcosa da ricordare?"
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                ></textarea>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCloseCompletionModal}
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Salva e torna alla Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutMode 