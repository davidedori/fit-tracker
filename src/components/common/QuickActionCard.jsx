import React from 'react'
import { Link } from 'react-router-dom'

const QuickActionCard = ({ title, description, Icon, link }) => {
  return (
    <Link 
      to={link} 
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-50 rounded-full">
          <Icon size={18} className="text-blue-500" />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </Link>
  )
}

export default QuickActionCard 