import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { User, Calendar, Search, RefreshCw, UserPlus, Clipboard, Settings, ChevronUp, ChevronDown, Trash2 } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../common/Button'

const TrainerDashboard = () => {
  const { user, isTrainer } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'cognome', direction: 'asc' })
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    newClientsThisMonth: 0
  })
  const [deletingClient, setDeletingClient] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('TrainerDashboard montato')
    console.log('Stato trainer:', isTrainer)
    console.log('Utente:', user ? `ID: ${user.id}` : 'Nessuno')
    
    fetchClients()
    
    return () => {
      console.log('TrainerDashboard smontato')
    }
  }, [])

  const fetchClients = async () => {
    console.log('Inizio fetchClients')
    setLoading(true)
    setError(null)
    
    try {
      console.log('Verifica tabella user_profiles')
      // Prima verifica se la tabella esiste
      const { error: tableError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
      
      if (tableError) {
        console.error('Errore accesso tabella user_profiles:', tableError)
        setError(`Errore tabella: ${tableError.message}`)
        setLoading(false)
        return
      }
      
      console.log('Tabella user_profiles accessibile, recupero utenti')
      // Ottieni tutti gli utenti con ruolo "user"
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, role, nome, cognome, created_at')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error('Errore durante il recupero dei clienti:', error)
        setError(`Errore recupero: ${error.message}`)
        setLoading(false)
        return
      }
      
      console.log('Dati clienti ricevuti:', data)
      
      // Se non ci sono email, recuperale dalla tabella auth.users
      if (data && data.length > 0) {
        console.log('Recupero email degli utenti')
        
        // Ottieni le email dalla tabella auth.users
        const clientsWithEmails = await Promise.all(data.map(async (client) => {
          try {
            // Utilizziamo la funzione RPC per ottenere l'email dell'utente
            const { data: userData, error: userError } = await supabase
              .rpc('get_user_email', { user_id: client.id })
            
            if (userError) {
              console.error('Errore nel recupero email:', userError)
              return { ...client, email: 'Email non disponibile' }
            }
            
            // La funzione restituisce una tabella, quindi userData è un array
            return { ...client, email: userData[0]?.email || 'Email non disponibile' }
          } catch (e) {
            console.error('Errore nel recupero email per utente:', client.id, e)
            return { ...client, email: 'Email non disponibile' }
          }
        }))
        
        console.log('Clienti con email:', clientsWithEmails)
        setClients(clientsWithEmails)
        
        // Calcola le statistiche
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        setStats({
          totalClients: clientsWithEmails.length,
          activeClients: clientsWithEmails.length, // Per ora tutti sono considerati attivi
          newClientsThisMonth: clientsWithEmails.filter(
            client => new Date(client.created_at) >= firstDayOfMonth
          ).length
        })
      } else {
        setClients(data || [])
        setStats({
          totalClients: data?.length || 0,
          activeClients: data?.length || 0,
          newClientsThisMonth: 0
        })
      }
      
      console.log('fetchClients completato')
    } catch (e) {
      console.error('Errore in fetchClients:', e)
      setError(`Errore: ${e.message}`)
    }
    
    setLoading(false)
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
    // Mostra sempre un'icona di default (freccia giù più chiara)
    return <ChevronDown size={14} className="text-gray-300" />;
  };

  // Funzione per eliminare un cliente
  const handleDeleteClient = async () => {
    if (!deletingClient) return;
    
    setIsDeleting(true);
    try {
      // 1. Elimina gli esercizi del cliente
      const { error: exercisesError } = await supabase
        .from('exercises')
        .delete()
        .eq('user_id', deletingClient.id);
      
      if (exercisesError) {
        console.error('Errore eliminazione esercizi:', exercisesError);
        throw exercisesError;
      }
      
      // 2. Elimina i log di allenamento
      const { error: logsError } = await supabase
        .from('workout_logs')
        .delete()
        .eq('user_id', deletingClient.id);
      
      if (logsError) {
        console.error('Errore eliminazione log:', logsError);
        throw logsError;
      }
      
      // 3. Elimina il profilo utente
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', deletingClient.id);
      
      if (profileError) {
        console.error('Errore eliminazione profilo:', profileError);
        throw profileError;
      }
      
      // 4. Aggiorna la lista dei clienti
      setClients(clients.filter(client => client.id !== deletingClient.id));
      
      // 5. Aggiorna le statistiche
      setStats({
        ...stats,
        totalClients: stats.totalClients - 1,
        activeClients: stats.activeClients - 1,
        newClientsThisMonth: new Date(deletingClient.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          ? stats.newClientsThisMonth - 1 
          : stats.newClientsThisMonth
      });
      
      // 6. Chiudi il modale
      setDeletingClient(null);
    } catch (error) {
      console.error('Errore durante l\'eliminazione del cliente:', error);
      setError(`Errore durante l'eliminazione: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtra e ordina i clienti
  const sortedAndFilteredClients = React.useMemo(() => {
    // Prima filtra i clienti
    let filteredResults = clients.filter(client => {
      const query = searchTerm.toLowerCase().trim();
      return (
        client.email?.toLowerCase().includes(query) ||
        client.nome?.toLowerCase().includes(query) ||
        client.cognome?.toLowerCase().includes(query)
      );
    });

    // Poi ordina i risultati filtrati
    if (sortConfig.key) {
      filteredResults.sort((a, b) => {
        // Gestione valori null o undefined
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        // Ordinamento per data se la colonna è 'created_at'
        if (sortConfig.key === 'created_at') {
          const dateA = new Date(a[sortConfig.key]);
          const dateB = new Date(b[sortConfig.key]);
          return sortConfig.direction === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
        }

        // Ordinamento alfabetico per le altre colonne
        const valueA = a[sortConfig.key].toString().toLowerCase();
        const valueB = b[sortConfig.key].toString().toLowerCase();
        
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
  }, [clients, searchTerm, sortConfig]);

  if (!isTrainer) {
    console.log('Utente non è trainer, reindirizzamento')
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Non hai i permessi per accedere a questa pagina.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button 
          onClick={fetchClients} 
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
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Clienti Totali</p>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Clienti Attivi</p>
                  <p className="text-2xl font-bold">{stats.activeClients}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                  <UserPlus size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Nuovi Clienti (Questo Mese)</p>
                  <p className="text-2xl font-bold">{stats.newClientsThisMonth}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">I Tuoi Clienti</h2>
              <div className="mt-4 flex items-center">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Cerca per email, nome o cognome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {sortedAndFilteredClients.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchTerm ? 'Nessun cliente trovato con questi criteri di ricerca.' : 'Nessun cliente disponibile.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="w-24"></th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('cognome')}
                      >
                        <div className="flex items-center">
                          Cognome
                          <span className="ml-1">{getSortIcon('cognome')}</span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
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
                          Data reg.
                          <span className="ml-1">{getSortIcon('created_at')}</span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAndFilteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <div className="flex justify-center">
                            <div 
                              onClick={() => navigate(`/trainer/client/${client.id}`)}
                              className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors relative"
                              title="Gestisci cliente"
                            >
                              <User size={16} className="text-blue-600" />
                              <Settings size={16} className="text-blue-600 absolute bottom-0 right-0 bg-white rounded-full p-0.5" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.cognome || 'N/D'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.nome || 'N/D'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex justify-center">
                            <button
                              onClick={() => setDeletingClient(client)}
                              className="p-1 text-red-500 hover:text-red-700"
                              title="Elimina cliente"
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
        </>
      )}

      {/* Modale di conferma eliminazione */}
      {deletingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Conferma eliminazione cliente</h3>
              <p className="text-gray-600 mb-2">
                Sei sicuro di voler eliminare il cliente <strong>{deletingClient.nome} {deletingClient.cognome}</strong>?
              </p>
              <p className="text-red-600 text-sm mb-6">
                Questa azione eliminerà tutti i dati del cliente, inclusi esercizi e allenamenti. Non può essere annullata.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setDeletingClient(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={isDeleting}
                >
                  Annulla
                </button>
                <button 
                  onClick={handleDeleteClient}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-400"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Eliminazione in corso...' : 'Elimina definitivamente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainerDashboard