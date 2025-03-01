import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { User, Calendar, Search, RefreshCw, UserPlus } from 'react-feather'
import { Link } from 'react-router-dom'

const TrainerDashboard = () => {
  const { user, isTrainer } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    newClientsThisMonth: 0
  })

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

  const filteredClients = clients.filter(client => {
    const query = searchTerm.toLowerCase().trim();
    
    // Cerca in email, nome e cognome
    return (
      client.email?.toLowerCase().includes(query) ||
      client.nome?.toLowerCase().includes(query) ||
      client.cognome?.toLowerCase().includes(query)
    );
  })

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
        <h1 className="text-2xl font-bold">Dashboard Trainer</h1>
        <button 
          onClick={fetchClients} 
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          <RefreshCw size={16} />
          Aggiorna
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
            
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchTerm ? 'Nessun cliente trovato con questi criteri di ricerca.' : 'Nessun cliente disponibile.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cognome
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Registrazione
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.nome || 'N/D'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.cognome || 'N/D'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link 
                            to={`/trainer/client/${client.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Gestisci Piano
                          </Link>
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
    </div>
  )
}

export default TrainerDashboard