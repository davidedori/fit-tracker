import React, { useState, useEffect } from 'react'
import Button from '../common/Button'
import { Clock, RefreshCw, Award, ChevronRight, Tool, Activity } from 'react-feather'

const ExerciseGuide = ({ exercise, onComplete, totalExercises, currentExerciseIndex }) => {
  if (!exercise) {
    return (
      <div className="bg-white rounded-lg p-6 flex justify-center items-center">
        <span className="text-gray-500">Caricamento esercizio...</span>
      </div>
    )
  }

  const [timer, setTimer] = useState(exercise.mode === 'timer' ? exercise.duration : exercise.rest)
  const [isActive, setIsActive] = useState(false)
  const [currentSet, setCurrentSet] = useState(1)
  const [isResting, setIsResting] = useState(false)
  const [showNextExercise, setShowNextExercise] = useState(false)
  const [transitionTimer, setTransitionTimer] = useState(3)

  useEffect(() => {
    setTimer(exercise.mode === 'timer' ? exercise.duration : exercise.rest)
    setIsActive(false)
    setCurrentSet(1)
    setIsResting(false)
    setShowNextExercise(false)
  }, [exercise])

  useEffect(() => {
    let interval = null
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1)
      }, 1000)
    } else if (isActive && timer === 0) {
      setIsActive(false)
      if (exercise.mode === 'timer') {
        onComplete()
      } else if (isResting) {
        setIsResting(false)
        if (currentSet < exercise.sets) {
          setCurrentSet(prev => prev + 1)
        } else {
          startTransition()
        }
      }
    }
    return () => clearInterval(interval)
  }, [isActive, timer, exercise.mode, isResting])

  useEffect(() => {
    let interval = null
    if (showNextExercise && transitionTimer > 0) {
      interval = setInterval(() => {
        setTransitionTimer(timer => timer - 1)
      }, 1000)
    } else if (showNextExercise && transitionTimer === 0) {
      setShowNextExercise(false)
      onComplete()
    }
    return () => clearInterval(interval)
  }, [showNextExercise, transitionTimer])

  const startTransition = () => {
    setShowNextExercise(true)
    setTransitionTimer(3)
  }

  const handleSetComplete = () => {
    if (currentSet < exercise.sets) {
      setIsResting(true)
      setTimer(exercise.rest)
      setIsActive(true)
    } else {
      startTransition()
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getBodyPartColor = () => {
    const colors = {
      'braccia': 'bg-blue-50 text-blue-600',
      'gambe': 'bg-green-50 text-green-600',
      'core': 'bg-yellow-50 text-yellow-600',
      'schiena': 'bg-purple-50 text-purple-600',
      'spalle': 'bg-red-50 text-red-600',
      'default': 'bg-gray-50 text-gray-600'
    }
    return colors[exercise.body_part] || colors.default
  }

  if (showNextExercise) {
    return (
      <div className="bg-white rounded-lg p-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Award className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Esercizio Completato! 🎉</h2>
          <p className="text-lg mb-4">
            {currentExerciseIndex + 1 < totalExercises 
              ? "Preparati per il prossimo esercizio"
              : "Ultimo esercizio completato!"}
          </p>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto my-4 sm:my-6">
            <p className="text-3xl sm:text-4xl font-bold text-blue-500">{transitionTimer}</p>
          </div>
          <Button
            onClick={onComplete}
            variant="outline"
            className="mt-4"
          >
            Salta attesa <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{exercise.name}</h2>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          {currentExerciseIndex + 1}/{totalExercises}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {exercise.body_part && (
          <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${getBodyPartColor()}`}>
            <Activity size={14} />
            {exercise.body_part}
          </span>
        )}
        
        {exercise.equipment && (
          <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-1">
            <Tool size={14} />
            {exercise.equipment}
          </span>
        )}
      </div>

      {exercise.description && (
        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
          {exercise.description}
        </p>
      )}

      <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
        {exercise.mode === 'timer' ? (
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Clock size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-500">Modalità Timer</span>
            </div>
            
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <p className="text-3xl sm:text-4xl font-bold text-blue-700">{formatTime(timer)}</p>
            </div>
            
            <Button
              onClick={() => setIsActive(!isActive)}
              variant={isActive ? 'danger' : 'primary'}
              className="w-full text-lg py-3"
            >
              {isActive ? 'Pausa' : 'Inizia'}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <RefreshCw size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-500">Modalità Ripetizioni</span>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="bg-blue-100 rounded-full px-4 py-2">
                <p className="text-sm text-blue-800 font-medium">Serie {currentSet} di {exercise.sets}</p>
              </div>
              
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <p className="text-3xl font-bold text-blue-700">{exercise.reps}</p>
              </div>
              
              <div className="bg-blue-100 rounded-full px-4 py-2">
                <p className="text-sm text-blue-800 font-medium">Ripetizioni</p>
              </div>
            </div>
            
            {isResting ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-xl mb-2 text-yellow-700">Riposo</p>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{formatTime(timer)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setIsResting(false)
                    setTimer(exercise.mode === 'timer' ? exercise.duration : exercise.rest)
                    if (currentSet < exercise.sets) {
                      setCurrentSet(prev => prev + 1)
                    } else {
                      startTransition()
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Salta riposo
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleSetComplete} 
                variant="primary" 
                className="w-full text-lg py-3"
              >
                Serie Completata
              </Button>
            )}
          </div>
        )}
      </div>

      {!isResting && (
        <Button
          onClick={onComplete}
          variant="outline"
          className="w-full mt-2"
        >
          Salta Esercizio
        </Button>
      )}
    </div>
  )
}

export default ExerciseGuide 