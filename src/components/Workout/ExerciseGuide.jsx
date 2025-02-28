import React, { useState, useEffect } from 'react'
import Button from '../common/Button'

const ExerciseGuide = ({ exercise, onComplete, totalExercises, currentExerciseIndex }) => {
  if (!exercise) {
    return (
      <div className="bg-white rounded-lg p-6 flex justify-center items-center">
        <span className="text-gray-500">Caricamento esercizio...</span>
      </div>
    )
  }

  const [timer, setTimer] = useState(exercise.mode === 'timer' ? exercise.duration : exercise.rest)
  const [isResting, setIsResting] = useState(false)
  const [currentSet, setCurrentSet] = useState(1)
  const [isActive, setIsActive] = useState(false)
  const [showNextExercise, setShowNextExercise] = useState(false)
  const [transitionTimer, setTransitionTimer] = useState(3)

  useEffect(() => {
    setTimer(exercise.mode === 'timer' ? exercise.duration : exercise.rest)
    setIsResting(false)
    setCurrentSet(1)
    setIsActive(false)
    setShowNextExercise(false)
  }, [exercise])

  useEffect(() => {
    let interval
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
    } else if (timer === 0) {
      if (isResting) {
        setIsResting(false)
        setTimer(exercise.mode === 'timer' ? exercise.duration : exercise.rest)
        if (currentSet < exercise.sets && exercise.mode === 'reps') {
          setCurrentSet(prev => prev + 1)
        } else {
          startTransition()
        }
      } else if (exercise.mode === 'timer') {
        startTransition()
      }
      setIsActive(false)
    }
    return () => clearInterval(interval)
  }, [isActive, timer, isResting])

  useEffect(() => {
    let interval
    if (showNextExercise && transitionTimer > 0) {
      interval = setInterval(() => {
        setTransitionTimer(prev => prev - 1)
      }, 1000)
    } else if (showNextExercise && transitionTimer === 0) {
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

  if (showNextExercise) {
    return (
      <div className="bg-white rounded-lg p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Esercizio Completato! 🎉</h2>
          <p className="text-lg mb-4">
            {currentExerciseIndex + 1 < totalExercises 
              ? "Preparati per il prossimo esercizio"
              : "Ultimo esercizio completato!"}
          </p>
          <p className="text-4xl font-bold text-blue-500">{transitionTimer}</p>
          <Button
            onClick={onComplete}
            variant="outline"
            className="mt-4"
          >
            Salta attesa
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{exercise.name}</h2>
        <span className="text-gray-500">
          Esercizio {currentExerciseIndex + 1} di {totalExercises}
        </span>
      </div>

      {exercise.equipment && (
        <p className="text-gray-600">
          <span className="font-medium">Attrezzi:</span> {exercise.equipment}
        </p>
      )}

      {exercise.body_part && (
        <p className="text-gray-600">
          <span className="font-medium">Gruppo muscolare:</span> {exercise.body_part}
        </p>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        {exercise.mode === 'timer' ? (
          <div className="text-center">
            <p className="text-4xl font-bold mb-4">{formatTime(timer)}</p>
            <Button
              onClick={() => setIsActive(!isActive)}
              variant={isActive ? 'danger' : 'primary'}
              className="w-full"
            >
              {isActive ? 'Pausa' : 'Inizia'}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-2">Serie {currentSet} di {exercise.sets}</p>
            <p className="text-4xl font-bold mb-4">{exercise.reps} ripetizioni</p>
            {isResting ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xl mb-2">Riposo</p>
                  <p className="text-3xl font-bold">{formatTime(timer)}</p>
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
              <Button onClick={handleSetComplete} variant="primary" className="w-full">
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
          className="w-full"
        >
          Salta Esercizio
        </Button>
      )}
    </div>
  )
}

export default ExerciseGuide 