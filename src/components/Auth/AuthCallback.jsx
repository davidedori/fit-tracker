import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const AuthCallback = () => {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    // Imposta un timeout di sicurezza per evitare che l'utente rimanga bloccato
    const timeoutId = setTimeout(() => {
      console.log('Timeout di autenticazione, reindirizzamento alla home')
      navigate('/')
    }, 10000) // 10 secondi di timeout

    // Verifica lo stato della sessione attuale
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Errore durante il recupero della sessione:', error)
          setError(error.message)
          return
        }
        
        if (data.session) {
          console.log('Sessione trovata, reindirizzamento alla home')
          navigate('/')
        }
      } catch (err) {
        console.error('Errore durante la verifica della sessione:', err)
        setError('Si è verificato un errore durante l\'autenticazione')
      }
    }

    // Esegui la verifica immediata
    checkSession()

    // Ascolta i cambiamenti di stato dell'autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Evento di autenticazione:', event)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        console.log('Utente autenticato, reindirizzamento alla home')
        clearTimeout(timeoutId)
        navigate('/')
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Autenticazione in corso...</p>
        {error && (
          <p className="mt-2 text-red-500">
            Errore: {error}. <button onClick={() => navigate('/login')} className="text-blue-500 underline">Torna al login</button>
          </p>
        )}
      </div>
    </div>
  )
}

export default AuthCallback 