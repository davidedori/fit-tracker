import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, RefreshCw, Send, Check, AlertCircle, Copy } from 'react-feather'
import Button from '../common/Button'
import Input from '../common/Input'

const InviteUsers = () => {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const linkRef = useRef(null)

  // Funzione per ottenere il base URL corretto
  const getBaseUrl = () => {
    return window.getBaseUrl();
  };

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invited_by', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setInvitations(data || [])
    } catch (error) {
      console.error('Errore durante il recupero degli inviti:', error)
      setError('Impossibile caricare gli inviti')
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvite = async (e) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setError('Inserisci un indirizzo email valido')
      return
    }
    
    setSending(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Verifica se esiste già un invito per questa email
      const { data: existingInvites, error: checkError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_accepted', false)
      
      if (checkError) throw checkError
      
      // Se esiste già un invito attivo, usa quello
      if (existingInvites && existingInvites.length > 0) {
        const existingInvite = existingInvites[0]
        const inviteUrl = `${getBaseUrl()}/#/register?token=${existingInvite.token}`
        setInviteLink(inviteUrl)
        setSuccess(`Invito esistente recuperato per ${email}. Copia il link per inviarlo.`)
        setEmail('')
        return
      }
      
      // Genera un token univoco
      const token = crypto.randomUUID()
      
      // Registra l'invito nel database
      const { data, error } = await supabase
        .from('user_invitations')
        .insert([
          {
            email: email.toLowerCase(),
            invited_by: user.id,
            token: token,
            is_accepted: false
          }
        ])
        .select()
      
      if (error) throw error
      
      // Crea il link di invito
      const inviteUrl = `${getBaseUrl()}/#/register?token=${token}`
      setInviteLink(inviteUrl)
      
      setSuccess(`Invito registrato per ${email}. Copia il link per inviarlo manualmente.`)
      setEmail('')
      fetchInvitations()
    } catch (error) {
      console.error('Errore durante l\'invio dell\'invito:', error)
      setError(error.message)
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = () => {
    if (linkRef.current) {
      linkRef.current.select()
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invita Nuovi Utenti</h1>
        <Button 
          onClick={fetchInvitations} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Aggiorna
        </Button>
      </div>
      
      {/* Form per inviare inviti */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Invia un nuovo invito</h2>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle size={18} className="mr-2" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
              <Check size={18} className="mr-2" />
              {success}
            </div>
          )}
          
          <form onSubmit={handleSendInvite} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email dell'utente da invitare"
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="flex items-center justify-center gap-2"
              disabled={sending}
            >
              {sending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Invio...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Invia Invito
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
      
      {success && inviteLink && (
        <div className="bg-white shadow rounded-lg overflow-hidden mt-4 p-4">
          <h3 className="font-semibold mb-2">Link di invito:</h3>
          <div className="flex items-center gap-2">
            <input
              ref={linkRef}
              type="text"
              value={inviteLink}
              readOnly
              className="flex-grow p-2 border rounded"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex items-center gap-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copiato!' : 'Copia'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Copia questo link e invialo all'utente che desideri invitare.
          </p>
        </div>
      )}
      
      {/* Lista degli inviti inviati */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Inviti Inviati</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Non hai ancora inviato inviti.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Invio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <Mail size={16} className="mr-2 text-gray-400" />
                        {invite.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invite.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invite.is_accepted ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Accettato
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          In attesa
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default InviteUsers 