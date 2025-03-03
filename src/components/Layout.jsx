import React, { useEffect } from 'react'
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { User, Calendar, Activity, BarChart2, Users, Mail } from 'react-feather'

const Layout = () => {
  const { user, isTrainer } = useAuth()
  const location = useLocation()

  useEffect(() => {
    console.log('Layout montato')
    console.log('Stato utente in Layout:', user ? `ID: ${user.id}` : 'Nessuno')
    console.log('Stato trainer in Layout:', isTrainer)
    console.log('Percorso corrente:', location.pathname)
    
    return () => {
      console.log('Layout smontato')
    }
  }, [user, isTrainer, location.pathname])

  const userMenuItems = [
    { path: '/profile', label: 'Profilo', icon: User },
    { path: '/planner', label: 'Planner', icon: Calendar },
    { path: '/workout', label: 'Workout', icon: Activity },
    { path: '/history', label: 'Storico', icon: BarChart2 }
  ]

  const trainerMenuItems = [
    { path: '/trainer/dashboard', label: 'Dashboard', icon: Users },
    { path: '/trainer/invites', label: 'Inviti', icon: Mail },
    { path: '/trainer/profile', label: 'Profilo', icon: User }
  ]

  const menuItems = isTrainer ? trainerMenuItems : userMenuItems
  const isActive = (path) => location.pathname === path

  if (!user) {
    console.log('Nessun utente, reindirizzamento al login')
    return <Navigate to="/login" replace />
  }
  
  // Reindirizza i trainer alla dashboard se sono sulla pagina profilo
  if (isTrainer && location.pathname === '/profile') {
    console.log('Trainer reindirizzato alla dashboard')
    return <Navigate to="/trainer/dashboard" replace />
  }

  console.log('Rendering Layout con menuItems:', menuItems)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation - visible on all screens */}
      <nav className="bg-white shadow-md relative z-[200]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Activity className="h-6 w-6 mr-2" />
                <span className="text-xl font-bold">FitTracker</span>
              </div>
              {/* Desktop menu */}
              <div className="hidden md:flex md:ml-6 space-x-2">
                {menuItems.map(item => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1
                        ${isActive(item.path)
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[100]">
        <div className="flex justify-around items-center">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-1 flex-col items-center py-3 px-1
                  ${isActive(item.path)
                    ? 'text-blue-500'
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <main className="py-6 mb-16 md:mb-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout 