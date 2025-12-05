
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Download, Printer, 
  Package, Loader2, MapPin, Truck, Calendar, Layers, Eye, X, User, CreditCard, Phone
} from 'lucide-react';
import { api } from '../services/api';

const YAGAM_OPTIONS = ["Dhyana Maha Yagam - 1", "Dhyana Maha Yagam - 2", "Dhyana Maha Yagam - 3", "Dhyana Maha Yagam - 4"];

const KPICard = ({ title, value, icon: Icon, color, subtext }: { title: string, value: string | number, icon: any, color: string, subtext?: string }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
       <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
       <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
       {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
       <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
  </div>
);

const DistributionStats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'details'>('overview');
  const [loading, setLoading] = useState(true);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsSearchQuery, setDetailsSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsPage, setDetailsPage] = useState(1);
  const itemsPerPage = 8;

  // View Modal State
  const [viewModalData, setViewModalData] = useState<any | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [distData, batchData] = await Promise.all([
        api.getDistributions(),
        api.getBatches()
      ]);
      setDistributions(distData);
      setBatches(batchData);
      setLoading(false);
    };
    loadData();
  }, [selectedYagam]);

  // --- Calculations for Overview ---
  const totalDistributed = distributions.reduce((sum, d) => sum + d.count, 0);
  const totalPrinted = batches.reduce((sum, b) => sum + b.totalBooks, 0);
  const distributionByType = useMemo(() => {
      const counts: Record<string, number> = { 'Individual': 0, 'Center': 0, 'District': 0, 'Autonomous': 0 };
      distributions.forEach(d => {
          if (counts[d.type] !== undefined) counts[d.type] += d.count;
          else counts[d.type] = (counts[d.type] || 0) + d.count;
      });
      return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [distributions]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];

  // --- Filtered Lists ---
  // 1. Batches
  const filteredBatches = batches.filter(b => 
     b.batchName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedBatches = filteredBatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalBatchPages = Math.ceil(filteredBatches.length / itemsPerPage);

  // 2. Distributions (Details Tab)
  const filteredDistributions = distributions.filter(d => 
    d.name?.toLowerCase().includes(detailsSearchQuery.toLowerCase()) ||
    d.phone?.includes(detailsSearchQuery) ||
    d.type?.toLowerCase().includes(detailsSearchQuery.toLowerCase()) ||
    d.entityName?.toLowerCase().includes(detailsSearchQuery.toLowerCase())
  );
  const paginatedDetails = filteredDistributions.slice((detailsPage - 1) * itemsPerPage, detailsPage * itemsPerPage);
  const totalDetailsPages = Math.ceil(filteredDistributions.length / itemsPerPage);

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return dateStr; }
  };

  if (loading) {
      return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-full pb-20 animate-in fade-in duration-500 relative">
      
      {/* --- View Modal for Distribution Details --- */}
      {viewModalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewModalData(null)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                 <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Incharge Information</h3>
                    <button onClick={() => setViewModalData(null)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm border border-slate-200"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                         <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 shrink-0">
                             <User size={24} />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Incharge Name</label>
                             <p className="text-lg font-bold text-slate-900">{viewModalData.name}</p>
                             <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium border ${viewModalData.type === 'Individual' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                {viewModalData.type}
                             </span>
                         </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {viewModalData.type === 'Center' ? 'Center Name' : viewModalData.type === 'District' ? 'District Name' : viewModalData.type === 'Autonomous' ? 'Autonomous Body' : 'Type Detail'}
                         </label>
                         <p className="text-sm font-medium text-slate-900 mt-1">{viewModalData.entityName || '-'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><CreditCard size={12}/> PSSM ID</label>
                             <p className="text-sm font-medium text-slate-700 mt-1">{viewModalData.pssmId || 'N/A'}</p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Phone size={12}/> Phone</label>
                             <p className="text-sm font-medium text-slate-700 mt-1">{viewModalData.phone}</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Calendar size={12}/> Distribution Date</label>
                         <p className="text-sm font-medium text-slate-700 mt-1">{formatDate(viewModalData.date)}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><MapPin size={12}/> Address</label>
                         <p className="text-sm font-medium text-slate-700 mt-1 leading-relaxed">{viewModalData.address}</p>
                    </div>
                </div>
                 <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setViewModalData(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm text-slate-700">Close</button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Distribution Statistics</h2>
           <p className="text-slate-500 text-sm mt-1">Analytics on print batches and distribution channels.</p>
        </div>
        <div className="w-full md:w-auto bg-indigo-50 p-2 rounded-lg border border-indigo-100">
            <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1 ml-1">Event Context</label>
            <div className="relative">
                <select 
                    value={selectedYagam}
                    onChange={(e) => setSelectedYagam(e.target.value)}
                    className="w-full md:w-64 appearance-none bg-white border border-indigo-200 text-indigo-700 font-bold py-2 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm"
                >
                    {YAGAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-600">
                    <ArrowUpDown size={14} />
                </div>
            </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <KPICard title="Total Printed" value={totalPrinted.toLocaleString()} icon={Printer} color="bg-slate-600" subtext="Books in Batches" />
         <KPICard title="Total Distributed" value={totalDistributed.toLocaleString()} icon={Truck} color="bg-indigo-600" subtext="Allocated to Incharges" />
         <KPICard title="Active Batches" value={batches.length} icon={Layers} color="bg-blue-600" />
         <KPICard title="Distributions Count" value={distributions.length} icon={Package} color="bg-emerald-600" subtext="Total Shipments" />
      </div>

      {/* Tabs Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
         <div className="border-b border-slate-200 px-6 flex items-center gap-6 overflow-x-auto">
            <button onClick={() => setActiveTab('overview')} className={`py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Overview Analytics</button>
            <button onClick={() => setActiveTab('batches')} className={`py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'batches' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Batches Inventory</button>
            <button onClick={() => setActiveTab('details')} className={`py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'details' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Distribution Details</button>
         </div>
         
         <div className="p-6 flex-1 bg-slate-50/50">
             {/* --- OVERVIEW TAB --- */}
             {activeTab === 'overview' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Chart 1: Distribution by Type */}
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">Distribution by Channel</h3>
                        <div className="h-72 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={distributionByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {distributionByType.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                 </Pie>
                                 <Tooltip />
                                 <Legend verticalAlign="bottom" height={36} />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Chart 2: Recent Activity */}
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-4">Recent Distributions</h3>
                        <div className="flex-1 overflow-auto">
                           {distributions.length === 0 ? (
                               <div className="h-full flex items-center justify-center text-slate-400 text-sm">No recent activity</div>
                           ) : (
                               <div className="space-y-3">
                                   {distributions.slice(0, 5).map((dist, idx) => (
                                       <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {dist.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{dist.name}</p>
                                                    <p className="text-xs text-slate-500 flex items-center"><MapPin size={10} className="mr-1"/> {dist.address?.split(',').slice(-2).join(', ')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-indigo-600">{dist.count} Books</p>
                                                <p className="text-xs text-slate-400">{new Date(dist.date).toLocaleDateString()}</p>
                                            </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                        </div>
                     </div>
                 </div>
             )}

             {/* --- BATCHES TAB --- */}
             {activeTab === 'batches' && (
                 <div className="space-y-4">
                     <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                               type="text" 
                               placeholder="Search Batch Name or Status..." 
                               value={searchQuery} 
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="pl-9 pr-4 py-2 w-full text-sm border-none focus:ring-0"
                            />
                        </div>
                     </div>

                     <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                           <thead className="bg-slate-50">
                              <tr>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Batch Name</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Printed Date</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Serial Range</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Total / Remaining</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                              </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-slate-100">
                              {paginatedBatches.length === 0 ? (
                                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No batches found.</td></tr>
                              ) : (
                                  paginatedBatches.map(batch => (
                                      <tr key={batch.id} className="hover:bg-slate-50">
                                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{batch.batchName}</td>
                                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(batch.printedDate).toLocaleDateString()}</td>
                                          <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">{batch.bookSerialStart} - {batch.bookSerialEnd}</td>
                                          <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                              {batch.totalBooks} <span className="text-slate-400 font-normal mx-1">/</span> <span className="text-emerald-600">{batch.remainingBooks ?? batch.totalBooks}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                                  batch.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                  batch.status === 'Fully Distributed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                  'bg-amber-100 text-amber-700 border-amber-200'
                                              }`}>
                                                  {batch.status}
                                              </span>
                                          </td>
                                      </tr>
                                  ))
                              )}
                           </tbody>
                        </table>
                     </div>

                     {/* Pagination */}
                     {totalBatchPages > 1 && (
                         <div className="flex justify-between items-center pt-2">
                             <div className="text-xs text-slate-500">Page {currentPage} of {totalBatchPages}</div>
                             <div className="flex gap-2">
                                 <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronLeft size={16}/></button>
                                 <button onClick={() => setCurrentPage(p => Math.min(totalBatchPages, p+1))} disabled={currentPage===totalBatchPages} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronRight size={16}/></button>
                             </div>
                         </div>
                     )}
                 </div>
             )}

             {/* --- NEW DISTRIBUTION DETAILS TAB --- */}
             {activeTab === 'details' && (
                 <div className="space-y-4">
                     <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                               type="text" 
                               placeholder="Search Incharge, Phone, Type or Entity..." 
                               value={detailsSearchQuery} 
                               onChange={(e) => setDetailsSearchQuery(e.target.value)}
                               className="pl-9 pr-4 py-2 w-full text-sm border-none focus:ring-0"
                            />
                        </div>
                     </div>

                     <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                           <thead className="bg-slate-50">
                              <tr>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Incharge</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                                 <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type Name</th>
                                 <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Distribute</th>
                                 <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Register</th>
                                 <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Submit</th>
                                 <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Updated</th>
                                 <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                              </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-slate-100">
                              {paginatedDetails.length === 0 ? (
                                  <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">No distribution records found.</td></tr>
                              ) : (
                                  paginatedDetails.map(dist => (
                                      <tr key={dist.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{formatDate(dist.date)}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{dist.name}</td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                  dist.type === 'Individual' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                                  dist.type === 'District' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                  'bg-purple-50 text-purple-700 border-purple-100'
                                              }`}>
                                                  {dist.type}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                                              {dist.type === 'Individual' ? '-' : (dist.entityName || '-')}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-indigo-600">{dist.count}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-800 font-bold">{dist.registeredCount}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-800 font-bold">{dist.submittedCount}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-800 font-bold">{dist.donorUpdatedCount}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-right">
                                              <button 
                                                  onClick={() => setViewModalData(dist)}
                                                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                                              >
                                                  View
                                              </button>
                                          </td>
                                      </tr>
                                  ))
                              )}
                           </tbody>
                        </table>
                     </div>

                     {/* Pagination for Details Tab */}
                     {totalDetailsPages > 1 && (
                         <div className="flex justify-between items-center pt-2">
                             <div className="text-xs text-slate-500">Page {detailsPage} of {totalDetailsPages}</div>
                             <div className="flex gap-2">
                                 <button onClick={() => setDetailsPage(p => Math.max(1, p-1))} disabled={detailsPage===1} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronLeft size={16}/></button>
                                 <button onClick={() => setDetailsPage(p => Math.min(totalDetailsPages, p+1))} disabled={detailsPage===totalDetailsPages} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronRight size={16}/></button>
                             </div>
                         </div>
                     )}
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default DistributionStats;
