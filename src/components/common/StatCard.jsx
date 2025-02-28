import React from 'react'

const StatCard = ({ title, value, Icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={20} className="text-blue-500" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

export default StatCard 