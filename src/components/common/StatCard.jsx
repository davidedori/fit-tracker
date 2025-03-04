import React from 'react'

const StatCard = ({ title, value, Icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-50 rounded-full">
          <Icon size={18} className="text-blue-500" />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

export default StatCard 