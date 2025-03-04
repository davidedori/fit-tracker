import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, RefreshCw, Link as LinkIcon, Check, AlertCircle, Copy, Trash2, X, Search, ExternalLink, Share2, ChevronUp, ChevronDown, Filter, Clock } from 'react-feather'
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
  const [copiedInviteId, setCopiedInviteId] = useState(null)
  const [deletingInvite, setDeletingInvite] = useState(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'pending', 'accepted'
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
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

  // Funzione per gestire l'ordinamento
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Funzione per ottenere l'icona di ordinamento
  const getSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    }
    return <ChevronDown size={14} className="text-gray-300" />;
  };

  // Filtra e ordina gli inviti
  const filteredAndSortedInvitations = React.useMemo(() => {
    // Prima filtra per termine di ricerca e stato
    let filteredResults = invitations.filter(invite => {
      const matchesSearch = invite.email.toLowerCase().includes(searchTerm.toLowerCase().trim());
      
      // Filtra per stato
      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'pending') return matchesSearch && !invite.is_accepted;
      if (statusFilter === 'accepted') return matchesSearch && invite.is_accepted;
      
      return matchesSearch;
    });

    // Poi ordina i risultati filtrati
    if (sortConfig.key) {
      filteredResults.sort((a, b) => {
        // Ordinamento per data
        if (sortConfig.key === 'created_at') {
          const dateA = new Date(a[sortConfig.key]);
          const dateB = new Date(b[sortConfig.key]);
          return sortConfig.direction === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
        }
        
        // Ordinamento per altri campi
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];
        
        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredResults;
  }, [invitations, searchTerm, statusFilter, sortConfig]);

  const handleSendInvite = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setError('Inserisci un indirizzo email valido')
      return
    }
    
    setSending(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Genera un token casuale
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      // Salva l'invito nel database
      const { data, error } = await supabase
        .from('user_invitations')
        .insert([
          { 
            email, 
            token,
            invited_by: user.id
          }
        ])
        .select()
      
      if (error) throw error
      
      // Crea il link di invito
      const inviteUrl = `${getBaseUrl()}/#/register?token=${token}`
      setInviteLink(inviteUrl)
      
      // Resetta il form
      setEmail('')
      setShowLinkModal(true)
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

  const handleDeleteInvite = async (inviteId) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', inviteId)
      
      if (error) throw error
      
      // Aggiorna la lista degli inviti
      fetchInvitations()
      setDeletingInvite(null)
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'invito:', error)
      setError('Impossibile eliminare l\'invito: ' + error.message)
    }
  }
  
  const copyInviteLink = (inviteId, token) => {
    const inviteUrl = `${getBaseUrl()}/#/register?token=${token}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedInviteId(inviteId)
    setTimeout(() => setCopiedInviteId(null), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invita Nuovi Clienti</h1>
        <button 
          onClick={fetchInvitations} 
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100"
          title="Aggiorna"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {/* Form per inviare inviti */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Crea un nuovo invito</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSendInvite} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email del cliente da invitare"
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
                  Creazione...
                </>
              ) : (
                <>
                  <LinkIcon size={16} />
                  Crea Link
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
      
      {/* Lista degli inviti inviati */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Inviti Inviati</h2>
        </div>
        
        {/* Barra di ricerca e filtri */}
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per email..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Filter size={18} className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 mr-2">Stato:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti</option>
                <option value="pending">In attesa</option>
                <option value="accepted">Accettati</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Non hai ancora inviato inviti.
          </div>
        ) : filteredAndSortedInvitations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nessun invito corrisponde ai criteri di ricerca.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('created_at')}
                  >
                    <div className="flex items-center">
                      Creato il
                      <span className="ml-1">{getSortIcon('created_at')}</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedInvitations.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invite.is_accepted ? (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Check size={16} className="text-green-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock size={16} className="text-yellow-600" />
                          </div>
                        </div>
                      )}
                    </td>
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
                      <div className="flex space-x-2">
                        {!invite.is_accepted && (
                          <button 
                            onClick={() => copyInviteLink(invite.id, invite.token)}
                            className="p-1 text-blue-600 hover:text-blue-800 relative"
                            title="Copia link di invito"
                          >
                            {copiedInviteId === invite.id ? <Check size={16} /> : <Share2 size={16} />}
                            
                            {/* Tooltip di feedback */}
                            {copiedInviteId === invite.id && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                Link copiato!
                              </span>
                            )}
                          </button>
                        )}
                        <button 
                          onClick={() => setDeletingInvite(invite.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modale per il link di invito */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Link di invito creato</h3>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-start">
                <Check size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                <p>Link di invito creato con successo! Copia il link qui sotto e invialo al cliente.</p>
              </div>
              
              {copied && (
                <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center">
                  <Check size={20} className="mr-2" />
                  Link copiato negli appunti!
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link da inviare al cliente:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={linkRef}
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-grow p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Copy size={16} />
                    Copia
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Il cliente potrà utilizzare questo link per registrarsi alla piattaforma e sarà automaticamente associato al tuo account.
              </p>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowLinkModal(false)}
                  variant="primary"
                >
                  Chiudi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modale di conferma eliminazione */}
      {deletingInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Conferma eliminazione</h3>
              <p className="text-gray-600 mb-6">
                Sei sicuro di voler eliminare questo invito? Questa azione non può essere annullata.
              </p>
              <div className="flex justify-end gap-3">
                <Button 
                  onClick={() => setDeletingInvite(null)}
                  variant="outline"
                  className="px-4 py-2"
                >
                  Annulla
                </Button>
                <Button 
                  onClick={() => handleDeleteInvite(deletingInvite)}
                  variant="danger"
                  className="px-4 py-2"
                >
                  Elimina
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InviteUsers 