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

const ExerciseForm = ({ day, onSave, initialData = null }) => {
  const { user } = useAuth()
  const [exercise, setExercise] = useState(() => {
    const defaultState = {
      id: '',
      user_id: user.id,
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
      order_index: 0
    }

    if (initialData) {
      return {
        ...defaultState,
        ...initialData,
        id: initialData.id,
        user_id: initialData.user_id,
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const exerciseData = {
        ...exercise,
        id: exercise.id,
        user_id: exercise.user_id,
        day_of_week: day,
        body_part: exercise.body_part || '',
        mode: exercise.mode,
        duration: exercise.mode === 'timer' ? Math.max(0, parseInt(exercise.duration) || 0) : 0,
        sets: exercise.mode === 'reps' ? Math.max(0, parseInt(exercise.sets) || 3) : 0,
        reps: exercise.mode === 'reps' ? Math.max(0, parseInt(exercise.reps) || 10) : 0,
        rest: Math.max(0, parseInt(exercise.rest) || 0),
      }
      console.log('Data being sent from form:', exerciseData)
      onSave(exerciseData)
    } catch (error) {
      console.error('Errore durante il salvataggio:', error)
    }
  }

  const handleBodyPartSelect = (e, value) => {
    e.preventDefault()
    setExercise({...exercise, body_part: value})
  }

  const handleModeChange = (newMode) => {
    console.log('Changing mode to:', newMode)
    console.log('Current exercise state:', exercise)
    setExercise(prev => {
      const updated = {
        ...prev,
        mode: newMode,
        duration: newMode === 'timer' ? prev.duration : 0,
        sets: newMode === 'reps' ? prev.sets : 0,
        reps: newMode === 'reps' ? prev.reps : 0
      }
      console.log('Updated exercise state:', updated)
      return updated
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        value={exercise.name}
        onChange={(e) => setExercise({...exercise, name: e.target.value})}
        placeholder="Nome esercizio"
        className="text-xl font-semibold"
        required
      />

      <Input
        type="text"
        value={exercise.equipment}
        onChange={(e) => setExercise({...exercise, equipment: e.target.value})}
        placeholder="Attrezzi necessari"
        label="Attrezzi"
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Seleziona distretto corporeo:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {bodyParts.map(part => {
            const Icon = part.icon
            return (
              <Button
                type="button"
                key={part.value}
                onClick={() => setExercise({...exercise, body_part: part.value})}
                variant={exercise.body_part === part.value ? 'primary' : 'outline'}
                className="flex-col py-3"
              >
                <Icon size={24} className="mb-1" />
                <span className="text-sm">{part.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Modalità:</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleModeChange('timer')}
            variant={exercise.mode === 'timer' ? 'primary' : 'outline'}
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <Clock size={16} />
            Timer
          </Button>
          <Button
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
              min="0"
              value={exercise.sets}
              onChange={(e) => setExercise({
                ...exercise,
                sets: parseInt(e.target.value) || 0
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
              min="0"
              value={exercise.reps}
              onChange={(e) => setExercise({
                ...exercise,
                reps: parseInt(e.target.value) || 0
              })}
              required={exercise.mode === 'reps'}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Riposo (secondi):
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

      <Input
        type="textarea"
        value={exercise.description}
        onChange={(e) => setExercise({...exercise, description: e.target.value})}
        placeholder="Descrizione"
      />

      <Button 
        type="submit" 
        fullWidth 
        className="mt-4"
      >
        {initialData ? 'Modifica' : 'Aggiungi'}
      </Button>
    </form>
  )
}

export default ExerciseForm 