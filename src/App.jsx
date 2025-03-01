import React, { useEffect } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import WeeklyPlanner from './components/Planner/WeeklyPlanner'
import WorkoutMode from './components/Workout/WorkoutMode'
import Profile from './components/Profile/Profile'
import WorkoutHistory from './components/History/WorkoutHistory'
import TrainerDashboard from './components/Trainer/TrainerDashboard'
import ClientPlanner from './components/Trainer/ClientPlanner'
import PrivateRoute from './components/Auth/PrivateRoute'
import TrainerRoute from './components/Auth/TrainerRoute'
import AuthCallback from './components/Auth/AuthCallback'
import ScrollToTop from './components/common/ScrollToTop'

// Componente per gestire il reindirizzamento in base al ruolo
const HomeRedirect = () => {
  const { isTrainer } = useAuth()
  return <Navigate to={isTrainer ? "/trainer/dashboard" : "/profile"} replace />
}

function App() {
  useEffect(() => {
    console.log('App montata')
    return () => {
      console.log('App smontata')
    }
  }, [])

  return (
    <AuthProvider>
      <div className="app-container">
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Rotte utente normale */}
            <Route path="/planner" element={<PrivateRoute><WeeklyPlanner /></PrivateRoute>} />
            <Route path="/workout" element={<PrivateRoute><WorkoutMode /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><WorkoutHistory /></PrivateRoute>} />
            
            {/* Rotte trainer */}
            <Route path="/trainer/dashboard" element={<TrainerRoute><TrainerDashboard /></TrainerRoute>} />
            <Route path="/trainer/client/:clientId" element={<TrainerRoute><ClientPlanner /></TrainerRoute>} />
            <Route path="/trainer/profile" element={<TrainerRoute><Profile /></TrainerRoute>} />
          </Route>
          <Route path="*" element={
            <div className="flex justify-center items-center h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Pagina non trovata</h1>
                <p className="mb-4">La pagina che stai cercando non esiste.</p>
                <Link to="/" className="bg-blue-500 text-white px-4 py-2 rounded">
                  Torna alla home
                </Link>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App 