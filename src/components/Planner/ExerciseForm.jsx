import React, { useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../common/Input'
import Button from '../common/Button'
import { 
  Clock, 
  RefreshCw,
  Activity,
  Anchor,
  Shield,
  Box,
  Heart
} from 'react-feather'

const ExerciseForm = ({ day, onSave, initialData = null, externalUserId = null }) => {
  const { user } = useAuth()
  const [exercise, setExercise] = useState(() => {
    const defaultState = {
      user_id: externalUserId || user.id,
      name: '',
      equipment: '',
      body_part: '',
      type: 'strength',
      description: '',
      mode: 'reps',
      sets: 3,
      reps: 10,
      duration: 0,
      rest: 0,
      order_index: 0,
      day_of_week: day
    }

    if (initialData) {
      return {
        ...defaultState,
        ...initialData,
        body_part: initialData.body_part || '',
        duration: initialData.mode === 'timer' ? parseInt(initialData.duration) || 0 : 0,
        sets: initialData.mode === 'reps' ? parseInt(initialData.sets) || 0 : defaultState.sets,
        reps: initialData.mode === 'reps' ? parseInt(initialData.reps) || 0 : defaultState.reps,
        rest: parseInt(initialData.rest) || 0
      }
    }
    
    return defaultState
  })

  console.log('Initial data received:', initialData)
  console.log('Initial exercise state:', exercise)

  const bodyParts = [
    { value: 'braccia', label: 'Braccia', icon: Activity },
    { value: 'gambe', label: 'Gambe', icon: Anchor },
    { value: 'core', label: 'Core', icon: Shield },
    { value: 'schiena', label: 'Schiena', icon: Box },
    { value: 'spalle', label: 'Spalle', icon: Heart }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Assicuriamoci che day_of_week sia impostato correttamente
    const exerciseToSave = {
      ...exercise,
      day_of_week: day
    }
    
    onSave(exerciseToSave)
  }

  const handleModeChange = (mode) => {
    setExercise({
      ...exercise,
      mode
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Nome esercizio:
        </label>
        <Input
          value={exercise.name}
          onChange={(e) => setExercise({
            ...exercise,
            name: e.target.value
          })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Descrizione (opzionale):
        </label>
        <textarea
          value={exercise.description}
          onChange={(e) => setExercise({
            ...exercise,
            description: e.target.value
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Gruppo muscolare:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {bodyParts.map((part) => {
            const Icon = part.icon
            return (
              <button
                key={part.value}
                type="button"
                onClick={() => setExercise({
                  ...exercise,
                  body_part: part.value
                })}
                className={`flex flex-col items-center justify-center p-2 border rounded-md ${
                  exercise.body_part === part.value
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className={exercise.body_part === part.value ? 'text-blue-500' : 'text-gray-500'} />
                <span className="text-xs mt-1">{part.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Attrezzatura (opzionale):
        </label>
        <Input
          value={exercise.equipment}
          onChange={(e) => setExercise({
            ...exercise,
            equipment: e.target.value
          })}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Modalità:</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            onClick={() => handleModeChange('timer')}
            variant={exercise.mode === 'timer' ? 'primary' : 'outline'}
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <Clock size={16} />
            Timer
          </Button>
          <Button
            type="button"
            onClick={() => handleModeChange('reps')}
            variant={exercise.mode === 'reps' ? 'primary' : 'outline'}
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Ripetizioni
          </Button>
        </div>
      </div>

      {exercise.mode === 'timer' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Durata (secondi):
          </label>
          <Input
            type="number"
            min="0"
            value={exercise.duration}
            onChange={(e) => setExercise({
              ...exercise,
              duration: parseInt(e.target.value) || 0
            })}
            required={exercise.mode === 'timer'}
          />
        </div>
      )}

      {exercise.mode === 'reps' && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Serie:
            </label>
            <Input
              type="number"
              min="1"
              value={exercise.sets}
              onChange={(e) => setExercise({
                ...exercise,
                sets: parseInt(e.target.value) || 1
              })}
              required={exercise.mode === 'reps'}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ripetizioni:
            </label>
            <Input
              type="number"
              min="1"
              value={exercise.reps}
              onChange={(e) => setExercise({
                ...exercise,
                reps: parseInt(e.target.value) || 1
              })}
              required={exercise.mode === 'reps'}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tempo di riposo tra le serie (secondi):
        </label>
        <Input
          type="number"
          min="0"
          value={exercise.rest}
          onChange={(e) => setExercise({
            ...exercise,
            rest: parseInt(e.target.value) || 0
          })}
        />
      </div>

      <Button type="submit" variant="primary" fullWidth>
        {initialData ? 'Aggiorna esercizio' : 'Aggiungi esercizio'}
      </Button>
    </form>
  )
}

export default ExerciseForm 