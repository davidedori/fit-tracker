import React, { useState, useEffect, useRef } from 'react'
import Button from '../common/Button'
import { Clock, RefreshCw, Award, ChevronRight, Tool, Activity, Play, Pause, CheckCircle, SkipForward, FastForward, ThumbsUp } from 'react-feather'

// Componente per le particelle dell'esplosione
const Particles = () => {
  // Creiamo un array di particelle con proprietà casuali
  const particleCount = 20;
  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * 2 * Math.PI;
    const distance = 40 + Math.random() * 40;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 3 + Math.random() * 5;
    const duration = 1.2 + Math.random() * 0.6; // Durata ancora più lunga
    const delay = Math.random() * 0.3;
    
    // Colori blu per le particelle
    const colors = ['bg-blue-500', 'bg-blue-400', 'bg-blue-300', 'bg-blue-200'];
    const color = colors[i % colors.length];
    
    particles.push(
      <div 
        key={i}
        className={`absolute rounded-full ${color}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          top: 'calc(50% - 2px)',
          left: 'calc(50% - 2px)',
          transform: 'translate(0, 0) scale(0)',
          opacity: 0,
          animation: `particle-fly-${i} ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s forwards`
        }}
      />
    );
  }
  
  // Creiamo le keyframes per ogni particella
  const keyframes = particles.map((_, i) => {
    const angle = (i / particleCount) * 2 * Math.PI;
    const distance = 40 + Math.random() * 40;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    return `
      @keyframes particle-fly-${i} {
        0% {
          transform: translate(0, 0) scale(0);
          opacity: 0;
        }
        25% {
          transform: translate(${x * 0.3}px, ${y * 0.3}px) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(${x}px, ${y}px) scale(0);
          opacity: 0;
        }
      }
    `;
  }).join('');
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles}
      <style>{keyframes}</style>
    </div>
  );
};

const ExerciseGuide = ({ exercise, onComplete, totalExercises, currentExerciseIndex }) => {
  if (!exercise) {
    return (
      <div className="bg-white rounded-lg p-6 flex justify-center items-center">
        <span className="text-gray-500">Caricamento esercizio...</span>
      </div>
    )
  }

  const [timer, setTimer] = useState(exercise.mode === 'timer' ? exercise.duration : exercise.rest)
  const [isActive, setIsActive] = useState(false)
  const [currentSet, setCurrentSet] = useState(1)
  const [isResting, setIsResting] = useState(false)
  const [showNextExercise, setShowNextExercise] = useState(false)
  const [transitionTimer, setTransitionTimer] = useState(3)
  const [animateSetChange, setAnimateSetChange] = useState(false)
  const [displayedSet, setDisplayedSet] = useState(1)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    setTimer(exercise.mode === 'timer' ? exercise.duration : exercise.rest)
    setIsActive(false)
    setCurrentSet(1)
    setDisplayedSet(1)
    setIsResting(false)
    setShowNextExercise(false)
    setAnimateSetChange(false)
    isProcessingRef.current = false
  }, [exercise])

  useEffect(() => {
    let interval = null
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1)
      }, 1000)
    } else if (isActive && timer === 0) {
      setIsActive(false)
      if (exercise.mode === 'timer') {
        onComplete()
      } else if (isResting) {
        setIsResting(false)
      }
    }
    return () => clearInterval(interval)
  }, [isActive, timer, exercise.mode, isResting])

  useEffect(() => {
    let interval = null
    if (showNextExercise && transitionTimer > 0) {
      interval = setInterval(() => {
        setTransitionTimer(timer => timer - 1)
      }, 1000)
    } else if (showNextExercise && transitionTimer === 0) {
      setShowNextExercise(false)
      onComplete()
    }
    return () => clearInterval(interval)
  }, [showNextExercise, transitionTimer])

  const startTransition = () => {
    setShowNextExercise(true)
    setTransitionTimer(3)
  }

  const handleSetComplete = () => {
    if (isProcessingRef.current || animateSetChange || isResting) return;
    isProcessingRef.current = true;
    
    if (currentSet < exercise.sets) {
      const nextSet = currentSet + 1;
      setCurrentSet(nextSet);
      
      setAnimateSetChange(true)
      
      setTimeout(() => {
        setDisplayedSet(nextSet)
      }, 300)
      
      setTimeout(() => {
        setAnimateSetChange(false)
        setIsResting(true)
        setTimer(exercise.rest)
        setIsActive(true)
        isProcessingRef.current = false;
      }, 800)
    } else {
      startTransition()
      isProcessingRef.current = false;
    }
  }

  const handleSkipSet = () => {
    if (isProcessingRef.current || animateSetChange || isResting) return;
    isProcessingRef.current = true;
    
    if (currentSet < exercise.sets) {
      const nextSet = currentSet + 1;
      setCurrentSet(nextSet);
      
      setAnimateSetChange(true)
      
      setTimeout(() => {
        setDisplayedSet(nextSet)
      }, 300)
      
      setTimeout(() => {
        setAnimateSetChange(false)
        setIsResting(true)
        setTimer(exercise.rest)
        setIsActive(true)
        isProcessingRef.current = false;
      }, 800)
    } else {
      startTransition();
      isProcessingRef.current = false;
    }
  }

  const handleSkipRest = () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setIsResting(false);
    setIsActive(false);
    isProcessingRef.current = false;
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getBodyPartColor = () => {
    const colors = {
      'braccia': 'bg-blue-50 text-blue-600',
      'gambe': 'bg-green-50 text-green-600',
      'core': 'bg-yellow-50 text-yellow-600',
      'schiena': 'bg-purple-50 text-purple-600',
      'spalle': 'bg-red-50 text-red-600',
      'default': 'bg-gray-50 text-gray-600'
    }
    return colors[exercise.body_part] || colors.default
  }

  if (showNextExercise) {
    return (
      <div className="bg-white rounded-lg p-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Award className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Esercizio Completato! 🎉</h2>
          <p className="text-lg mb-4">
            {currentExerciseIndex + 1 < totalExercises 
              ? "Preparati per il prossimo esercizio"
              : "Ultimo esercizio completato!"}
          </p>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto my-4 sm:my-6">
            <p className="text-3xl sm:text-4xl font-bold text-blue-500">{transitionTimer}</p>
          </div>
          <Button
            onClick={onComplete}
            variant="outline"
            className="mt-4"
          >
            Salta attesa <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{exercise.name}</h2>
        <div className="flex flex-col items-end">
          <span className="text-sm text-blue-800 font-medium">
            Esercizio {currentExerciseIndex + 1} di {totalExercises}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {exercise.body_part && (
          <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${getBodyPartColor()}`}>
            <Activity size={14} />
            {exercise.body_part}
          </span>
        )}
        
        {exercise.equipment && (
          <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-1">
            <Tool size={14} />
            {exercise.equipment}
          </span>
        )}
      </div>

      {exercise.description && (
        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
          {exercise.description}
        </p>
      )}

      <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
        {exercise.mode === 'timer' ? (
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Clock size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-500">Modalità Timer</span>
            </div>
            
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <p className="text-3xl sm:text-4xl font-bold text-blue-700">{formatTime(timer)}</p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`w-16 h-16 rounded-full flex items-center justify-center ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                aria-label={isActive ? 'Pausa' : 'Inizia'}
              >
                {isActive ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <RefreshCw size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-500">Modalità Ripetizioni</span>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="h-10 flex items-center justify-center">
                <div className={`bg-blue-50 rounded-full px-4 py-1.5 transition-all duration-300 ${animateSetChange ? 'bg-blue-100 transform scale-110' : ''}`}>
                  <p className={`text-sm text-blue-700 font-medium transition-all duration-300 ${animateSetChange ? 'font-bold' : ''}`}>
                    Serie <span className={`transition-all duration-300 ${animateSetChange ? 'text-blue-800 text-base' : ''}`}>{displayedSet}</span> di {exercise.sets}
                  </p>
                </div>
              </div>
              
              <div className="relative mb-3 mt-3">
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center relative overflow-hidden">
                  {animateSetChange ? (
                    <>
                      <div className="absolute inset-0 bg-blue-50 opacity-40 animate-pulse"></div>
                      <ThumbsUp 
                        size={48} 
                        className="text-blue-600 z-10 relative" 
                        style={{
                          animation: 'thumb-grow 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        }}
                      />
                      <Particles />
                      <style>{`
                        @keyframes thumb-grow {
                          0% {
                            transform: scale(0.5);
                            opacity: 0.5;
                          }
                          50% {
                            transform: scale(1.3);
                            opacity: 1;
                          }
                          75% {
                            transform: scale(0.9);
                          }
                          100% {
                            transform: scale(1);
                            opacity: 1;
                          }
                        }
                      `}</style>
                    </>
                  ) : (
                    <p className="text-4xl font-bold text-blue-700">{exercise.reps}</p>
                  )}
                </div>
                {!animateSetChange && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Ripetizioni
                  </span>
                )}
              </div>
            </div>
            
            {isResting ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-xl mb-2 text-yellow-700">Riposo</p>
                  <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                    <p className="text-2xl font-bold text-yellow-700">{formatTime(timer)}</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={handleSkipRest}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full transition-colors flex items-center gap-2"
                  >
                    <SkipForward size={18} />
                    <span>Salta riposo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={handleSetComplete}
                      className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
                      aria-label={currentSet < exercise.sets ? 'Completa Serie' : 'Completa Esercizio'}
                      disabled={animateSetChange}
                    >
                      <CheckCircle size={28} />
                    </button>
                  </div>
                </div>
                
                {currentSet < exercise.sets && (
                  <button
                    onClick={handleSkipSet}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full transition-colors flex items-center gap-2"
                  >
                    <FastForward size={18} />
                    <span>Salta Serie</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!isResting && (
        <Button
          onClick={onComplete}
          variant="outline"
          className="w-full mt-2"
        >
          Salta Esercizio
        </Button>
      )}
    </div>
  )
}

export default ExerciseGuide 