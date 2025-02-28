import React, { useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import ExerciseForm from './ExerciseForm'
import { dayNames } from '../../constants/days'
import DuplicateModal from './DuplicateModal'
import Button from '../common/Button'
import { Copy, Trash2, Edit2, Clock, Tool } from 'react-feather'

const DayPlanner = ({ day, exercises, onDuplicate, onClear, onSave, onDeleteExercise, onEditExercise, onDuplicateExercise }) => {
  const [showForm, setShowForm] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [editingExercise, setEditingExercise] = useState(null)

  const handleSave = (exercise) => {
    onSave(exercise)
    setShowForm(false)
  }

  const handleClearConfirm = () => {
    if (window.confirm('Sei sicuro di voler eliminare tutti gli esercizi di questo giorno?')) {
      onClear(day)
    }
  }

  const handleDuplicateClick = () => {
    setShowDuplicateModal(true)
  }

  const handleEditExercise = async (updatedExercise) => {
    try {
      console.log('Esercizio ricevuto per modifica:', updatedExercise)
      
      const exerciseData = {
        id: updatedExercise.id,
        user_id: updatedExercise.user_id,
        day_of_week: updatedExercise.day_of_week,
        name: updatedExercise.name || '',
        equipment: updatedExercise.equipment || '',
        body_part: updatedExercise.body_part || '',
        type: updatedExercise.type || 'strength',
        description: updatedExercise.description || '',
        mode: updatedExercise.mode || 'reps',
        duration: updatedExercise.mode === 'timer' ? parseInt(updatedExercise.duration) || 0 : 0,
        sets: updatedExercise.mode === 'reps' ? parseInt(updatedExercise.sets) || 0 : 0,
        reps: updatedExercise.mode === 'reps' ? parseInt(updatedExercise.reps) || 0 : 0,
        rest: parseInt(updatedExercise.rest) || 0,
        order_index: updatedExercise.order_index || 0
      }

      console.log('Dati preparati per Supabase:', exerciseData)

      const { data, error } = await supabase
        .from('exercises')
        .update(exerciseData)
        .eq('id', updatedExercise.id)
        .eq('user_id', user.id)
        .select()

      if (error) throw error
      
      console.log('Risposta da Supabase:', data)

      const updatedRoutine = { ...weeklyRoutine }
      Object.keys(updatedRoutine).forEach(day => {
        updatedRoutine[day] = updatedRoutine[day].map(ex => 
          ex.id === updatedExercise.id ? {...ex, ...exerciseData} : ex
        )
      })
      console.log('Routine aggiornata:', updatedRoutine)
      setWeeklyRoutine(updatedRoutine)
    } catch (error) {
      console.error('Errore durante la modifica:', error)
    }
  }

  return (
    <div className="day-planner p-4 border rounded bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
        <span>{dayNames[day - 1]}</span>
        <div className="flex space-x-2 flex-shrink-0">
          <Button
            onClick={handleDuplicateClick}
            variant="outline"
            title="Duplica al giorno successivo"
            className="p-2 text-blue-600"
          >
            <Copy size={20} />
          </Button>
          <Button
            onClick={handleClearConfirm}
            variant="danger"
            title="Cancella tutti gli esercizi"
            className="p-2"
          >
            <Trash2 size={20} />
          </Button>
        </div>
      </h2>

      <Button 
        onClick={() => setShowForm(true)}
        variant="outline"
        fullWidth
        className="mb-4 border-dashed"
      >
        + Aggiungi esercizio
      </Button>

      {showForm && (
        <div className="mb-4">
          <ExerciseForm day={day} onSave={handleSave} />
          <button 
            onClick={() => setShowForm(false)}
            className="mt-2 w-full py-2 text-gray-600 hover:text-gray-800"
          >
            Annulla
          </button>
        </div>
      )}

      <Droppable droppableId={`day-${day}`}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="min-h-[100px]"
          >
            {exercises.map((exercise, index) => {
              console.log('Rendering esercizio completo:', exercise)
              console.log('Mode:', exercise.mode)
              console.log('Duration raw:', exercise.duration)
              console.log('Duration parsed:', parseInt(exercise.duration))
              return (
                <Draggable
                  key={exercise.id}
                  draggableId={exercise.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-gray-50 p-3 mb-2 rounded shadow-sm border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{exercise.name}</h3>
                          <p className="text-sm text-gray-600">{exercise.description}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            {exercise.mode === 'timer' ? (
                              <span className="flex items-center gap-1">
                                <Clock size={14} /> {Number(exercise.duration)}s
                              </span>
                            ) : (
                              `${exercise.sets} serie × ${exercise.reps} ripetizioni`
                            )}
                            {exercise.rest > 0 && ` • ${exercise.rest}s pausa`}
                          </div>
                          {exercise.equipment && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Tool size={14} /> {exercise.equipment}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button 
                            onClick={() => {
                              console.log('Exercise being edited:', exercise)
                              setEditingExercise(exercise)
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Modifica"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Sei sicuro di voler eliminare questo esercizio?')) {
                                onDeleteExercise(exercise.id)
                              }
                            }}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Elimina"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => onDuplicateExercise(exercise)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Duplica"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {editingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Modifica esercizio</h3>
            <ExerciseForm
              day={day}
              initialData={{
                ...editingExercise,
                id: editingExercise.id,
                user_id: editingExercise.user_id,
                duration: editingExercise.mode === 'timer' ? 
                  Math.max(0, parseInt(editingExercise.duration) || 0) : 0
              }}
              onSave={(updatedExercise) => {
                console.log('Exercise before edit:', editingExercise)
                console.log('Exercise after edit:', updatedExercise)
                onEditExercise(updatedExercise)
                setEditingExercise(null)
              }}
            />
            <button 
              onClick={() => setEditingExercise(null)}
              className="mt-2 w-full py-2 text-gray-600 hover:text-gray-800"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <DuplicateModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          onConfirm={(targetDay) => {
            onDuplicate(day, targetDay)
            setShowDuplicateModal(false)
          }}
          currentDay={day}
        />
      )}
    </div>
  )
}

export default DayPlanner 