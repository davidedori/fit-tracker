import React from 'react'
import { Link } from 'react-router-dom'

const QuickActionCard = ({ title, description, Icon, link }) => {
  return (
    <Link 
      to={link} 
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={20} className="text-blue-500" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </Link>
  )
}

export default QuickActionCard 