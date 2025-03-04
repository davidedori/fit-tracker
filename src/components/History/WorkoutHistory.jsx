import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { dayNames } from '../../constants/days';
import { Calendar, Clock, Activity, Filter, ChevronLeft, ChevronRight, Trash2, Info, Edit, Save, Award } from 'react-feather';
import WorkoutLogItem from './WorkoutLogItem';
import Button from '../common/Button';
import WorkoutStats from './WorkoutStats';

const WorkoutHistory = ({ externalUserId }) => {
  const { user } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    streak: 0
  });
  
  // Stato per la paginazione
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const logsPerPage = 5;
  
  // Stato per la conferma di eliminazione
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Stato per il modale dei dettagli
  const [detailLog, setDetailLog] = useState(null);

  // Aggiungiamo stato per l'editing delle note
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Calcola il numero totale di pagine
  const totalPages = Math.ceil(totalCount / logsPerPage);

  // Determina l'ID utente da utilizzare (externalUserId se fornito, altrimenti l'utente corrente)
  const userId = externalUserId || (user ? user.id : null);
  
  // Determina se l'utente corrente è il proprietario dei dati
  const isOwner = !externalUserId || (user && externalUserId === user.id);

  useEffect(() => {
    if (userId) {
      fetchWorkoutLogs();
      fetchTotalCount();
    }
  }, [filter, page, userId]);

  const fetchTotalCount = async () => {
    try {
      let query = supabase
        .from('workout_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
      
      if (filter !== 'all') {
        const dayNumber = parseInt(filter);
        query = query.eq('day_of_week', dayNumber);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Errore durante il conteggio degli allenamenti:', error);
    }
  };

  const calculateStats = async () => {
    try {
      // Ottieni il conteggio totale degli allenamenti (senza filtri)
      const { count: totalCount, error: totalError } = await supabase
        .from('workout_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
        
      if (totalError) throw totalError;
      
      // Ottieni tutti i log per calcolare le statistiche
      const { data: allLogs, error: logsError } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
        
      if (logsError) throw logsError;
      
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const thisWeekLogs = allLogs.filter(log => 
        new Date(log.completed_at) >= oneWeekAgo
      );
      
      const thisMonthLogs = allLogs.filter(log => 
        new Date(log.completed_at) >= oneMonthAgo
      );
      
      // Calcola streak (giorni consecutivi di allenamento)
      const sortedDates = allLogs
        .map(log => {
          const date = new Date(log.completed_at);
          return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        });
      
      // Rimuovi duplicati (più allenamenti nello stesso giorno)
      const uniqueDates = [...new Set(sortedDates)];
      
      // Calcola streak
      let currentStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        
        const diffTime = Math.abs(current - next);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      setStats({
        total: totalCount || 0,
        thisWeek: thisWeekLogs.length,
        thisMonth: thisMonthLogs.length,
        streak: currentStreak
      });
    } catch (error) {
      console.error('Errore durante il calcolo delle statistiche:', error);
    }
  };

  const fetchWorkoutLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(page * logsPerPage, (page * logsPerPage) + logsPerPage - 1);

      // Applica filtri se necessario
      if (filter !== 'all') {
        const dayNumber = parseInt(filter);
        query = query.eq('day_of_week', dayNumber);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWorkoutLogs(data || []);
      
      // Calcola statistiche separatamente
      await calculateStats();
    } catch (error) {
      console.error('Errore durante il recupero degli allenamenti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    // Solo il proprietario può eliminare i log
    if (!isOwner) return;
    
    try {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', logId);
        
      if (error) throw error;
      
      // Aggiorna la lista dopo l'eliminazione
      setDeleteConfirm(null);
      await fetchWorkoutLogs();
      await fetchTotalCount();
      await calculateStats(); // Aggiorna anche le statistiche
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'allenamento:', error);
    }
  };
  
  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  // Funzione per salvare le note modificate
  const handleSaveNotes = async () => {
    // Solo il proprietario può modificare le note
    if (!isOwner) return;
    
    try {
      const { error } = await supabase
        .from('workout_logs')
        .update({ notes: editedNotes })
        .eq('id', detailLog.id);
        
      if (error) throw error;
      
      // Aggiorna il log corrente con le nuove note
      setDetailLog({
        ...detailLog,
        notes: editedNotes
      });
      
      // Aggiorna anche la lista dei log
      setWorkoutLogs(workoutLogs.map(log => 
        log.id === detailLog.id ? { ...log, notes: editedNotes } : log
      ));
      
      // Esci dalla modalità di modifica
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento delle note:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="max-w-6xl mx-auto">
        {!externalUserId && <h1 className="text-2xl font-bold mb-6">Storico Allenamenti</h1>}
        
        {/* Statistiche */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={18} className="text-blue-500" />
              <p className="text-sm text-gray-500">Totale</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={18} className="text-blue-500" />
              <p className="text-sm text-gray-500">Questa settimana</p>
            </div>
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={18} className="text-blue-500" />
              <p className="text-sm text-gray-500">Questo mese</p>
            </div>
            <p className="text-2xl font-bold">{stats.thisMonth}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Award size={18} className="text-blue-500" />
              <p className="text-sm text-gray-500">Serie attuale</p>
            </div>
            <p className="text-2xl font-bold">{stats.streak} {stats.streak === 1 ? 'giorno' : 'giorni'}</p>
          </div>
        </div>
        
        {/* Grafico statistiche */}
        {workoutLogs.length > 0 && (
          <WorkoutStats logs={workoutLogs} />
        )}
        
        {/* Filtri */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Filter size={16} className="text-gray-500 mr-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti i giorni</option>
              {dayNames.map((day, index) => (
                <option key={index} value={index + 1}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          
          {/* Paginazione */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 0}
                className={`p-1 rounded ${
                  page === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-gray-600">
                Pagina {page + 1} di {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page >= totalPages - 1}
                className={`p-1 rounded ${
                  page >= totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
        
        {/* Lista allenamenti */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : workoutLogs.length > 0 ? (
          <>
            <div className="space-y-4">
              {workoutLogs.map(log => (
                <div key={log.id} className="relative">
                  <WorkoutLogItem log={log} />
                  
                  {/* Pulsante dettagli */}
                  <button 
                    onClick={() => setDetailLog(log)}
                    className="absolute top-4 right-12 text-gray-400 hover:text-blue-500 transition-colors"
                    aria-label="Dettagli allenamento"
                  >
                    <Info size={18} />
                  </button>
                  
                  {/* Pulsante elimina (solo per il proprietario) */}
                  {isOwner && (
                    <button 
                      onClick={() => setDeleteConfirm(log.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Elimina allenamento"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Modale conferma eliminazione */}
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300]">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                  <h3 className="text-lg font-medium mb-4">Conferma eliminazione</h3>
                  <p className="mb-6">Sei sicuro di voler eliminare questo allenamento? Questa azione non può essere annullata.</p>
                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={() => setDeleteConfirm(null)}
                      variant="outline"
                    >
                      Annulla
                    </Button>
                    <Button 
                      onClick={() => handleDeleteLog(deleteConfirm)}
                      variant="danger"
                    >
                      Elimina
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500 mb-4">Nessun allenamento registrato.</p>
            {!externalUserId && (
              <Button 
                onClick={() => navigate('/workout')}
                variant="primary"
              >
                Inizia un allenamento
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Modale dettagli */}
      {detailLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300]">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                Dettagli Allenamento {dayNames[detailLog.day_of_week - 1]}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data e ora</h3>
                  <p className="text-lg">{new Date(detailLog.completed_at).toLocaleString('it-IT')}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Esercizi completati</h3>
                  <p className="text-lg">{detailLog.exercise_count}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Durata</h3>
                  <p className="text-lg">{detailLog.duration_minutes} minuti</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-500">Note</h3>
                    {isOwner && !isEditingNotes ? (
                      <button 
                        onClick={() => {
                          setEditedNotes(detailLog.notes || '');
                          setIsEditingNotes(true);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        aria-label="Modifica note"
                      >
                        <Edit size={16} />
                      </button>
                    ) : isOwner && isEditingNotes ? (
                      <button 
                        onClick={handleSaveNotes}
                        className="text-gray-400 hover:text-green-500 transition-colors"
                        aria-label="Salva note"
                      >
                        <Save size={16} />
                      </button>
                    ) : null}
                  </div>
                  
                  {!isEditingNotes ? (
                    <p className="text-lg bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                      {detailLog.notes || 'Nessuna nota'}
                    </p>
                  ) : (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Inserisci le tue note qui..."
                    />
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-2">
                {isEditingNotes && (
                  <Button 
                    onClick={() => setIsEditingNotes(false)}
                    variant="outline"
                  >
                    Annulla
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    if (isEditingNotes) {
                      handleSaveNotes();
                    } else {
                      setDetailLog(null);
                    }
                  }}
                  variant="primary"
                >
                  {isEditingNotes ? 'Salva' : 'Chiudi'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory; 