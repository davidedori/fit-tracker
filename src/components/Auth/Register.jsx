import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Input from '../common/Input'
import { Activity } from 'react-feather'

const getBaseUrl = () => {
  return window.getBaseUrl();
};

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isInvited, setIsInvited] = useState(false)
  const [invitedEmail, setInvitedEmail] = useState('')
  const [token, setToken] = useState('')
  const [checkingInvitation, setCheckingInvitation] = useState(true)
  const [trainerId, setTrainerId] = useState(null)
  const [inviteRole, setInviteRole] = useState('user')

  // Controlla se l'utente arriva da un link di invito
  useEffect(() => {
    const checkInvitation = async () => {
      setCheckingInvitation(true)
      setError(null)
      
      // Estrai il token dall'URL
      const params = new URLSearchParams(location.search)
      const inviteToken = params.get('token')
      
      if (inviteToken) {
        setToken(inviteToken)
        try {
          console.log('Verifica token:', inviteToken)
          
          // Verifica il token di invito
          const { data, error } = await supabase
            .from('user_invitations')
            .select('*')
            .eq('token', inviteToken)
            .eq('is_accepted', false)
          
          if (error) {
            console.error('Errore nella query dell\'invito:', error)
            setError('Errore nella verifica dell\'invito: ' + error.message)
            setCheckingInvitation(false)
            return
          }
          
          console.log('Risultato query invito:', data)
          
          if (data && data.length > 0) {
            // Verifica se l'invito è scaduto
            const inviteData = data[0];
            const isExpired = inviteData.expires_at && new Date(inviteData.expires_at) < new Date();
            
            if (isExpired) {
              console.log('Invito scaduto:', inviteToken);
              setError('Questo invito è scaduto. Richiedi un nuovo invito.');
            } else {
              setIsInvited(true);
              setInvitedEmail(inviteData.email);
              setEmail(inviteData.email);
              // Salva l'ID del trainer che ha inviato l'invito e il ruolo dell'invito
              setTrainerId(inviteData.invited_by);
              setInviteRole(inviteData.invite_role || 'user');
            }
          } else {
            console.log('Nessun invito trovato per il token:', inviteToken)
            setError('Invito non valido o già utilizzato')
          }
        } catch (error) {
          console.error('Errore nella verifica dell\'invito:', error)
          setError('Si è verificato un errore durante la verifica dell\'invito')
        }
      } else {
        // Se non c'è un token, verifica se la registrazione è aperta
        setError('La registrazione è disponibile solo tramite invito')
      }
      
      setCheckingInvitation(false)
    }
    
    checkInvitation()
  }, [location])

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Verifica che l'utente sia stato invitato
      if (!isInvited) {
        throw new Error('La registrazione è disponibile solo tramite invito')
      }
      
      // Verifica che l'email corrisponda a quella dell'invito
      if (email !== invitedEmail) {
        throw new Error('L\'email deve corrispondere a quella dell\'invito')
      }
      
      // Verifica che le password corrispondano
      if (password !== confirmPassword) {
        throw new Error('Le password non corrispondono')
      }
      
      // Registra l'utente
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getBaseUrl()}/#/auth/callback`,
          data: {
            nome,
            cognome
          }
        }
      })
      
      if (error) throw error
      
      if (data.user) {
        console.log('Utente registrato con successo:', data.user.id)
        
        try {
          // Crea il profilo utente con il ruolo corretto
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              role: inviteRole || 'user', // Usa il ruolo dell'invito se presente
              nome,
              cognome,
              trainer_id: inviteRole === 'trainer' ? null : trainerId // Imposta trainer_id solo per i clienti
            })
            
          if (profileError) {
            console.error('Errore nella creazione del profilo:', profileError)
            // Non blocchiamo la registrazione se questo fallisce
          } else {
            console.log('Profilo utente creato con successo')
          }
        } catch (profileError) {
          console.error('Eccezione nella creazione del profilo:', profileError)
          // Non blocchiamo la registrazione se questo fallisce
        }
        
        try {
          // Aggiorna lo stato dell'invito
          const { error: inviteError } = await supabase
            .from('user_invitations')
            .update({
              is_accepted: true,
              accepted_at: new Date().toISOString()
            })
            .eq('token', token)
          
          if (inviteError) {
            console.error('Errore nell\'aggiornamento dell\'invito:', inviteError)
            // Non blocchiamo la registrazione se questo fallisce
          } else {
            console.log('Invito aggiornato con successo')
          }
        } catch (inviteError) {
          console.error('Eccezione nell\'aggiornamento dell\'invito:', inviteError)
          // Non blocchiamo la registrazione se questo fallisce
        }
      }
      
      if (data.user && data.session) {
        navigate('/')
      } else {
        navigate('/login?message=check-email')
      }
    } catch (error) {
      console.error('Errore durante la registrazione:', error)
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Registrati</h2>
        
        {checkingInvitation ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {error && <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">{error}</div>}
            
            {isInvited ? (
              <form onSubmit={handleRegister} className="mt-8 space-y-6">
                <div className="rounded-md shadow-sm space-y-4">
                  <Input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome"
                    required
                  />
                  <Input
                    type="text"
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    placeholder="Cognome"
                    required
                  />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    disabled={true} // L'email è fissata a quella dell'invito
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                  />
                  <div className="mt-4">
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Conferma Password"
                      required
                    />
                  </div>
                </div>

                <div>
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
                        Registrazione in corso...
                      </span>
                    ) : (
                      'Registrati'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 text-center">
                <p className="text-gray-600">
                  Hai già un account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Accedi</Link>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Register 