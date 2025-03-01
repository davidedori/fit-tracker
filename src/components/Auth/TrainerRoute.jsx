import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const TrainerRoute = ({ children }) => {
  const { user, isTrainer, loading } = useAuth()

  useEffect(() => {
    console.log('TrainerRoute montato')
    console.log('Stato in TrainerRoute:', { user: !!user, isTrainer, loading })
    
    return () => {
      console.log('TrainerRoute smontato')
    }
  }, [user, isTrainer, loading])

  if (loading) {
    console.log('TrainerRoute: caricamento in corso')
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  }

  if (!user) {
    console.log('TrainerRoute: utente non autenticato, reindirizzamento al login')
    return <Navigate to="/login" replace />
  }

  if (!isTrainer) {
    console.log('TrainerRoute: utente non è trainer, reindirizzamento al profilo')
    return <Navigate to="/profile" replace />
  }

  console.log('TrainerRoute: accesso consentito')
  return children
}

export default TrainerRoute 