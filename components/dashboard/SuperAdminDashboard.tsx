import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  Download, Filter, CheckCircle, XCircle, ChevronDown, ChevronRight, 
  MapPin, Calendar, Search, MoreHorizontal 
} from 'lucide-react';
import { 
  getSuperAdminKPIs, getRegionStats, getMonthlyDonations, 
  getDistributionTreeData 
} from '../../services/mockData';
import { api } from '../../services/api';
import { PendingUser, TreeData, KPI } from '../../types';

// Reusable KPI Card
const AdminKPICard: React.FC<{ item: KPI }> = ({ item }) => (
  <div className={`bg-white rounded-lg p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow`}>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</p>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-bold text-slate-900">{item.value}</span>
      {item.change && (
         <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
           item.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 
           item.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
         }`}>
           {item.change}
         </span>
      )}
    </div>
  </div>
);

// Drill-down Tree Row Component
const TreeRow: React.FC<{ node: TreeData; level: number }> = ({ node, level }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <tr className={`hover:bg-slate-50 transition-colors ${expanded ? 'bg-slate-50/50' : ''}`}>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-800">
          <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-slate-200 mr-2">
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-6 mr-2"></span>
            )}
            <span className={`font-medium ${level === 0 ? 'text-indigo-900' : ''}`}>{node.name}</span>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 border border-slate-200 uppercase">{node.type}</span>
          </div>
        </td>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 text-right">{node.booksCount.toLocaleString()}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600 text-right">₹{node.amount.toLocaleString()}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
            <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px] ml-auto">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((node.amount / 3000000) * 100, 100)}%` }}></div>
            </div>
        </td>
      </tr>
      {expanded && node.children?.map(child => (
        <TreeRow key={child.id} node={child} level={level + 1} />
      ))}
    </>
  );
};

const SuperAdminDashboard: React.FC = () => {
  const [kpis] = useState(getSuperAdminKPIs());
  const [regionStats] = useState(getRegionStats());
  const [monthlyData] = useState(getMonthlyDonations());
  const [treeData] = useState(getDistributionTreeData());
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Filters State
  const [selectedRegion, setSelectedRegion] = useState('All Regions');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await api.getPendingUsers();
        setPendingUsers(users);
      } catch (err) {
        console.error("Failed to load pending users");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const handleApprove = async (id: string) => {
    await api.approveUser(id);
    setPendingUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleReject = async (id: string) => {
    await api.rejectUser(id);
    setPendingUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleExport = () => {
    api.exportData('books');
    alert("Export started. You will be notified when ready.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 hover:bg-white transition-colors"
            >
              <option>All Regions</option>
              <option>Telangana</option>
              <option>Andhra Pradesh</option>
              <option>Karnataka</option>
            </select>
          </div>
          <div className="relative hidden sm:block">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 hover:bg-white transition-colors">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
            </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => <AdminKPICard key={idx} item={kpi} />)}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stacked Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Book Status by Region</h3>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20}/></button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} fontSize={12} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="printed" stackId="a" fill="#cbd5e1" name="Printed" barSize={32} />
                <Bar dataKey="registered" stackId="a" fill="#3b82f6" name="Registered" barSize={32} />
                <Bar dataKey="received" stackId="a" fill="#10b981" name="Received" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donation Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">Donation Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} fontSize={12} />
                <Tooltip 
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                   formatter={(val) => `₹${Number(val).toLocaleString()}`}
                />
                <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{r:4, strokeWidth:0, fill:'#8b5cf6'}} activeDot={{r:6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* User Approval Widget */}
         <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 Pending Approvals
                 {pendingUsers.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>}
               </h3>
               <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3 custom-scrollbar">
               {isLoadingUsers ? (
                 <div className="text-center py-8 text-slate-400">Loading requests...</div>
               ) : pendingUsers.length === 0 ? (
                 <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                    <CheckCircle className="mb-2 text-emerald-400 opacity-50" />
                    <p>All caught up!</p>
                 </div>
               ) : (
                 pendingUsers.map(user => (
                   <div key={user.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-indigo-200 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                               <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
                               <p className="text-xs text-slate-500">{user.role}</p>
                            </div>
                         </div>
                         <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                           {user.region}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                         <button 
                           onClick={() => handleApprove(user.id)}
                           className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-1.5 rounded text-xs font-medium transition-colors"
                         >
                            <CheckCircle size={12} /> Approve
                         </button>
                         <button 
                           onClick={() => handleReject(user.id)}
                           className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 py-1.5 rounded text-xs font-medium transition-colors"
                         >
                            <XCircle size={12} /> Reject
                         </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
         </div>

         {/* Distribution Tree Drill-down */}
         <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col">
             <div className="p-5 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-slate-800">Distribution Network Explorer</h3>
               <p className="text-xs text-slate-500 mt-1">Drill down from Region to Center level</p>
            </div>
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Entity Name</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Books</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Collected</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Goal Progress</th>
                     </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                     {treeData.map(node => (
                        <TreeRow key={node.id} node={node} level={0} />
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;