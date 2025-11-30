import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, CheckCircle, Clock, ChevronRight, Save, Upload, ArrowLeft, 
  FileText, Loader2, IndianRupee, Printer, User, Hash, Search, Filter,
  ChevronDown, ChevronUp, Calendar, Package, Edit, Trash2, Tag
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { api } from '../../services/api';
import { ReceiverBook, BookPage } from '../../types';

const ReceiverDashboard: React.FC = () => {
  const [books, setBooks] = useState<ReceiverBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const data = await api.getReceiverBooks();
    setBooks(data);
    setLoading(false);
  };

  // --- Stats Calculation ---
  const totalDistributed = books.length;
  const totalRegistered = books.filter(b => b.status === 'Registered').length;
  const totalSubmitted = books.filter(b => b.status === 'Received').length;
  const pendingBooks = books.filter(b => b.status !== 'Received').length;

  const chartData = [
    { name: 'Distributed', value: totalDistributed, color: '#6366f1' },
    { name: 'Registered', value: totalRegistered, color: '#3b82f6' },
    { name: 'Submitted', value: totalSubmitted, color: '#10b981' },
    { name: 'Pending', value: pendingBooks, color: '#f59e0b' },
  ];

  if (loading) return <div className="p-8 text-center text-slate-400">Loading Inventory...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between border-l-4 border-l-indigo-500">
            <div>
               <p className="text-xs text-slate-500 uppercase font-semibold">Total Books Distributed</p>
               <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalDistributed}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><BookOpen size={24} /></div>
         </div>
         <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
               <p className="text-xs text-slate-500 uppercase font-semibold">Total Books Registered</p>
               <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalRegistered}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><User size={24} /></div>
         </div>
         <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
               <p className="text-xs text-slate-500 uppercase font-semibold">Total Books Submitted</p>
               <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalSubmitted}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={24} /></div>
         </div>
         <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
            <div>
               <p className="text-xs text-slate-500 uppercase font-semibold">Pending Books</p>
               <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingBooks}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock size={24} /></div>
         </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Book Status Overview</h3>
          <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={60}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} fontSize={12} fontWeight={500} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
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

export default ReceiverDashboard;