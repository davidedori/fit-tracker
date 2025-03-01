import React, { useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import ExerciseForm from './ExerciseForm'
import { dayNames } from '../../constants/days'
import DuplicateModal from './DuplicateModal'
import { Edit2, Trash2, Copy, Plus, MoreHorizontal, Clock, Tool } from 'react-feather'
import Button from '../common/Button'

const DayPlanner = ({ 
  day, 
  exercises, 
  onSave, 
  onDuplicate, 
  onClear, 
  onDeleteExercise,
  onEditExercise,
  onDuplicateExercise
}) => {
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)

  const handleSave = (exercise) => {
    onSave({
      ...exercise,
      day_of_week: day
    })
    setShowForm(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{dayNames[day - 1]}</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowForm(true)} 
            variant="outline"
            className="p-2"
            title="Aggiungi esercizio"
          >
            <Plus size={16} />
          </Button>
          {exercises.length > 0 && (
            <>
              <Button 
                onClick={() => setShowDuplicateModal(true)} 
                variant="outline"
                className="p-2"
                title="Duplica esercizi"
              >
                <Copy size={16} />
              </Button>
              <Button 
                onClick={() => {
                  if (window.confirm('Sei sicuro di voler eliminare tutti gli esercizi di questo giorno?')) {
                    onClear()
                  }
                }} 
                variant="outline"
                className="p-2 text-red-500 hover:text-red-700"
                title="Svuota giorno"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      <Droppable droppableId={`day-${day}`}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="min-h-[100px]"
          >
            {exercises.map((exercise, index) => (
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
                          onClick={() => setEditingExercise(exercise)}
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
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300] overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Aggiungi esercizio</h3>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Chiudi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ExerciseForm
              day={day}
              onSave={handleSave}
            />
            <button 
              onClick={() => setShowForm(false)}
              className="mt-2 w-full py-2 text-gray-600 hover:text-gray-800"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {editingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300] overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Modifica esercizio</h3>
              <button 
                onClick={() => setEditingExercise(null)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Chiudi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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