import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useNavigate } from 'react-router-dom'
import Input from '../common/Input'
import { Activity } from 'react-feather'

const UpdatePassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  // Verifica se l'utente è in una sessione di recupero password
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('Sessione non valida. Richiedi un nuovo link per reimpostare la password.')
      }
    }
    
    checkSession()
  }, [])

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
      </div>
    </div>
  )
}

export default UpdatePassword 