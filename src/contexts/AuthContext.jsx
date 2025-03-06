import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({
  user: null,
  loading: true,
  signOut: () => {},
  isTrainer: false
})

// Funzione di utilità per assicurare che l'oggetto utente abbia tutte le proprietà necessarie
const ensureUserProperties = (user) => {
  if (!user) return null;
  return {
    ...user,
    photoURL: user.photoURL || null,
    displayName: user.displayName || null,
    nome: user.nome || null,
    cognome: user.cognome || null
  };
}

// Esporta l'hook useAuth come funzione nominata
function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider')
  }
  return context
}

// Esporta AuthProvider come funzione nominata
function AuthProvider({ children }) {
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
    
    try {
      // Verifica se l'utente ha il ruolo 'trainer' o 'admin' nella tabella user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Errore nella verifica del ruolo:', error)
        // Fallback per l'admin
        const isAdmin = userId === '2248ebaf-92e7-423d-907e-a8a7532e52d9'
        console.log('Fallback: imposto manualmente isTrainer =', isAdmin)
        return isAdmin
      }
      
      const isTrainerOrAdmin = data.role === 'trainer' || data.role === 'admin'
      console.log('Ruolo utente:', data.role, 'isTrainerOrAdmin =', isTrainerOrAdmin)
      return isTrainerOrAdmin
    } catch (e) {
      console.error('Eccezione nella verifica del ruolo:', e)
      // Fallback per l'admin
      const isAdmin = userId === '2248ebaf-92e7-423d-907e-a8a7532e52d9'
      console.log('Fallback in eccezione: imposto manualmente isTrainer =', isAdmin)
      return isAdmin
    }
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
        
        // Usa la funzione locale invece di window.ensureUserProperties
        const safeUser = ensureUserProperties(currentUser);
        
        if (isMounted) {
          setUser(safeUser)
        }
        
        if (safeUser && isMounted) {
          console.log('Verifica ruolo trainer per utente corrente')
          try {
            // Ottieni i dati del profilo utente
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('role, nome, cognome')
              .eq('id', safeUser.id)
              .single()
            
            if (profileError) {
              console.error('Errore nel recupero del profilo:', profileError)
            } else if (profileData) {
              // Aggiungi nome e cognome all'oggetto utente
              safeUser.nome = profileData.nome
              safeUser.cognome = profileData.cognome
            }
            
            const trainerStatus = await checkUserRole(safeUser.id)
            console.log('Stato trainer:', trainerStatus)
            if (isMounted) {
              setIsTrainer(trainerStatus)
            }
          } catch (e) {
            console.error('Errore durante la verifica del ruolo trainer:', e)
            if (isMounted) {
              setAuthError(e.message)
              // Fallback
              const isAdmin = safeUser.id === '2248ebaf-92e7-423d-907e-a8a7532e52d9'
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
      
      // Usa la funzione locale invece di window.ensureUserProperties
      const safeUser = ensureUserProperties(currentUser);
      
      if (isMounted) {
        setUser(safeUser)
      }
      
      if (safeUser && isMounted) {
        try {
          const trainerStatus = await checkUserRole(safeUser.id)
          console.log('Nuovo stato trainer:', trainerStatus)
          if (isMounted) {
            setIsTrainer(trainerStatus)
          }
        } catch (e) {
          console.error('Errore durante la verifica del nuovo ruolo trainer:', e)
          if (isMounted) {
            setAuthError(e.message)
            // Fallback
            const isAdmin = safeUser.id === '2248ebaf-92e7-423d-907e-a8a7532e52d9'
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

// Esporta entrambi come named exports
export { useAuth, AuthProvider } 