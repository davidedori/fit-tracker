import React from 'react'
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { User, Calendar, Activity } from 'react-feather'

const Layout = () => {
  const { user } = useAuth()
  const location = useLocation()

  const menuItems = [
    { path: '/profile', label: 'Profilo', icon: User },
    { path: '/planner', label: 'Planner', icon: Calendar },
    { path: '/workout', label: 'Workout', icon: Activity }
  ]

  const isActive = (path) => location.pathname === path

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation - visible on all screens */}
      <nav className="bg-white shadow-md">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="grid grid-cols-3 h-16">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center space-y-1
                  ${isActive(item.path)
                    ? 'text-blue-500'
                    : 'text-gray-600'
                  }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
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