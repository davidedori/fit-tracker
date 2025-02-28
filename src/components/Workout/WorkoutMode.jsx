import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import ExerciseGuide from './ExerciseGuide'
import { dayNames } from '../../constants/days'
import { Award, Calendar } from 'react-feather'
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
      setTimeout(() => {
        setShowCompletionModal(false)
        setCurrentExercise(0)
      }, 3000)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center animate-bounce-in">
            <Award className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Congratulazioni!</h2>
            <p className="text-gray-600">Hai completato l'allenamento di oggi!</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
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
          <ExerciseGuide
            exercise={exercises[currentExercise]}
            onComplete={handleExerciseComplete}
            totalExercises={exercises.length}
            currentExerciseIndex={currentExercise}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Nessun esercizio programmato per {dayNames[currentDay - 1]}</p>
            <p className="text-sm text-gray-500 mb-6">
              Vai al planner per aggiungere degli esercizi a questo giorno
            </p>
            <Link 
              to="/planner" 
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Calendar size={20} />
              Vai al Planner
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkoutMode 