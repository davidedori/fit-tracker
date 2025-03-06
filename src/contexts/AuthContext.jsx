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
    initialized: false,
    session: null
  })
  const navigate = useNavigate()

  const activeRequests = useRef(new Set())
  const abortController = useRef(new AbortController())
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)
  const authStateChangeRef = useRef(null)
  const lastEventRef = useRef(null)
  const initialSessionRef = useRef(null)

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
        throw error
      }

      console.log('✅ Profilo recuperato:', data)
      return data
    } catch (e) {
      removeActiveRequest(requestId)
      console.error('❌ Errore durante il recupero del profilo:', e)
      throw e
    }
  }

  // Funzione per gestire il callback di autenticazione
  const handleAuthCallback = async () => {
    try {
      console.log('🔑 Gestione callback di autenticazione')
      
      // Rimuoviamo il parametro error se presente nell'URL
      const currentHash = window.location.hash
      const hashWithoutError = currentHash.replace(/&error=[^&]*/, '')
      if (currentHash !== hashWithoutError) {
        window.location.hash = hashWithoutError
        return
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?')))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      console.log('📝 Tipo di callback:', type)

      if (!accessToken || !refreshToken) {
        console.error('❌ Token mancanti nel callback')
        window.location.href = `${window.location.origin}${window.location.pathname}#/login`
        return
      }

      console.log('🎫 Token trovati, imposto la sessione')
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (error) {
        console.error('❌ Errore impostazione sessione:', error)
        window.location.href = `${window.location.origin}${window.location.pathname}#/login`
        return
      }

      if (session) {
        console.log('✅ Sessione impostata correttamente')
        // Rimuoviamo i parametri dall'URL per evitare loop
        window.location.hash = '#/'
        return true
      }

      return false
    } catch (e) {
      console.error('❌ Errore durante la gestione del callback:', e)
      window.location.href = `${window.location.origin}${window.location.pathname}#/login`
      return false
    }
  }

  // Funzione per gestire il cambio di stato dell'autenticazione
  const handleAuthStateChange = async (event, session) => {
    console.log('🔔 Evento auth:', event, 'Sessione:', session ? 'presente' : 'assente')
    
    // Se la sessione è identica a quella iniziale e non è un evento iniziale o di logout, ignora
    if (initialSessionRef.current?.user?.id === session?.user?.id && 
        !['INITIAL', 'SIGNED_OUT'].includes(event)) {
      console.log('🔄 Sessione identica a quella iniziale e non è un evento iniziale, ignoro')
      return
    }

    // Ignora eventi duplicati o non necessari
    const eventKey = `${event}-${session?.user?.id || 'no-user'}`
    if (lastEventRef.current === eventKey && event !== 'INITIAL') {
      console.log('🔄 Evento duplicato, ignoro')
      return
    }
    lastEventRef.current = eventKey

    // Se stiamo inizializzando, salva solo la sessione
    if (initializingRef.current) {
      console.log('🔄 Inizializzazione in corso, salvo solo la sessione')
      safeSetState({ session })
      return
    }

    // Ignora eventi non rilevanti
    if (!['SIGNED_IN', 'SIGNED_OUT', 'INITIAL', 'INITIAL_SESSION'].includes(event)) {
      console.log('🔄 Evento non rilevante, ignoro:', event)
      return
    }

    if (!mountedRef.current) {
      console.log('❌ Componente smontato, ignoro evento auth')
      return
    }

    try {
      // Reset completo dello stato per SIGNED_OUT
      if (event === 'SIGNED_OUT') {
        console.log('🚪 Reset completo stato per logout')
        Object.keys(localStorage)
          .filter(key => key.startsWith('profile-'))
          .forEach(key => localStorage.removeItem(key))
        
        safeSetState({
          user: null,
          isTrainer: false,
          loading: false,
          authError: null,
          session: null
        })
        return
      }

      // Mostra loading solo per eventi che richiedono il profilo e non è un evento iniziale con profilo in cache
      if (event === 'SIGNED_IN' || (event === 'INITIAL' && !localStorage.getItem(`profile-${session?.user?.id}`))) {
        safeSetState({ loading: true })
      }

      if (!session) {
        console.log('⚠️ Nessuna sessione, reset stato')
        safeSetState({
          user: null,
          isTrainer: false,
          loading: false,
          authError: null,
          session: null
        })
        return
      }

      const currentUser = session.user
      if (!currentUser) {
        console.log('⚠️ Nessun utente nella sessione')
        safeSetState({
          user: null,
          isTrainer: false,
          loading: false,
          authError: null,
          session: null
        })
        return
      }

      console.log('👤 Utente trovato:', currentUser.id)
      const safeUser = ensureUserProperties(currentUser)

      // Recupera il profilo
      try {
        let profileData = null
        const cachedProfile = localStorage.getItem(`profile-${currentUser.id}`)

        // Prima prova a usare la cache
        if (cachedProfile) {
          try {
            profileData = JSON.parse(cachedProfile)
            console.log('📦 Profilo recuperato dalla cache:', profileData)
          } catch (e) {
            console.error('❌ Errore parsing cache profilo:', e)
            localStorage.removeItem(`profile-${currentUser.id}`)
          }
        }

        // Se non abbiamo dati dalla cache o è un nuovo login, recupera dal server
        if (!profileData || event === 'SIGNED_IN') {
          console.log('🔄 Recupero profilo dal server')
          try {
            profileData = await getProfile(currentUser.id)
            if (profileData) {
              localStorage.setItem(`profile-${currentUser.id}`, JSON.stringify(profileData))
            }
          } catch (error) {
            console.error('❌ Errore recupero profilo dal server:', error)
            if (!profileData) {
              throw error // Rilancia l'errore solo se non abbiamo dati dalla cache
            }
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
            authError: null,
            session,
            initialized: true
          })
        } else {
          console.log('⚠️ Profilo non trovato, uso solo dati base utente')
          safeSetState({
            user: safeUser,
            isTrainer: false,
            loading: false,
            authError: null,
            session,
            initialized: true
          })
        }
      } catch (e) {
        console.error('❌ Errore gestione profilo:', e)
        safeSetState({
          user: safeUser,
          isTrainer: false,
          loading: false,
          authError: e.message,
          session,
          initialized: true
        })
      }
    } finally {
      authStateChangeRef.current = null
    }
  }

  // Effetto per l'inizializzazione
  useEffect(() => {
    console.log('🔄 Inizializzazione AuthProvider')
    mountedRef.current = true
    initializingRef.current = true

    const init = async () => {
      try {
        console.log('🚀 Avvio inizializzazione')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Errore getSession:', error)
          safeSetState({
            authError: error.message,
            loading: false,
            initialized: true
          })
          return
        }

        // Salva la sessione iniziale
        initialSessionRef.current = session
        safeSetState({ session })
        
        // Procedi con l'inizializzazione completa
        initializingRef.current = false
        if (session) {
          await handleAuthStateChange('INITIAL', session)
        } else {
          safeSetState({
            loading: false,
            initialized: true
          })
        }
      } catch (e) {
        console.error('❌ Errore inizializzazione:', e)
        safeSetState({
          authError: e.message,
          loading: false,
          initialized: true
        })
      } finally {
        initializingRef.current = false
      }
    }

    init()

    // Sottoscrizione agli eventi di auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignora gli eventi durante l'inizializzazione
      if (!initializingRef.current) {
        handleAuthStateChange(event, session)
      }
    })

    return () => {
      console.log('🧹 Pulizia AuthProvider')
      mountedRef.current = false
      cancelActiveRequests()
      subscription.unsubscribe()
      initialSessionRef.current = null
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