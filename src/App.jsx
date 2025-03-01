import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import WeeklyPlanner from './components/Planner/WeeklyPlanner'
import WorkoutMode from './components/Workout/WorkoutMode'
import Profile from './components/Profile/Profile'
import WorkoutHistory from './components/History/WorkoutHistory'
import PrivateRoute from './components/Auth/PrivateRoute'
import AuthCallback from './components/Auth/AuthCallback'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/planner" element={
            <PrivateRoute>
              <WeeklyPlanner />
            </PrivateRoute>
          } />
          <Route path="/workout" element={
            <PrivateRoute>
              <WorkoutMode />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/history" element={
            <PrivateRoute>
              <WorkoutHistory />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App 