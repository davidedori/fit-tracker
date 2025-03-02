import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({
  user: null,
  loading: true,
  signOut: () => {},
  isTrainer: false
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTrainer, setIsTrainer] = useState(false)
  const [authError, setAuthError] = useState(null)
  const navigate = useNavigate()

  console.log('AuthProvider inizializzato')

  const signOut = async () => {
    try {
      console.log('Tentativo di logout completo...')
      
      // Resetta lo stato dell'applicazione
      setUser(null)
      setIsTrainer(false)
      
      // Rimuovi tutti i dati di Supabase dal localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-')) {
          console.log(`Rimozione chiave localStorage: ${key}`)
          localStorage.removeItem(key)
          // Decrementa i perché abbiamo rimosso un elemento
          i--
        }
      }
      
      // Tenta il logout standard da Supabase
      try {
        await supabase.auth.signOut()
        console.log('Logout da Supabase completato')
      } catch (error) {
        console.error('Errore durante il logout da Supabase:', error)
      }
      
      // Forza un reload della pagina per assicurarsi che tutto sia resettato
      console.log('Reindirizzamento al login...')
      navigate('/#/login', { replace: true })
      
      // Forza un reload completo dopo un breve ritardo
      setTimeout(() => {
        console.log('Ricaricamento completo della pagina')
        window.location.reload()
      }, 100)
      
    } catch (error) {
      console.error('Errore generale durante il logout:', error)
      
      // Anche in caso di errore, resettiamo tutto
      setUser(null)
      setIsTrainer(false)
      
      // Rimuovi tutti i dati di Supabase dal localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-')) {
          localStorage.removeItem(key)
          i--
        }
      }
      
      // Forza un reload della pagina
      window.location.href = window.getBaseUrl() + '/#/login'
    }
  }

  // Funzione per verificare se l'utente è un trainer
  const checkUserRole = async (userId) => {
    console.log('Verifica ruolo per userId:', userId)
    if (!userId) {
      console.log('UserId non fornito, ritorno false')
      return false
    }
    
    // SOLUZIONE TEMPORANEA: Imposta direttamente l'utente come trainer
    // se corrisponde all'ID specificato
    const isAdmin = userId === '2248ebaf-92e7-423d-907e-a8a7532e52d9'
    console.log('Impostazione diretta isTrainer =', isAdmin)
    return isAdmin
  }

  useEffect(() => {
    console.log('useEffect in AuthProvider')
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        console.log('Inizializzazione autenticazione')
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Errore getSession:', sessionError)
          if (isMounted) {
            setAuthError(sessionError.message)
            setLoading(false)
          }
          return
        }
        
        const session = sessionData.session
        const currentUser = session?.user ?? null
        console.log('Utente corrente:', currentUser ? `ID: ${currentUser.id}` : 'Nessuno')
        
        if (isMounted) {
          setUser(currentUser)
        }
        
        if (currentUser && isMounted) {
          console.log('Verifica ruolo trainer per utente corrente')
          try {
            // Ottieni i dati del profilo utente
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('role, nome, cognome')
              .eq('id', currentUser.id)
              .single()
            
            if (profileError) {
              console.error('Errore nel recupero del profilo:', profileError)
            } else if (profileData) {
              // Aggiungi nome e cognome all'oggetto utente
              currentUser.nome = profileData.nome
              currentUser.cognome = profileData.cognome
            }
            
            const trainerStatus = await checkUserRole(currentUser.id)
            console.log('Stato trainer:', trainerStatus)
            if (isMounted) {
              setIsTrainer(trainerStatus)
            }
          } catch (e) {
            console.error('Errore durante la verifica del ruolo trainer:', e)
            if (isMounted) {
              setAuthError(e.message)
              // Fallback
              const isAdmin = currentUser.id === '2248ebaf-92e7-423d-907e-a8a7532e52d9'
              console.log('Fallback in getSession: imposto manualmente isTrainer =', isAdmin)
              setIsTrainer(isAdmin)
            }
          }
        }
        
        if (isMounted) {
          setLoading(false)
          console.log('AuthProvider caricamento completato')
        }
      } catch (e) {
        console.error('Errore generale in initAuth:', e)
        if (isMounted) {
          setAuthError(e.message)
          setLoading(false)
        }
      }
    }
    
    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Cambio stato autenticazione:', _event)
      const currentUser = session?.user ?? null
      console.log('Nuovo utente:', currentUser ? `ID: ${currentUser.id}` : 'Nessuno')
      
      if (isMounted) {
        setUser(currentUser)
      }
      
      if (currentUser && isMounted) {
        try {
          const trainerStatus = await checkUserRole(currentUser.id)
          console.log('Nuovo stato trainer:', trainerStatus)
          if (isMounted) {
            setIsTrainer(trainerStatus)
          }
        } catch (e) {
          console.error('Errore durante la verifica del nuovo ruolo trainer:', e)
          if (isMounted) {
            setAuthError(e.message)
            // Fallback
            const isAdmin = currentUser.id === '2248ebaf-92e7-423d-907e-a8a7532e52d9'
            console.log('Fallback in onAuthStateChange: imposto manualmente isTrainer =', isAdmin)
            setIsTrainer(isAdmin)
          }
        }
      } else if (isMounted) {
        setIsTrainer(false)
      }
    })

    return () => {
      console.log('Pulizia AuthProvider')
      isMounted = false;
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signOut, 
      isTrainer, 
      authError 
    }}>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento...</p>
            {authError && (
              <p className="text-red-500 mt-2">Errore: {authError}</p>
            )}
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
} 