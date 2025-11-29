import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, AlertCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { api } from '../../services/api';
import { InchargeStats } from '../../types';

const InchargeDashboard: React.FC = () => {
  const [stats, setStats] = useState<InchargeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const s = await api.getInchargeStats();
      setStats(s);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading || !stats) return <div className="p-8 text-center text-slate-400">Loading Dashboard...</div>;

  // Data for the Bar Chart
  const chartData = [
    { name: 'My Inventory', value: stats.totalAssigned, color: '#6366f1' }, // Indigo
    { name: 'Registered', value: stats.distributed, color: '#10b981' },   // Emerald
    { name: 'Pending', value: stats.pendingDetails, color: '#f59e0b' },   // Amber
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-indigo-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">My Inventory</p>
            <div className="flex justify-between items-end mt-2">
               <h3 className="text-2xl font-bold text-slate-900">{stats.totalAssigned}</h3>
               <BookOpen className="text-indigo-200" size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">Registered Books</p>
            <div className="flex justify-between items-end mt-2">
               <h3 className="text-2xl font-bold text-slate-900">{stats.distributed}</h3>
               <Users className="text-emerald-200" size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">Registration Pending</p>
            <div className="flex justify-between items-end mt-2">
               <h3 className="text-2xl font-bold text-slate-900">{stats.pendingDetails}</h3>
               <AlertCircle className="text-amber-200" size={24} />
            </div>
         </div>
      </div>

      {/* Interactive Bar Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
         <h3 className="text-lg font-bold text-slate-800 mb-6">Books Status Overview</h3>
         <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={60}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                     dataKey="name" 
                     stroke="#64748b" 
                     axisLine={false} 
                     tickLine={false} 
                     dy={10} 
                     fontSize={12}
                     fontWeight={500}
                  />
                  <YAxis 
                     stroke="#64748b" 
                     axisLine={false} 
                     tickLine={false} 
                     fontSize={12}
                  />
                  <Tooltip 
                     cursor={{fill: '#f8fafc'}}
                     contentStyle={{
                        backgroundColor: '#fff', 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                     }}
                     formatter={(value: number) => [value, 'Books']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1000}>
                     {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

    </div>
  );
};

export default InchargeDashboard;