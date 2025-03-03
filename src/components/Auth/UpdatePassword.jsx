import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useNavigate, useLocation } from 'react-router-dom'
import Input from '../common/Input'
import { Activity } from 'react-feather'

const UpdatePassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [processingAuth, setProcessingAuth] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Gestisce il flusso di autenticazione quando l'utente arriva dal link email
  useEffect(() => {
    const handlePasswordRecovery = async () => {
      try {
        setProcessingAuth(true)
        setError(null)
        
        // Ottieni i parametri dall'URL
        const hashParams = new URLSearchParams(location.hash.substring(1))
        const queryParams = new URLSearchParams(location.search)
        
        // Cerca il token di accesso nei parametri
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        
        console.log('Tipo di autenticazione:', type)
        
        if (type === 'recovery') {
          console.log('Flusso di recupero password rilevato')
          
          // Se abbiamo un token di accesso, imposta la sessione
          if (accessToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (error) {
              console.error('Errore durante l\'impostazione della sessione:', error)
              throw error
            }
            
            console.log('Sessione impostata correttamente')
          } else {
            console.error('Token di accesso mancante nei parametri URL')
            throw new Error('Link di recupero non valido. Richiedi un nuovo link.')
          }
        } else {
          // Verifica se l'utente ha già una sessione valida
          const { data } = await supabase.auth.getSession()
          if (!data.session) {
            console.error('Nessuna sessione attiva trovata')
            throw new Error('Sessione non valida. Richiedi un nuovo link per reimpostare la password.')
          }
        }
      } catch (error) {
        console.error('Errore durante il recupero password:', error)
        setError(error.message)
      } finally {
        setProcessingAuth(false)
      }
    }
    
    handlePasswordRecovery()
  }, [location])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Verifica che le password corrispondano
    if (password !== confirmPassword) {
      setError('Le password non corrispondono')
      setLoading(false)
      return
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      
      setSuccess(true)
      
      // Reindirizza alla pagina di login dopo 3 secondi
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della password:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="max-w-md w-full m-4 space-y-8 p-10 bg-white rounded-xl shadow-2xl">
        <div className="flex justify-center items-center gap-2">
          <Activity className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-bold text-gray-900">FitTracker</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Imposta nuova password
        </h2>
        
        {processingAuth ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3">Verifica in corso...</span>
          </div>
        ) : (
          <>
            {error && <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">{error}</div>}
            
            {success ? (
              <div className="bg-green-50 p-4 rounded-md text-green-800 text-center">
                Password aggiornata con successo! Verrai reindirizzato alla pagina di accesso...
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="mt-8 space-y-6">
                <div className="rounded-md shadow-sm space-y-4">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nuova password"
                    required
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Conferma password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Aggiornamento in corso...
                    </span>
                  ) : (
                    'Aggiorna password'
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UpdatePassword 