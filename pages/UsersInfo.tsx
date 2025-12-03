
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Building2, UserPlus, Search, Filter, 
  MapPin, Save, Upload, Download
} from 'lucide-react';

const LOCATION_DATA: Record<string, Record<string, string[]>> = {};
const OFFICE_ROLES = ['Book Distributor', 'Staff', 'Book Receiver'];
const PEOPLE_ROLES = ['Individual', 'Incharge', 'Coordinator'];

interface UserData {
  id: string;
  name: string;
  phone: string;
  role: string;
  section: 'Office' | 'People';
  state: string;
  district: string;
  town: string;
  center: string;
  pssmId?: string;
}

const UsersInfo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Office' | 'People' | 'Add User'>('Office');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: '', district: '', town: '', center: '' });
  const [selectedRole, setSelectedRole] = useState<string>('Book Distributor');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ section: 'Office', role: 'Book Distributor', name: '', phone: '', pssmId: '', state: '', district: '', town: '', center: '' });

  useEffect(() => {
    setTimeout(() => {
      setUsers([]); // Start Empty
      setLoading(false);
    }, 300);
  }, []);

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserData = {
      id: `new-${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      section: formData.section as 'Office' | 'People',
      state: formData.state,
      district: formData.district,
      town: formData.town,
      center: formData.center,
      pssmId: formData.pssmId
    };
    setUsers([newUser, ...users]);
    setActiveTab(formData.section as 'Office' | 'People');
  };

  const filteredUsers = useMemo(() => {
    if (activeTab === 'Add User') return [];
    return users.filter(user => {
      if (user.section !== activeTab) return false;
      if (user.role !== selectedRole) return false;
      return true;
    });
  }, [users, activeTab, selectedRole]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Users Info</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
        <div className="flex border-b bg-slate-50">
          <button onClick={() => setActiveTab('Office')} className={`flex-1 py-4 font-bold ${activeTab === 'Office' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Office</button>
          <button onClick={() => setActiveTab('People')} className={`flex-1 py-4 font-bold ${activeTab === 'People' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>People</button>
          <button onClick={() => setActiveTab('Add User')} className={`flex-1 py-4 font-bold ${activeTab === 'Add User' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Add User</button>
        </div>

        <div className="flex-1 p-6">
          {activeTab === 'Add User' ? (
             <form onSubmit={handleAddUserSubmit} className="max-w-2xl mx-auto space-y-4">
                <input type="text" placeholder="Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded" />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Add User</button>
             </form>
          ) : (
             <>
               <div className="flex gap-4 mb-4">
                  <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="border p-2 rounded">
                     {(activeTab === 'Office' ? OFFICE_ROLES : PEOPLE_ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
               </div>
               {loading ? <div>Loading...</div> : (
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 font-bold text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Role</th></tr></thead>
                     <tbody>
                        {filteredUsers.length === 0 ? <tr><td colSpan={3} className="p-6 text-center text-slate-400">No users found.</td></tr> : 
                           filteredUsers.map(u => <tr key={u.id} className="border-t"><td className="p-3">{u.name}</td><td className="p-3">{u.phone}</td><td className="p-3">{u.role}</td></tr>)
                        }
                     </tbody>
                  </table>
               )}
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersInfo;
