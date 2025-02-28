import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import ExerciseGuide from './ExerciseGuide'
import { dayNames } from '../../constants/days'
import { Award, Calendar, ChevronRight, Clock, Activity, BarChart2, AlertCircle } from 'react-feather'
import Button from '../common/Button'
import { Link } from 'react-router-dom'

const WorkoutMode = () => {
  const [currentDay, setCurrentDay] = useState(new Date().getDay() || 7)
  const [exercises, setExercises] = useState([])
  const [currentExercise, setCurrentExercise] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  useEffect(() => {
    fetchDayExercises()
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

  const handleExerciseComplete = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1)
    } else {
      setShowCompletionModal(true)
    }
  }

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false)
    setCurrentExercise(0)
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

  // Verifica se ci sono esercizi in altri giorni
  const [hasExercisesInOtherDays, setHasExercisesInOtherDays] = useState(false)
  
  useEffect(() => {
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
    
    checkOtherDays()
  }, [currentDay])

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* Header con titolo e selettore giorno */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">Allenamento</h1>
          <select
            value={currentDay}
            onChange={(e) => setCurrentDay(Number(e.target.value))}
            className="px-3 py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <BarChart2 size={20} className="mr-2 text-blue-500" />
                Panoramica dell'allenamento
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity size={20} className="text-blue-500" />
                  <span className="font-medium">{exercises.length} esercizi totali</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" />
                  <span className="font-medium">Durata stimata: ~{calculateEstimatedTime()} min</span>
                </div>
              </div>
            </div>
            
            {/* Indicatore di progresso migliorato con segmenti separati - solo blu */}
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Esercizio {currentExercise + 1} di {exercises.length}
              </p>
              
              {/* Barra di progresso segmentata */}
              <div className="flex w-full h-4 mb-2 gap-1">
                {exercises.map((_, index) => (
                  <div 
                    key={index}
                    className={`flex-1 rounded-md relative
                      ${index < currentExercise ? 'bg-blue-400' : 
                        index === currentExercise ? 'bg-blue-600 animate-pulse' : 
                        'bg-gray-200'}`}
                  >
                    <div 
                      className={`absolute inset-0 flex items-center justify-center text-xs font-medium
                        ${index <= currentExercise ? 'text-white' : 'text-gray-600'}`}
                    >
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sezione esercizio corrente */}
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-4">Esercizio corrente</h2>
              <ExerciseGuide
                exercise={exercises[currentExercise]}
                onComplete={handleExerciseComplete}
                totalExercises={exercises.length}
                currentExerciseIndex={currentExercise}
              />
            </div>
          </>
        ) : loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento esercizi...</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Nessun esercizio per {dayNames[currentDay - 1]}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Non hai programmato alcun esercizio per questo giorno. Puoi selezionare un altro giorno o aggiungere nuovi esercizi.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {hasExercisesInOtherDays && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 sm:mb-0 sm:mr-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Calendar size={18} className="mr-2 text-blue-500" />
                    Seleziona un altro giorno
                  </h4>
                  <select
                    value={currentDay}
                    onChange={(e) => setCurrentDay(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Modale di completamento */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <div className="mb-4">
              <Award size={60} className="mx-auto text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Allenamento Completato!</h3>
            <p className="text-gray-600 mb-6">Hai completato tutti gli esercizi di oggi.</p>
            <Link to="/">
              <Button 
                onClick={handleCloseCompletionModal}
                variant="primary" 
                fullWidth
              >
                Torna alla Home
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutMode 