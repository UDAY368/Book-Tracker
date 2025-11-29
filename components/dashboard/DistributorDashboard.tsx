import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Package, Truck, ClipboardList, BookOpen, Printer, X, Search, Calendar, Hash, 
  AlertCircle, ArrowRight, CheckCircle, Clock 
} from 'lucide-react';
import { api } from '../../services/api';
import { DistributorStats, PrintBatch } from '../../types';

// Enhanced Card Component to show Total vs Gap
const LifecycleCard: React.FC<{ 
  title: string; 
  mainValue: number; 
  icon: React.ReactNode; 
  baseColor: string; // tailwind class prefix e.g., "emerald"
  gapLabel: string;
  gapValue: number;
  gapColor: string; // tailwind class prefix e.g. "amber"
  isFinal?: boolean;
}> = ({ title, mainValue, icon, baseColor, gapLabel, gapValue, gapColor, isFinal }) => {
  
  // Dynamic color classes
  const bgSoft = `bg-${baseColor}-50`;
  const textDark = `text-${baseColor}-700`;
  const textLight = `text-${baseColor}-600`;
  const borderClass = `border-${baseColor}-100`;
  
  const gapBg = `bg-${gapColor}-50`;
  const gapText = `text-${gapColor}-700`;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full`}>
      {/* Top Section: Main Stat */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-lg ${bgSoft} ${textDark}`}>
            {icon}
          </div>
          {isFinal && (
             <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2 py-1 rounded-full">
               Goal
             </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{mainValue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Bottom Section: Gap Analysis */}
      <div className={`px-5 py-3 border-t border-slate-100 ${gapBg}`}>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              {!isFinal ? (
                <AlertCircle size={14} className={gapText} />
              ) : (
                <CheckCircle size={14} className={gapText} />
              )}
              <span className={`text-xs font-semibold uppercase ${gapText}`}>{gapLabel}</span>
           </div>
           <span className={`text-sm font-bold ${gapText}`}>{gapValue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const DistributorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DistributorStats | null>(null);
  const [batches, setBatches] = useState<PrintBatch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showAllBatches, setShowAllBatches] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [statsData, batchesData] = await Promise.all([
        api.getDistributorStats(),
        api.getBatches()
      ]);
      setStats(statsData);
      setBatches(batchesData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading || !stats) {
    return <div className="p-8 text-center text-slate-400">Loading Dashboard...</div>;
  }

  // Calculate Gaps
  const unassignedBooks = stats.printedNotDistributed; // Total Printed - Distributed
  const unregisteredBooks = stats.distributedNotRegistered; // Distributed - Registered
  const notSubmittedBooks = stats.registeredNotReceived; // Registered - Submitted
  
  // Completion Rate for Final Card
  const completionRate = Math.round((stats.totalReceived / stats.totalPrinted) * 100);

  // Data for the waterfall/flow chart
  const flowData = [
    { name: 'Printed', value: stats.totalPrinted, color: '#64748b' },
    { name: 'Distributed', value: stats.totalDistributed, color: '#6366f1' },
    { name: 'Registered', value: stats.totalRegistered, color: '#3b82f6' },
    { name: 'Submitted', value: stats.totalReceived, color: '#10b981' },
  ];

  const filteredBatches = batches.filter(b => 
    b.batchName.toLowerCase().includes(batchSearch.toLowerCase()) || 
    b.status.toLowerCase().includes(batchSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Lifecycle Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Printed -> Unassigned */}
        <LifecycleCard 
          title="Total Printed"
          mainValue={stats.totalPrinted}
          icon={<Printer size={24} />}
          baseColor="slate"
          gapLabel="Unassigned Books"
          gapValue={unassignedBooks}
          gapColor="slate" // Neutral as it's inventory
        />

        {/* Card 2: Distributed -> Unregistered */}
        <LifecycleCard 
          title="Total Distributed"
          mainValue={stats.totalDistributed}
          icon={<Truck size={24} />}
          baseColor="indigo"
          gapLabel="Unregistered"
          gapValue={unregisteredBooks}
          gapColor="amber" // Warning: needs registration
        />

        {/* Card 3: Registered -> Not Submitted */}
        <LifecycleCard 
          title="Total Registered"
          mainValue={stats.totalRegistered}
          icon={<ClipboardList size={24} />}
          baseColor="blue"
          gapLabel="Not Submitted"
          gapValue={notSubmittedBooks}
          gapColor="red" // Critical: Needs collection
        />

        {/* Card 4: Submitted -> Completion */}
        <LifecycleCard 
          title="Total Submitted"
          mainValue={stats.totalReceived}
          icon={<CheckCircle size={24} />}
          baseColor="emerald"
          gapLabel="Completion Rate"
          gapValue={`${completionRate}%` as any}
          gapColor="emerald" // Success
          isFinal={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Distribution Funnel</h3>
               <p className="text-sm text-slate-500">Visualizing the drop-off at each stage</p>
             </div>
             <div className="flex gap-2">
                <span className="flex items-center text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-slate-500 mr-1"></div> Printed</span>
                <span className="flex items-center text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-indigo-500 mr-1"></div> Dist.</span>
                <span className="flex items-center text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div> Reg.</span>
                <span className="flex items-center text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div> Sub.</span>
             </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 500}}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {flowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Batches List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Print Batches</h3>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
             {batches.slice(0, 5).map(batch => (
               <div key={batch.id} className="flex flex-col p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-800 text-sm">{batch.batchName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      batch.status === 'In Stock' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      batch.status === 'Partially Distributed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                     <span className="font-mono">{batch.totalBooks.toLocaleString()} books</span>
                     <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(batch.printedDate).toLocaleDateString()}</span>
                  </div>
               </div>
             ))}
          </div>
          <button 
             onClick={() => setShowAllBatches(true)}
             className="w-full mt-4 flex items-center justify-center text-sm text-white bg-slate-900 font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
             View All Batches <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>

      {/* --- View All Batches Modal --- */}
      {showAllBatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowAllBatches(false)}
          />
          
          {/* Modal Content */}
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">All Print Batches</h3>
                <p className="text-sm text-slate-500">History of all book printing orders</p>
              </div>
              <button 
                onClick={() => setShowAllBatches(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search batches..." 
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="text-sm text-slate-500 ml-auto">
                Showing {filteredBatches.length} batches
              </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto p-0 flex-1">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch Details</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Serial Range</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredBatches.length > 0 ? (
                    filteredBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-slate-100 rounded text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors mr-3">
                              <Printer size={16} />
                            </div>
                            <span className="font-medium text-slate-900">{batch.batchName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                           <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(batch.printedDate).toLocaleDateString()}
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono bg-slate-50/50">
                           <div className="flex items-center gap-2">
                              <Hash size={14} className="text-slate-400" />
                              {batch.bookSerialStart} - {batch.bookSerialEnd}
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 text-center">
                          {batch.totalBooks.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                             batch.status === 'In Stock' ? 'bg-slate-100 text-slate-800 border-slate-200' :
                             batch.status === 'Partially Distributed' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                             'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No batches found matching "{batchSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl shrink-0 flex justify-end">
               <button 
                 onClick={() => setShowAllBatches(false)}
                 className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
               >
                 Close
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorDashboard;