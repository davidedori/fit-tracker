import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Input from '../common/Input'
import { Activity } from 'react-feather'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('message') === 'check-email') {
      setMessage('Per favore controlla la tua email per verificare il tuo account')
    }
  }, [location])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      navigate('/')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="max-w-md w-full m-4 space-y-8 p-10 bg-white rounded-xl shadow-2xl">
        <div className="flex justify-center items-center gap-2">
          <Activity className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-bold text-gray-900">FitTracker</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Accedi al tuo account
        </h2>
        {error && <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">{error}</div>}
        {message && <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-center">{message}</div>}
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <div className="flex items-center justify-end">
            <Link 
              to="/reset-password" 
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Password dimenticata?
            </Link>
          </div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Accedi
          </button>
        </form>
        <div className="text-center mt-4">
          <Link 
            to="/register" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Non hai un account? Registrati
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login 