import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { dayNames } from '../../constants/days';
import { Calendar, Clock, Activity, Filter, ChevronLeft, ChevronRight, Trash2, Info, Edit, Save, Award } from 'react-feather';
import WorkoutLogItem from './WorkoutLogItem';
import Button from '../common/Button';
import WorkoutStats from './WorkoutStats';

const WorkoutHistory = () => {
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

  useEffect(() => {
    fetchWorkoutLogs();
    fetchTotalCount();
  }, [filter, page]);

  const fetchTotalCount = async () => {
    try {
      let query = supabase
        .from('workout_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);
      
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
        .eq('user_id', user.id);
        
      if (totalError) throw totalError;
      
      // Ottieni tutti i log per calcolare le statistiche
      const { data: allLogs, error: logsError } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', user.id)
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
        .eq('user_id', user.id)
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
    <div className="container mx-auto px-4 py-8 mb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Storico Allenamenti</h1>
        
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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-gray-500" />
            <h2 className="text-sm font-medium text-gray-700">Filtra per giorno</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => {
                setFilter('all');
                setPage(0); // Reset alla prima pagina quando cambia il filtro
              }}
              variant={filter === 'all' ? 'primary' : 'outline'}
              className="text-xs py-1 px-3"
            >
              Tutti
            </Button>
            {dayNames.map((day, index) => (
              <Button 
                key={index + 1}
                onClick={() => {
                  setFilter((index + 1).toString());
                  setPage(0); // Reset alla prima pagina quando cambia il filtro
                }}
                variant={filter === (index + 1).toString() ? 'primary' : 'outline'}
                className="text-xs py-1 px-3"
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Lista allenamenti */}
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Caricamento...</p>
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
                  
                  {/* Pulsante elimina */}
                  <button 
                    onClick={() => setDeleteConfirm(log.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Elimina allenamento"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  {/* Modale conferma eliminazione */}
                  {deleteConfirm === log.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[300]">
                      <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                          <h3 className="text-lg font-medium mb-4">Conferma eliminazione</h3>
                          <p className="text-gray-600 mb-6">
                            Sei sicuro di voler eliminare questo allenamento? Questa azione non può essere annullata.
                          </p>
                          <div className="flex justify-end gap-3">
                            <Button 
                              onClick={() => setDeleteConfirm(null)}
                              variant="outline"
                              className="px-4 py-2"
                            >
                              Annulla
                            </Button>
                            <Button 
                              onClick={() => handleDeleteLog(log.id)}
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
              ))}
            </div>
            
            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 mb-6 bg-white p-3 rounded-lg shadow-sm">
                <Button
                  onClick={handlePrevPage}
                  disabled={page === 0}
                  variant="outline"
                  className={`flex items-center gap-1 ${page === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ChevronLeft size={16} />
                  Precedente
                </Button>
                
                <div className="text-sm text-gray-600">
                  Pagina {page + 1} di {totalPages}
                </div>
                
                <Button
                  onClick={handleNextPage}
                  disabled={page >= totalPages - 1}
                  variant="outline"
                  className={`flex items-center gap-1 ${page >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Successiva
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <Calendar size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">Nessun allenamento trovato</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "Non hai ancora registrato alcun allenamento" 
                : `Non hai ancora completato allenamenti di ${dayNames[parseInt(filter) - 1]}`}
            </p>
          </div>
        )}
      </div>
      
      {/* Modale dettagli log */}
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
                    {!isEditingNotes ? (
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
                    ) : (
                      <button 
                        onClick={handleSaveNotes}
                        className="text-gray-400 hover:text-green-500 transition-colors"
                        aria-label="Salva note"
                      >
                        <Save size={16} />
                      </button>
                    )}
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