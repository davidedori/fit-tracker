import React, { useState } from 'react'
import { dayNames } from '../../constants/days'
import Button from '../common/Button'

const DuplicateModal = ({ isOpen, onClose, onConfirm, currentDay }) => {
  const [selectedDay, setSelectedDay] = useState(currentDay === 7 ? 1 : currentDay + 1)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold mb-4">Duplica esercizi</h3>
        <p className="mb-4">Seleziona il giorno in cui duplicare gli esercizi:</p>
        
        <select 
          value={selectedDay}
          onChange={(e) => setSelectedDay(parseInt(e.target.value))}
          className="w-full p-2 border rounded mb-4"
        >
          {dayNames.map((name, index) => (
            <option key={index + 1} value={index + 1} disabled={index + 1 === currentDay}>
              {name}
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-2">
          <Button 
            onClick={onClose}
            variant="outline"
          >
            Annulla
          </Button>
          <Button 
            onClick={() => onConfirm(selectedDay)}
            variant="primary"
          >
            Duplica
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DuplicateModal 