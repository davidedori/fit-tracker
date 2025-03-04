import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('AuthCallback montato, analisi parametri URL')
    
    // Imposta un timeout di sicurezza
    const timeoutId = setTimeout(() => {
      console.log('Timeout di autenticazione, reindirizzamento al login')
      navigate('/login')
    }, 15000) // 15 secondi di timeout
    
    const processAuth = async () => {
      try {
        // Estrai i parametri dall'URL
        const hashParams = new URLSearchParams(location.hash.substring(1))
        const queryParams = new URLSearchParams(location.search)
        
        // Verifica se ci sono parametri di autenticazione nell'URL
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        
        console.log('Parametri URL:', { 
          type, 
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hash: location.hash ? 'presente' : 'assente',
          search: location.search ? 'presente' : 'assente'
        })
        
        // Se abbiamo un token di accesso, imposta la sessione manualmente
        if (accessToken && refreshToken) {
          console.log('Token trovati, impostazione sessione manuale')
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Errore impostazione sessione:', error)
            throw error
          }
          
          console.log('Sessione impostata manualmente con successo')
          clearTimeout(timeoutId)
          navigate('/')
          return
        }
        
        // Verifica lo stato della sessione attuale
        console.log('Verifica sessione corrente')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Errore recupero sessione:', error)
          throw error
        }
        
        if (data.session) {
          console.log('Sessione trovata, utente autenticato')
          clearTimeout(timeoutId)
          navigate('/')
          return
        }
        
        // Se siamo qui, non abbiamo una sessione valida
        console.log('Nessuna sessione valida trovata, in attesa di eventi di autenticazione')
      } catch (err) {
        console.error('Errore durante il processo di autenticazione:', err)
        setError(err.message)
      }
    }
    
    // Esegui subito la verifica
    processAuth()
    
    // Ascolta i cambiamenti di stato dell'autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Evento di autenticazione:', event)
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        console.log('Utente autenticato, reindirizzamento alla home')
        clearTimeout(timeoutId)
        navigate('/')
      } else if (event === 'SIGNED_OUT') {
        console.log('Utente disconnesso, reindirizzamento al login')
        clearTimeout(timeoutId)
        navigate('/login')
      }
    })
    
    return () => {
      console.log('AuthCallback smontato')
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [navigate, location])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Autenticazione in corso...</p>
        {error && (
          <div className="mt-4">
            <p className="text-red-500">Errore: {error}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="mt-2 text-blue-500 underline"
            >
              Torna al login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthCallback 