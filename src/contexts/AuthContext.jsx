import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
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
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
    isTrainer: false,
    authError: null,
    initialized: false
  })
  const navigate = useNavigate()
  
  // Ref per tenere traccia delle richieste in corso e dello stato del componente
  const activeRequests = useRef(new Set())
  const abortController = useRef(new AbortController())
  const mountedRef = useRef(true)

  console.log('🏗️ AuthProvider renderizzato')

  // Funzione per aggiornare lo stato in modo sicuro
  const safeSetState = (updates) => {
    if (mountedRef.current) {
      setAuthState(prev => ({ ...prev, ...updates }))
    }
  }

  // Funzione per annullare tutte le richieste attive
  const cancelActiveRequests = () => {
    if (activeRequests.current.size > 0) {
      console.log('🚫 Annullamento richieste attive:', activeRequests.current.size)
      abortController.current.abort()
      abortController.current = new AbortController()
      activeRequests.current.clear()
    }
  }

  // Funzione per aggiungere una richiesta attiva
  const addActiveRequest = (requestId) => {
    console.log('➕ Aggiunta richiesta:', requestId)
    activeRequests.current.add(requestId)
  }

  // Funzione per rimuovere una richiesta attiva
  const removeActiveRequest = (requestId) => {
    console.log('➖ Rimozione richiesta:', requestId)
    activeRequests.current.delete(requestId)
  }

  // Funzione per recuperare il profilo con RPC
  const getProfile = async (userId) => {
    const requestId = `profile-${userId}-${Date.now()}`
    addActiveRequest(requestId)

    try {
      console.log('📊 Recupero profilo tramite RPC per:', userId)
      
      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id: userId })
        .single()

      removeActiveRequest(requestId)

      if (error) {
        console.error('❌ Errore recupero profilo:', error)
        return null
      }

      console.log('✅ Profilo recuperato:', data)
      return data
    } catch (e) {
      removeActiveRequest(requestId)
      console.error('❌ Errore durante il recupero del profilo:', e)
      return null
    }
  }

  // Effetto per l'inizializzazione e la gestione degli eventi di autenticazione
  useEffect(() => {
    console.log('🔄 Inizializzazione AuthProvider')
    mountedRef.current = true
    let initTimeoutId = null

    const handleAuthStateChange = async (event, session) => {
      console.log('🔔 Evento auth:', event, 'Sessione:', session ? 'presente' : 'assente')
      
      if (!mountedRef.current) {
        console.log('❌ Componente smontato, ignoro evento auth')
        return
      }

      // Annulla eventuali richieste in corso
      cancelActiveRequests()

      // Impostiamo subito loading a true per mostrare il caricamento
      safeSetState({ loading: true })

      // Gestione speciale per il processo di conferma email
      const isEmailConfirmation = window.location.hash.includes('#/auth/callback')
      if (isEmailConfirmation) {
        console.log('📧 Processo di conferma email in corso')
        // Se siamo nel processo di conferma email e non abbiamo ancora una sessione,
        // manteniamo lo stato di loading
        if (!session && event !== 'SIGNED_IN') {
          console.log('⏳ Attendo completamento conferma email...')
          return
        }
      }

      if (!session) {
        console.log('⚠️ Nessuna sessione, reset stato')
        safeSetState({
          user: null,
          isTrainer: false,
          loading: false,
          authError: null
        })

        // Se siamo nella pagina di callback ma non abbiamo sessione dopo un SIGNED_IN,
        // probabilmente c'è stato un errore
        if (isEmailConfirmation && event === 'SIGNED_IN') {
          console.log('❌ Errore durante la conferma email, reindirizzo al login')
          window.location.href = `${window.location.origin}${window.location.pathname}#/login`
        }
        return
      }

      const currentUser = session.user
      if (!currentUser) {
        console.log('⚠️ Nessun utente nella sessione')
        safeSetState({
          user: null,
          isTrainer: false,
          loading: false,
          authError: null
        })
        return
      }

      console.log('👤 Utente trovato:', currentUser.id)
      const safeUser = ensureUserProperties(currentUser)

      try {
        // Se siamo nel processo di conferma email, aspettiamo un po' prima di recuperare il profilo
        if (isEmailConfirmation) {
          console.log('⏳ Attendo conferma email prima di recuperare il profilo...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Proviamo prima a recuperare il profilo dalla cache del localStorage
        const cachedProfile = localStorage.getItem(`profile-${currentUser.id}`)
        let profileData = null

        if (cachedProfile) {
          try {
            profileData = JSON.parse(cachedProfile)
            console.log('📦 Profilo recuperato dalla cache:', profileData)
          } catch (e) {
            console.error('❌ Errore parsing cache profilo:', e)
            localStorage.removeItem(`profile-${currentUser.id}`)
          }
        }

        // Se non abbiamo il profilo in cache o è scaduto, lo recuperiamo dal server
        if (!profileData) {
          profileData = await getProfile(currentUser.id)
          if (profileData) {
            // Salviamo il profilo in cache
            localStorage.setItem(`profile-${currentUser.id}`, JSON.stringify(profileData))
          }
        }
        
        if (!mountedRef.current) {
          console.log('❌ Componente smontato durante il recupero del profilo')
          return
        }

        if (profileData) {
          safeUser.nome = profileData.nome
          safeUser.cognome = profileData.cognome
          
          const isTrainerOrAdmin = profileData.role === 'trainer' || profileData.role === 'admin'
          console.log('👑 Stato trainer:', isTrainerOrAdmin)
          
          safeSetState({
            user: safeUser,
            isTrainer: isTrainerOrAdmin,
            loading: false,
            authError: null
          })

          // Se siamo nel processo di conferma email, reindirizza alla home dopo il successo
          if (isEmailConfirmation) {
            console.log('✅ Conferma email completata, reindirizzo alla home')
            window.location.href = `${window.location.origin}${window.location.pathname}#/`
          }
        } else {
          // Se non abbiamo il profilo, settiamo comunque l'utente base
          console.log('⚠️ Profilo non trovato, uso solo dati base utente')
          safeSetState({
            user: safeUser,
            isTrainer: false,
            loading: false,
            authError: null
          })

          // Se siamo nel processo di conferma email, reindirizza comunque alla home
          if (isEmailConfirmation) {
            console.log('✅ Conferma email completata (senza profilo), reindirizzo alla home')
            window.location.href = `${window.location.origin}${window.location.pathname}#/`
          }
        }
      } catch (e) {
        console.error('❌ Errore gestione profilo:', e)
        if (mountedRef.current) {
          // In caso di errore, proviamo a usare i dati in cache se disponibili
          const cachedProfile = localStorage.getItem(`profile-${currentUser.id}`)
          if (cachedProfile) {
            try {
              const profileData = JSON.parse(cachedProfile)
              console.log('🔄 Uso dati profilo dalla cache dopo errore:', profileData)
              safeUser.nome = profileData.nome
              safeUser.cognome = profileData.cognome
              safeSetState({
                user: safeUser,
                isTrainer: profileData.role === 'trainer' || profileData.role === 'admin',
                loading: false,
                authError: null
              })

              // Se siamo nel processo di conferma email, reindirizza alla home
              if (isEmailConfirmation) {
                console.log('✅ Conferma email completata (usando cache), reindirizzo alla home')
                window.location.href = `${window.location.origin}${window.location.pathname}#/`
              }
              return
            } catch (e) {
              console.error('❌ Errore parsing cache profilo dopo errore:', e)
            }
          }
          
          // Se non abbiamo dati in cache, settiamo l'utente base
          safeSetState({
            user: safeUser,
            isTrainer: false,
            loading: false,
            authError: e.message
          })

          // Se siamo nel processo di conferma email, reindirizza comunque alla home
          if (isEmailConfirmation) {
            console.log('✅ Conferma email completata (con errori), reindirizzo alla home')
            window.location.href = `${window.location.origin}${window.location.pathname}#/`
          }
        }
      }
    }

    // Inizializzazione con gestione timeout
    const init = async () => {
      // Usiamo più timeout brevi invece di uno lungo
      const startTimeout = () => {
        if (initTimeoutId) clearTimeout(initTimeoutId)
        initTimeoutId = setTimeout(() => {
          if (mountedRef.current && authState.loading) {
            console.log('⏰ Timeout parziale, riprovo...')
            startTimeout()
          }
        }, 800)
      }

      startTimeout()

      try {
        console.log('🚀 Avvio inizializzazione')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Errore getSession:', error)
          if (mountedRef.current) {
            safeSetState({
              authError: error.message,
              loading: false
            })
          }
          return
        }

        if (mountedRef.current) {
          await handleAuthStateChange('INITIAL', session)
          safeSetState(prev => ({ ...prev, initialized: true }))
        }
      } catch (e) {
        console.error('❌ Errore inizializzazione:', e)
        if (mountedRef.current) {
          safeSetState({
            authError: e.message,
            loading: false
          })
        }
      } finally {
        if (initTimeoutId) {
          clearTimeout(initTimeoutId)
        }
      }
    }

    init()

    // Sottoscrizione agli eventi di auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => {
      console.log('🧹 Pulizia AuthProvider')
      if (initTimeoutId) {
        clearTimeout(initTimeoutId)
      }
      mountedRef.current = false
      cancelActiveRequests()
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      console.log('🚪 Tentativo di logout completo...')
      
      // Prima facciamo il logout da Supabase
      try {
        await supabase.auth.signOut()
        console.log('✅ Logout da Supabase completato')
      } catch (error) {
        console.error('❌ Errore durante il logout da Supabase:', error)
      }
      
      // Poi resettiamo lo stato dell'applicazione
      safeSetState({
        user: null,
        isTrainer: false
      })
      
      // Rimuoviamo i dati dal localStorage
      Object.keys(localStorage)
        .filter(key => key.startsWith('sb-'))
        .forEach(key => {
          console.log(`🗑️ Rimozione chiave localStorage: ${key}`)
          localStorage.removeItem(key)
        })
      
      // Navighiamo al login
      window.location.href = `${window.location.origin}${window.location.pathname}#/login`
    } catch (error) {
      console.error('❌ Errore generale durante il logout:', error)
      // In caso di errore, forziamo comunque il logout
      window.location.href = `${window.location.origin}${window.location.pathname}#/login`
    }
  }

  // Funzione per verificare se l'utente è un trainer
  const checkUserRole = async (userId, existingProfileData = null) => {
    console.log('Verifica ruolo per userId:', userId)
    if (!userId) {
      console.log('UserId non fornito, ritorno false')
      return false
    }

    try {
      // Se abbiamo già i dati del profilo, usiamo quelli
      if (existingProfileData) {
        const isTrainerOrAdmin = existingProfileData.role === 'trainer' || existingProfileData.role === 'admin'
        console.log('Ruolo utente (da dati esistenti):', existingProfileData.role, 'isTrainerOrAdmin =', isTrainerOrAdmin)
        return isTrainerOrAdmin
      }

      // Altrimenti, facciamo la query
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Errore nella verifica del ruolo:', error)
        return false
      }
      
      const isTrainerOrAdmin = data?.role === 'trainer' || data?.role === 'admin'
      console.log('Ruolo utente:', data?.role, 'isTrainerOrAdmin =', isTrainerOrAdmin)
      return isTrainerOrAdmin
    } catch (e) {
      console.error('Eccezione nella verifica del ruolo:', e)
      return false
    }
  }

  // Memorizziamo il valore del context per evitare re-render non necessari
  const contextValue = useMemo(() => ({
    user: authState.user,
    loading: authState.loading,
    signOut,
    isTrainer: authState.isTrainer,
    authError: authState.authError
  }), [authState])

  return (
    <AuthContext.Provider value={contextValue}>
      {authState.loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento...</p>
            {authState.authError && (
              <p className="text-red-500 mt-2">Errore: {authState.authError}</p>
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