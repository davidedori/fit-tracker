import React, { useState, useEffect } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import DayPlanner from './DayPlanner'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { dayNames } from '../../constants/days'

const WeeklyPlanner = ({ externalUserId = null }) => {
  const { user, isTrainer } = useAuth()
  
  // Assicuriamoci che l'oggetto user abbia tutte le proprietà necessarie
  if (user) {
    user.photoURL = user.photoURL || null;
    user.displayName = user.displayName || null;
  }
  
  const [weeklyRoutine, setWeeklyRoutine] = useState({})
  const [currentDay, setCurrentDay] = useState(1)
  
  // Determina quale ID utente utilizzare
  const userId = externalUserId || user.id

  useEffect(() => {
    fetchRoutine()
  }, [userId])

  const fetchRoutine = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .order('order_index')
    
    console.log('Data grezza dal DB:', JSON.stringify(data, null, 2))
    
    if (!error) {
      const routineByDay = data.reduce((acc, exercise) => {
        if (!acc[exercise.day_of_week]) acc[exercise.day_of_week] = []
        
        // Assicuriamoci che la durata sia mantenuta solo per la modalità timer
        const processedExercise = {
          ...exercise,
          duration: exercise.mode === 'timer' ? (parseInt(exercise.duration) || 0) : 0,
          sets: exercise.mode === 'reps' ? (parseInt(exercise.sets) || 3) : 0,
          reps: exercise.mode === 'reps' ? (parseInt(exercise.reps) || 10) : 0,
          rest: parseInt(exercise.rest) || 0
        }
        
        acc[exercise.day_of_week].push(processedExercise)
        return acc
      }, {})
      
      console.log('Routine finale:', JSON.stringify(routineByDay, null, 2))
      setWeeklyRoutine(routineByDay)
    }
  }

  const handleSaveExercise = async (exercise) => {
    try {
      console.log('Tentativo di salvataggio esercizio:', exercise);
      
      // Prepara i dati dell'esercizio per il salvataggio
      // Rimuoviamo l'id vuoto per permettere a Supabase di generarlo automaticamente
      const { id, ...exerciseWithoutId } = exercise;
      
      const exerciseData = {
        ...exerciseWithoutId,
        // Manteniamo l'ID utente originale se presente, altrimenti usiamo l'ID dell'utente corrente
        user_id: exerciseWithoutId.user_id || userId,
        day_of_week: exercise.day_of_week, // Non sottrarre 1, salva direttamente 1-7
        duration: exercise.mode === 'timer' ? Math.max(0, parseInt(exercise.duration) || 0) : 0,
        sets: exercise.mode === 'reps' ? (parseInt(exercise.sets) || 3) : 0,
        reps: exercise.mode === 'reps' ? (parseInt(exercise.reps) || 10) : 0,
        rest: parseInt(exercise.rest) || 0,
        order_index: (weeklyRoutine[exercise.day_of_week] || []).length
      }

      console.log('Dati formattati per Supabase:', exerciseData);
      
      // Salva l'esercizio nel database
      const { data, error } = await supabase
        .from('exercises')
        .insert(exerciseData)
        .select()

      if (error) throw error

      console.log('Esercizio salvato con successo:', data);
      
      // Aggiorna lo stato locale dopo il salvataggio
      await fetchRoutine()
    } catch (error) {
      console.error('Errore durante il salvataggio dell\'esercizio:', error)
    }
  }

  const handleDuplicate = async (sourceDay, targetDay) => {
    try {
      console.log('handleDuplicate - sourceDay:', sourceDay, 'targetDay:', targetDay)
      const exercises = weeklyRoutine[sourceDay] || []
      const targetDayNum = parseInt(targetDay)
      
      // Verifica che il giorno di origine e destinazione siano diversi
      if (sourceDay === targetDayNum) {
        console.error('Il giorno di origine e destinazione sono uguali')
        return
      }
      
      for (const exercise of exercises) {
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
          day_of_week: targetDayNum,
          user_id: userId,
          order_index: (weeklyRoutine[targetDayNum] || []).length
        }

        const { error } = await supabase
          .from('exercises')
          .insert(exerciseData)

        if (error) {
          console.error('Errore durante la duplicazione:', error)
          throw error
        }
      }
      
      await fetchRoutine()
    } catch (error) {
      console.error('Errore durante la duplicazione:', error)
    }
  }

  const handleClear = async (day) => {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('day_of_week', day) // Non sottrarre 1
      .eq('user_id', userId)

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
    const destExercises = sourceDay === destDay 
      ? sourceExercises 
      : [...(weeklyRoutine[destDay] || [])]
    
    // Rimuovi l'esercizio dalla posizione di origine
    const [movedExercise] = sourceExercises.splice(source.index, 1)
    
    // Aggiorna l'esercizio con il nuovo giorno
    const updatedExercise = {
      ...movedExercise,
      day_of_week: destDay // Non sottrarre 1
    }
    
    // Inserisci l'esercizio nella posizione di destinazione
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
          day_of_week: destDay, // Non sottrarre 1
          order_index: destination.index 
        })
        .eq('id', movedExercise.id)

      // Poi aggiorna gli indici di tutti gli esercizi nel giorno di destinazione
      const updates = destExercises.map((ex, index) => ({
        id: ex.id,
        order_index: index
      }))

      for (const update of updates) {
        await supabase
          .from('exercises')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      }
      
      await fetchRoutine()
    } catch (error) {
      console.error('Errore durante il riordinamento:', error)
    }
  }

  const handleEditExercise = async (updatedExercise) => {
    try {
      // Estraiamo solo i campi necessari per l'aggiornamento
      const exerciseData = {
        name: updatedExercise.name,
        equipment: updatedExercise.equipment || '',
        body_part: updatedExercise.body_part || '',
        type: updatedExercise.type || 'strength',
        description: updatedExercise.description || '',
        mode: updatedExercise.mode,
        duration: updatedExercise.mode === 'timer' ? Math.max(0, parseInt(updatedExercise.duration) || 0) : 0,
        sets: updatedExercise.mode === 'reps' ? (parseInt(updatedExercise.sets) || 3) : 0,
        reps: updatedExercise.mode === 'reps' ? (parseInt(updatedExercise.reps) || 10) : 0,
        rest: parseInt(updatedExercise.rest) || 0,
        day_of_week: updatedExercise.day_of_week,
        order_index: updatedExercise.order_index
      }

      console.log('Tentativo di aggiornamento esercizio:', exerciseData)

      const { error } = await supabase
        .from('exercises')
        .update(exerciseData)
        .eq('id', updatedExercise.id)

      if (error) throw error
      
      console.log('Esercizio aggiornato con successo')
      await fetchRoutine()
    } catch (error) {
      console.error('Errore durante la modifica:', error)
    }
  }

  const handleDeleteExercise = async (exerciseId) => {
    try {
      console.log('Tentativo di eliminazione esercizio:', exerciseId)
      
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)

      if (error) throw error
      
      console.log('Esercizio eliminato con successo')
      await fetchRoutine()
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
        user_id: exercise.user_id || userId,
        order_index: (weeklyRoutine[exercise.day_of_week] || []).length
      }

      console.log('Tentativo di duplicazione esercizio:', exerciseData)

      const { error } = await supabase
        .from('exercises')
        .insert(exerciseData)

      if (error) throw error
      
      console.log('Esercizio duplicato con successo')
      await fetchRoutine()
    } catch (error) {
      console.error('Errore durante la duplicazione dell\'esercizio:', error)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="max-w-6xl mx-auto space-y-4">
        {[1,2,3,4,5,6,7].map(day => (
          <DayPlanner 
            key={day}
            day={day}
            exercises={weeklyRoutine[day] || []}
            onSave={(exercise) => handleSaveExercise(exercise)}
            onDuplicate={handleDuplicate}
            onClear={() => handleClear(day)}
            onDeleteExercise={handleDeleteExercise}
            onEditExercise={handleEditExercise}
            onDuplicateExercise={handleDuplicateExercise}
            externalUserId={externalUserId}
          />
        ))}
      </div>
    </DragDropContext>
  )
}

export default WeeklyPlanner 