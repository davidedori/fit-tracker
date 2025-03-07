import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { User, Calendar, Search, RefreshCw, UserPlus, Clipboard, Settings, ChevronUp, ChevronDown, Trash2, Circle, UserCheck, Activity, Check, AlertTriangle, Calendar as CalendarIcon, Edit } from 'react-feather'
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('TrainerDashboard montato')
    console.log('Stato trainer:', isTrainer)
    console.log('Utente:', user ? `ID: ${user.id}` : 'Nessuno')
    
    checkAdminRole()
    
    return () => {
      console.log('TrainerDashboard smontato')
    }
  }, [])
  
  // Effetto separato per caricare i clienti quando cambia isAdmin
  useEffect(() => {
    console.log('Stato admin cambiato:', isAdmin)
    fetchClients()
  }, [isAdmin])

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      setIsAdmin(data.role === 'admin')
    } catch (error) {
      console.error('Errore verifica ruolo admin:', error)
    }
  }

  const fetchClients = async () => {
    console.log('fetchClients iniziato')
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
      // Se admin recupera tutti gli utenti, altrimenti solo quelli assegnati
      let query = supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'user')

      if (!isAdmin) {
        query = query.eq('trainer_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
        
      if (error) {
        console.error('Errore durante il recupero dei clienti:', error)
        setError(`Errore recupero: ${error.message}`)
        setLoading(false)
        return
      }
      
      // Recupera i dati dei trainer
      if (data && data.length > 0) {
        // Raccogli tutti gli ID dei trainer
        const trainerIds = data
          .filter(client => client.trainer_id)
          .map(client => client.trainer_id)
        
        // Se ci sono trainer da recuperare
        if (trainerIds.length > 0) {
          const { data: trainersData, error: trainersError } = await supabase
            .from('user_profiles')
            .select('id, nome, cognome')
            .in('id', trainerIds)
          
          if (trainersError) {
            console.error('Errore recupero trainer:', trainersError)
          } else if (trainersData) {
            // Crea un dizionario di trainer per un accesso più veloce
            const trainersMap = {}
            trainersData.forEach(trainer => {
              trainersMap[trainer.id] = trainer
            })
            
            // Aggiungi i dati del trainer a ciascun cliente
            data.forEach(client => {
              if (client.trainer_id && trainersMap[client.trainer_id]) {
                client.trainer = trainersMap[client.trainer_id]
              } else {
                client.trainer = null
              }
            })
          }
        }
      }
      
      console.log('Dati clienti ricevuti:', data)
      
      if (data) {
        try {
          // Calcola la data di una settimana fa
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const oneWeekAgoStr = oneWeekAgo.toISOString();
          
          // Crea un array di promesse per ottenere le email e i dati di allenamento
          const clientPromises = data.map(async (client) => {
            // Assicuriamoci che l'oggetto client abbia tutte le proprietà necessarie
            client.photoURL = client.photoURL || null;
            client.displayName = client.displayName || null;
            
            // Ottieni l'email
            const { data: emailData, error: emailError } = await supabase.rpc('get_user_email', {
              user_id: client.id
            });
            
            if (emailError) {
              console.error('Errore nel recupero dell\'email:', emailError);
            }
            
            // Estrai l'email dal risultato
            let email = 'Email non disponibile';
            if (emailData && emailData.email) {
              email = emailData.email;
            } else if (emailData && Array.isArray(emailData) && emailData.length > 0) {
              email = emailData[0]?.email || 'Email non disponibile';
            }
            
            // Controlla se il cliente ha completato allenamenti nell'ultima settimana
            const { data: recentWorkouts, error: workoutsError } = await supabase
              .from('workout_logs')
              .select('*')
              .eq('user_id', client.id)
              .gte('created_at', oneWeekAgoStr);
              
            if (workoutsError) {
              console.error('Errore nel recupero degli allenamenti:', workoutsError);
            }
            
            // Controlla se il cliente ha esercizi programmati
            const { data: scheduledExercises, error: exercisesError } = await supabase
              .from('exercises')
              .select('*')
              .eq('user_id', client.id);
              
            if (exercisesError) {
              console.error('Errore nel recupero degli esercizi:', exercisesError);
            }
            
            // Determina lo stato del cliente
            const isActive = recentWorkouts && recentWorkouts.length > 0;
            const hasScheduledExercises = scheduledExercises && scheduledExercises.length > 0;
            
            // Determina il colore dell'indicatore
            let statusColor = 'red'; // Default: rosso (nessun esercizio programmato)
            
            if (hasScheduledExercises) {
              statusColor = isActive ? 'green' : 'amber'; // Verde se attivo, arancione se inattivo
            }
            
            return {
              ...client,
              email: email,
              isActive,
              hasScheduledExercises,
              statusColor
            };
          });
          
          // Attendi che tutte le promesse siano risolte
          const clientsWithData = await Promise.all(clientPromises);
          
          // Calcola le statistiche
          const totalClients = clientsWithData.length;
          const activeClients = clientsWithData.filter(client => client.isActive).length;
          
          // Calcola i nuovi clienti di questo mese
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const newClientsThisMonth = clientsWithData.filter(client => {
            const createdAt = new Date(client.created_at);
            return createdAt >= startOfMonth;
          }).length;
          
          setClients(clientsWithData);
          setStats({
            totalClients,
            activeClients,
            newClientsThisMonth
          });
        } catch (error) {
          console.error('Errore nel recupero delle email:', error);
        }
      } else {
        setClients(data || []);
        setStats({
          totalClients: data?.length || 0,
          activeClients: 0,
          newClientsThisMonth: 0
        });
      }
      
      console.log('fetchClients completato');
    } catch (e) {
      console.error('Errore in fetchClients:', e);
      setError(`Errore: ${e.message}`);
    }
    
    setLoading(false);
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
      setShowDeleteModal(false);
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
                      {isAdmin && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trainer
                        </th>
                      )}
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
                              className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors relative"
                              title="Gestisci cliente"
                            >
                              <User size={20} className="text-blue-600" />
                              {/* Indicatore di stato (sistema a semaforo) */}
                              <div 
                                className={`absolute -bottom-0.5 -right-0.5 z-10 w-3 h-3 rounded-full border border-white cursor-help ${
                                  client.statusColor === 'green' 
                                    ? 'bg-green-500' 
                                    : client.statusColor === 'amber' 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                }`}
                                title={
                                  client.statusColor === 'green' 
                                    ? 'Cliente attivo: ha completato almeno un allenamento nell\'ultima settimana' 
                                    : client.statusColor === 'amber' 
                                      ? 'Cliente inattivo: ha esercizi programmati ma non ha completato allenamenti nell\'ultima settimana' 
                                      : 'Cliente senza esercizi programmati'
                                }
                              />
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
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.trainer ? `${client.trainer.nome} ${client.trainer.cognome}` : 'Non assegnato'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => {
                                setDeletingClient(client);
                                setShowDeleteModal(true);
                              }}
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
      {showDeleteModal && deletingClient && (
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
                  onClick={() => {
                    setDeletingClient(null);
                    setShowDeleteModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={isDeleting}
                >
                  Annulla
                </button>
                <button 
                  onClick={handleDeleteClient}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Eliminazione in corso...' : 'Elimina'}
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