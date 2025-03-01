import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dayNames } from '../../constants/days';

const WorkoutStats = ({ logs }) => {
  // Prepara i dati per il grafico
  const prepareChartData = () => {
    // Conta gli allenamenti per giorno della settimana
    const countByDay = Array(7).fill(0);
    
    logs.forEach(log => {
      countByDay[log.day_of_week - 1]++;
    });
    
    return dayNames.map((name, index) => ({
      name: name,
      count: countByDay[index]
    }));
  };
  
  const chartData = prepareChartData();
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Distribuzione Allenamenti</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WorkoutStats; 