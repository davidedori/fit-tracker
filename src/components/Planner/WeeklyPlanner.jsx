import React, { useState, useEffect } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import DayPlanner from './DayPlanner'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { dayNames } from '../../constants/days'

const WeeklyPlanner = () => {
  const { user } = useAuth()
  const [weeklyRoutine, setWeeklyRoutine] = useState({})
  const [currentDay, setCurrentDay] = useState(1)

  useEffect(() => {
    fetchRoutine()
  }, [])

  const fetchRoutine = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index')
    
    console.log('Data grezza dal DB:', JSON.stringify(data, null, 2))
    
    if (!error) {
      const routineByDay = data.reduce((acc, exercise) => {
        if (!acc[exercise.day_of_week]) acc[exercise.day_of_week] = []
        console.log('Esercizio prima del processing:', JSON.stringify(exercise, null, 2))
        
        // Assicuriamoci che la durata sia mantenuta solo per la modalità timer
        const processedExercise = {
          ...exercise,
          duration: exercise.mode === 'timer' ? (parseInt(exercise.duration) || 0) : 0,
          sets: exercise.mode === 'reps' ? (parseInt(exercise.sets) || 3) : 0,
          reps: exercise.mode === 'reps' ? (parseInt(exercise.reps) || 10) : 0,
          rest: parseInt(exercise.rest) || 0
        }
        
        console.log('Esercizio dopo il processing:', JSON.stringify(processedExercise, null, 2))
        acc[exercise.day_of_week].push(processedExercise)
        return acc
      }, {})
      
      console.log('Routine finale:', JSON.stringify(routineByDay, null, 2))
      setWeeklyRoutine(routineByDay)
    }
  }

  const handleSaveExercise = async (day, exercise) => {
    const updatedRoutine = { ...weeklyRoutine }
    if (!updatedRoutine[day]) updatedRoutine[day] = []
    updatedRoutine[day].push(exercise)
    setWeeklyRoutine(updatedRoutine)
  }

  const handleDuplicate = async (sourceDay, targetDay) => {
    const exercises = weeklyRoutine[sourceDay] || []
    
    for (const exercise of exercises) {
      const { error } = await supabase
        .from('exercises')
        .insert({
          ...exercise,
          id: undefined,
          day_of_week: targetDay,
          user_id: user.id
        })
      if (error) console.error('Errore durante la duplicazione:', error)
    }
    
    await fetchRoutine()
  }

  const handleClear = async (day) => {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('day_of_week', day)
      .eq('user_id', user.id)

    if (!error) {
      const updatedRoutine = { ...weeklyRoutine }
      delete updatedRoutine[day]
      setWeeklyRoutine(updatedRoutine)
    }
  }

  const handleDragEnd = async (result) => {
    const { source, destination } = result
    
    if (!destination) return

    const sourceDay = parseInt(source.droppableId.split('-')[1])
    const destDay = parseInt(destination.droppableId.split('-')[1])
    
    const sourceExercises = [...(weeklyRoutine[sourceDay] || [])]
    const destExercises = sourceDay === destDay ? sourceExercises : [...(weeklyRoutine[destDay] || [])]
    
    const [movedExercise] = sourceExercises.splice(source.index, 1)
    const updatedExercise = {
      ...movedExercise,
      day_of_week: destDay
    }
    destExercises.splice(destination.index, 0, updatedExercise)

    // Aggiorna lo stato locale
    const updatedRoutine = { ...weeklyRoutine }
    updatedRoutine[sourceDay] = sourceExercises
    updatedRoutine[destDay] = destExercises
    setWeeklyRoutine(updatedRoutine)

    // Aggiorna il database
    try {
      // Prima aggiorna l'esercizio spostato
      await supabase
        .from('exercises')
        .update({ 
          day_of_week: destDay,
          order_index: destination.index 
        })
        .eq('id', movedExercise.id)

      // Poi aggiorna gli indici di tutti gli esercizi nel giorno di destinazione
      const updates = destExercises.map((ex, index) => ({
        id: ex.id,
        user_id: ex.user_id,
        day_of_week: destDay,
        order_index: index,
        name: ex.name,
        equipment: ex.equipment || '',
        body_part: ex.body_part || '',
        type: ex.type || 'strength',
        description: ex.description || '',
        mode: ex.mode,
        duration: ex.mode === 'timer' ? parseInt(ex.duration) || 0 : 0,
        sets: ex.mode === 'reps' ? parseInt(ex.sets) || 3 : 0,
        reps: ex.mode === 'reps' ? parseInt(ex.reps) || 10 : 0,
        rest: parseInt(ex.rest) || 0
      }))

      await supabase.from('exercises').upsert(updates)
    } catch (error) {
      console.error('Errore durante il riordinamento:', error)
      await fetchRoutine()
    }
  }

  const handleDeleteExercise = async (exerciseId) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)
        .eq('user_id', user.id)

      if (error) throw error

      // Aggiorna lo stato locale dopo l'eliminazione
      const updatedRoutine = { ...weeklyRoutine }
      Object.keys(updatedRoutine).forEach(day => {
        updatedRoutine[day] = updatedRoutine[day].filter(ex => ex.id !== exerciseId)
      })
      setWeeklyRoutine(updatedRoutine)
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error)
    }
  }

  const formatSecondsToTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEditExercise = async (updatedExercise) => {
    try {
      const exerciseData = {
        ...updatedExercise,
        duration: updatedExercise.mode === 'timer' 
          ? Math.max(0, parseInt(updatedExercise.duration) || 0)
          : 0,
        sets: updatedExercise.mode === 'reps' ? (parseInt(updatedExercise.sets) || 3) : 0,
        reps: updatedExercise.mode === 'reps' ? (parseInt(updatedExercise.reps) || 10) : 0,
        rest: parseInt(updatedExercise.rest) || 0
      }

      const { error } = await supabase
        .from('exercises')
        .update(exerciseData)
        .eq('id', updatedExercise.id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchRoutine()
    } catch (error) {
      console.error('Errore durante la modifica:', error)
    }
  }

  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0
    const [hours, minutes, seconds] = timeStr.split(':').map(num => parseInt(num) || 0)
    return (hours * 3600) + (minutes * 60) + seconds
  }

  const handleDuplicateExercise = async (exercise) => {
    try {
      const exerciseData = {
        name: exercise.name,
        equipment: exercise.equipment || '',
        body_part: exercise.body_part || '',
        type: exercise.type || 'strength',
        description: exercise.description || '',
        mode: exercise.mode,
        duration: exercise.mode === 'timer' ? parseInt(exercise.duration) || 0 : 0,
        sets: exercise.mode === 'reps' ? parseInt(exercise.sets) || 3 : 0,
        reps: exercise.mode === 'reps' ? parseInt(exercise.reps) || 10 : 0,
        rest: parseInt(exercise.rest) || 0,
        day_of_week: exercise.day_of_week,
        user_id: user.id,
        order_index: (weeklyRoutine[exercise.day_of_week] || []).length
      }

      const { error } = await supabase
        .from('exercises')
        .insert(exerciseData)

      if (error) throw error
      await fetchRoutine()
    } catch (error) {
      console.error('Errore durante la duplicazione dell\'esercizio:', error)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="max-w-2xl mx-auto space-y-4">
        {[1,2,3,4,5,6,7].map(day => (
          <DayPlanner 
            key={day}
            day={day}
            exercises={weeklyRoutine[day] || []}
            onSave={(exercise) => handleSaveExercise(day, exercise)}
            onDuplicate={() => handleDuplicate(day, day === 7 ? 1 : day + 1)}
            onClear={() => handleClear(day)}
            onDeleteExercise={handleDeleteExercise}
            onEditExercise={handleEditExercise}
            onDuplicateExercise={handleDuplicateExercise}
          />
        ))}
      </div>
    </DragDropContext>
  )
}

export default WeeklyPlanner 