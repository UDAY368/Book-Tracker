import React, { useState } from 'react';
import { UserRole, KPI } from '../types';
import { 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ArrowUpDown } from 'lucide-react';
import { getMockKPIs, getBookStatusData, getMonthlyDonations } from '../services/mockData';
import SuperAdminDashboard from '../components/dashboard/SuperAdminDashboard';
import DistributorDashboard from '../components/dashboard/DistributorDashboard';
import InchargeDashboard from '../components/dashboard/InchargeDashboard';
import ReceiverDashboard from '../components/dashboard/ReceiverDashboard';

interface DashboardProps {
  role: UserRole;
}

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

// Reusable Card Component with strict typing
const KPICard: React.FC<{ item: KPI }> = ({ item }) => (
  <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
    <dt className="truncate text-sm font-medium text-slate-500">{item.label}</dt>
    <dd className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</dd>
    <div className="mt-2 flex items-center text-sm">
      {item.trend === 'up' && <span className="text-emerald-600 font-medium">{item.change}</span>}
      {item.trend === 'down' && <span className="text-red-600 font-medium">{item.change}</span>}
      {item.trend === 'neutral' && <span className="text-slate-600 font-medium">{item.change}</span>}
      {item.change && <span className="ml-2 text-slate-400">from last month</span>}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Book Status Pie Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Book Status Overview</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getBookStatusData()}
                cx="50%"
                cy="45%"
                innerRadius={80}
                outerRadius={115}
                cornerRadius={6}
                fill="#8884d8"
                paddingAngle={6}
                dataKey="value"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  
                  if (percent < 0.05) return null;

                  return (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {getBookStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: 600, color: '#334155' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: '24px', fontSize: '14px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donation Trends Line Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Donation Collection Trend</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getMonthlyDonations()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} dot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const DashboardContainer: React.FC<DashboardProps> = ({ role }) => {
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");

  // Super Admin View
  if (role === UserRole.SUPER_ADMIN) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Super Admin Overview</h2>
            <p className="text-slate-500 text-sm mt-1">Manage the entire PSSM donation ecosystem from here.</p>
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
        <SuperAdminDashboard />
      </div>
    );
  }

  // Distributor View
  if (role === UserRole.BOOK_DISTRIBUTOR) {
    return (
      <div className="space-y-6">
        <DistributorDashboard />
      </div>
    );
  }

  // Staff / Incharge View (Center, District, Autonomous)
  if (role === UserRole.INCHARGE || role === UserRole.STAFF) {
     return (
        <div className="space-y-6">
           <InchargeDashboard />
        </div>
     );
  }

  // Book Receiver View
  if (role === UserRole.BOOK_RECEIVER) {
    return (
      <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
        <ReceiverDashboard />
      </div>
    );
  }

  // Standard Dashboard for other roles (Volunteer, etc.)
  const kpis = getMockKPIs();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {role} Dashboard
          </h2>
          <p className="text-slate-500 text-sm">Welcome back, here is your activity overview.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICard key={index} item={kpi} />
        ))}
      </div>

      <Dashboard />
    </div>
  );
};

export default DashboardContainer;