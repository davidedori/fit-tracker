import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { dayNames, dayNamesShort } from '../../constants/days';

const WorkoutStats = ({ logs }) => {
  // Prepara i dati per il grafico
  const prepareChartData = () => {
    // Conta gli allenamenti per giorno della settimana
    const countByDay = Array(7).fill(0);
    
    logs.forEach(log => {
      countByDay[log.day_of_week - 1]++;
    });
    
    return dayNamesShort.map((name, index) => ({
      name: name,
      count: countByDay[index],
      fullName: dayNames[index]
    }));
  };
  
  const chartData = prepareChartData();
  
  // Colori per le barre
  const barColors = ['#3b82f6', '#60a5fa', '#93c5fd'];
  const getBarColor = (entry, index) => {
    return entry.count > 0 ? barColors[index % barColors.length] : '#e5e7eb';
  };
  
  // Personalizza il tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-blue-600">{`Allenamenti: ${data.count}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Distribuzione Allenamenti</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            barSize={40}
          >
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              dy={10}
              tick={{ fill: '#6b7280', fontSize: 14 }}
            />
            <YAxis hide={true} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
              ))}
              <LabelList 
                dataKey="count" 
                position="center" 
                fill="#ffffff" 
                fontSize={14}
                fontWeight="bold"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WorkoutStats; 