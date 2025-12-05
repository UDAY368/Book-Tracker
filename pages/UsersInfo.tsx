
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Building2, UserPlus, Search, Filter, 
  MapPin, Save, Edit, Eye, Phone, Mail, CreditCard,
  X, CheckCircle, Loader2, ChevronDown, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

// --- Constants ---
const OFFICE_ROLES = ['Book Distributor', 'Staff'];
const PEOPLE_ROLES = ['Individual', 'District Incharge', 'Center Incharge', 'Autonomous Body Incharge'];

// --- Types ---
interface SystemUser {
  id: string;
  section: 'Office' | 'People';
  role: string;
  name: string;
  phone: string;
  email: string;
  pssmId: string;
  address: {
    state: string;
    district: string;
    town: string;
    pincode: string;
  };
}

// --- Searchable Select Component (Reused) ---
const SearchableSelect = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder,
  disabled = false,
  className = ""
}: { 
  label: string, 
  value: string, 
  options: string[], 
  onChange: (val: string) => void, 
  placeholder: string, 
  disabled?: boolean,
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
      setFilter(value || '');
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
          <input
              type="text"
              value={filter} 
              onClick={() => !disabled && setIsOpen(!isOpen)}
              onChange={(e) => {
                  setFilter(e.target.value);
                  if (e.target.value === '') onChange(''); 
                  setIsOpen(true);
              }}
              disabled={disabled}
              className="block w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all font-medium text-slate-800 placeholder-slate-400"
              placeholder={placeholder}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              autoComplete="off"
          />
          
          {!disabled && value && (
             <button 
                type="button"
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onChange(''); 
                    setFilter(''); 
                }}
                className="absolute right-8 top-2.5 text-slate-400 hover:text-red-500 transition-colors z-10"
                title="Clear"
             >
                <X size={14} />
             </button>
          )}

          {!disabled && (
              <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                  <ChevronDown size={16} />
              </div>
          )}
      </div>
      
      {isOpen && filteredOptions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-56 rounded-lg py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none custom-scrollbar border border-slate-100 animate-in fade-in zoom-in-95 duration-100">
              {filteredOptions.map((opt) => (
                  <li 
                      key={opt}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-slate-900 transition-colors font-medium border-b border-slate-50 last:border-0"
                      onMouseDown={(e) => {
                          e.preventDefault(); 
                          onChange(opt);
                          setFilter(opt);
                          setIsOpen(false);
                      }}
                  >
                      {opt}
                  </li>
              ))}
          </ul>
      )}
    </div>
  );
};

const UsersInfo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Office' | 'People' | 'Add User'>('Office');
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationData, setLocationData] = useState<any>({});
  
  // Filtering
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit User Form State
  const initialFormState = {
      section: 'Office',
      role: '',
      name: '',
      phone: '',
      email: '',
      pssmId: '',
      state: '',
      district: '',
      town: '',
      pincode: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null); // If set, we are editing this ID

  // Modal State
  const [viewModalUser, setViewModalUser] = useState<SystemUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Reuses form logic in modal

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [userData, locData] = await Promise.all([
        api.getUsers(),
        api.getLocations()
    ]);
    setUsers(userData);
    setLocationData(locData);
    setLoading(false);
  };

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Reset dependent fields if section changes
      if (name === 'section') {
          setFormData(prev => ({ ...prev, role: '' }));
      }
  };

  const handleLocationChange = (field: string, value: string) => {
      setFormData(prev => {
          const next = { ...prev, [field]: value };
          if (field === 'state') { next.district = ''; next.town = ''; }
          if (field === 'district') { next.town = ''; }
          return next;
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      const payload: SystemUser = {
          id: editModeId || `user-${Date.now()}`,
          section: formData.section as 'Office' | 'People',
          role: formData.role,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          pssmId: formData.pssmId,
          address: {
              state: formData.state,
              district: formData.district,
              town: formData.town,
              pincode: formData.pincode
          }
      };

      await api.saveUser(payload);
      await loadData(); // Refresh list

      setToastMessage(editModeId ? 'User Updated Successfully' : 'User Added Successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      if (isEditModalOpen) {
          setIsEditModalOpen(false);
          setEditModeId(null);
      } else {
          // Reset form if in 'Add User' tab
          setFormData(initialFormState);
      }
      setIsSubmitting(false);
  };

  const openEditModal = (user: SystemUser) => {
      setEditModeId(user.id);
      setFormData({
          section: user.section,
          role: user.role,
          name: user.name,
          phone: user.phone,
          email: user.email,
          pssmId: user.pssmId,
          state: user.address?.state || '',
          district: user.address?.district || '',
          town: user.address?.town || '',
          pincode: user.address?.pincode || ''
      });
      setIsEditModalOpen(true);
      setViewModalUser(null); // Close view modal if open
  };

  // --- Derived Data ---
  const filteredUsers = useMemo(() => {
      if (activeTab === 'Add User') return [];
      
      return users.filter(user => {
          if (user.section !== activeTab) return false;
          
          if (selectedRoleFilter && user.role !== selectedRoleFilter) return false;
          
          if (searchQuery) {
              const q = searchQuery.toLowerCase();
              return user.name.toLowerCase().includes(q) || 
                     user.phone.includes(q) ||
                     user.pssmId.toLowerCase().includes(q);
          }
          return true;
      });
  }, [users, activeTab, selectedRoleFilter, searchQuery]);

  // Dropdown Lists
  const states = Object.keys(locationData).sort();
  const districts = formData.state ? Object.keys(locationData[formData.state] || {}).sort() : [];
  const towns = formData.district ? Object.keys(locationData[formData.state]?.[formData.district] || {}).sort() : [];

  return (
    <div className="space-y-6 pb-20 relative">
        
        {/* Toast */}
        {showToast && (
            <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right duration-300">
                <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-lg border border-emerald-200 flex items-center gap-2">
                    <CheckCircle size={18} /><span>{toastMessage}</span>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">User Info</h2>
                <p className="text-slate-500 text-sm mt-1">Manage people and office staff details.</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center">
                    <Users size={16} className="mr-2"/> Total: {users.length}
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50">
                <button 
                    onClick={() => { setActiveTab('Office'); setSelectedRoleFilter(''); setSearchQuery(''); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'Office' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Building2 size={16}/> Office
                </button>
                <button 
                    onClick={() => { setActiveTab('People'); setSelectedRoleFilter(''); setSearchQuery(''); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'People' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={16}/> People
                </button>
                <button 
                    onClick={() => { setActiveTab('Add User'); setFormData(initialFormState); setEditModeId(null); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'Add User' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <UserPlus size={16}/> Add User
                </button>
            </div>

            <div className="flex-1 p-0">
                {/* --- ADD USER TAB --- */}
                {activeTab === 'Add User' && (
                    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            
                            {/* Section 1: Role Selection */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
                                    <Users size={16} className="text-indigo-600"/> Role Configuration
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Person Type</label>
                                        <select 
                                            name="section" 
                                            value={formData.section} 
                                            onChange={handleInputChange} 
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="Office">Office</option>
                                            <option value="People">People</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                                        <select 
                                            name="role" 
                                            value={formData.role} 
                                            onChange={handleInputChange} 
                                            required
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="">Select Role</option>
                                            {(formData.section === 'Office' ? OFFICE_ROLES : PEOPLE_ROLES).map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Personal Details */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-700 uppercase border-b border-slate-100 pb-2">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Enter Name"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                        <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="10-digit Mobile"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mail ID</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="example@mail.com"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">PSSM ID</label>
                                        <input type="text" name="pssmId" value={formData.pssmId} onChange={handleInputChange} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Optional ID"/>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Address */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-700 uppercase border-b border-slate-100 pb-2">Address Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <SearchableSelect 
                                        label="State" 
                                        value={formData.state} 
                                        options={states} 
                                        onChange={(val) => handleLocationChange('state', val)} 
                                        placeholder="Select State"
                                    />
                                    <SearchableSelect 
                                        label="District" 
                                        value={formData.district} 
                                        options={districts} 
                                        onChange={(val) => handleLocationChange('district', val)} 
                                        placeholder="Select District"
                                        disabled={!formData.state}
                                    />
                                    <SearchableSelect 
                                        label="Town / Mandal" 
                                        value={formData.town} 
                                        options={towns} 
                                        onChange={(val) => handleLocationChange('town', val)} 
                                        placeholder="Select Town"
                                        disabled={!formData.district}
                                    />
                                </div>
                                <div className="w-full md:w-1/3">
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Pincode</label>
                                    <input 
                                        type="text" 
                                        name="pincode" 
                                        value={formData.pincode} 
                                        onChange={handleInputChange} 
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" 
                                        placeholder="6-digit PIN"
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200 flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                                    Save User
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* --- OFFICE & PEOPLE LIST TAB --- */}
                {(activeTab === 'Office' || activeTab === 'People') && (
                    <div className="flex flex-col h-full">
                        {/* Filters */}
                        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                                    <input 
                                        type="text" 
                                        placeholder="Search Name, Phone..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="w-full md:w-64">
                                    <select 
                                        value={selectedRoleFilter} 
                                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white cursor-pointer focus:ring-indigo-500"
                                    >
                                        <option value="">All Roles</option>
                                        {(activeTab === 'Office' ? OFFICE_ROLES : PEOPLE_ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={loadData} className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 rounded-lg border border-slate-200"><RefreshCw size={18}/></button>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            {loading ? <div className="p-10 text-center text-slate-400">Loading users...</div> : (
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No users found.</td></tr>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div className="text-sm font-bold text-slate-800">{user.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{user.phone}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {user.address?.town}, {user.address?.district}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => setViewModalUser(user)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="View"><Eye size={16}/></button>
                                                            <button onClick={() => openEditModal(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"><Edit size={16}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* View Modal */}
        {viewModalUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewModalUser(null)}></div>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                        <h3 className="font-bold text-lg">User Details</h3>
                        <button onClick={() => setViewModalUser(null)} className="text-indigo-200 hover:text-white p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                                {viewModalUser.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900">{viewModalUser.name}</h4>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded border border-slate-200">{viewModalUser.role}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Phone size={12}/> Phone</span>
                                <span className="text-sm font-medium text-slate-700">{viewModalUser.phone}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Mail size={12}/> Email</span>
                                <span className="text-sm font-medium text-slate-700">{viewModalUser.email || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><CreditCard size={12}/> PSSM ID</span>
                                <span className="text-sm font-medium text-slate-700">{viewModalUser.pssmId || '-'}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><MapPin size={12}/> Address</span>
                                <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {viewModalUser.address.town}, {viewModalUser.address.district}, {viewModalUser.address.state}
                                    {viewModalUser.address.pincode && <span className="block mt-1 text-slate-500 font-mono text-xs">PIN: {viewModalUser.address.pincode}</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                        <button onClick={() => openEditModal(viewModalUser)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Edit Details</button>
                        <button onClick={() => setViewModalUser(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700">Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Edit Modal (Reusing Form Logic) */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
                        <h3 className="font-bold text-lg">Edit User</h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="text-indigo-200 hover:text-white p-1 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Reuse Form Logic, but inside modal context */}
                        <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-6">
                             {/* Similar fields as Add User, populated via state */}
                             <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold mb-1">Role</label><select name="role" value={formData.role} onChange={handleInputChange} className="w-full p-2 border rounded"><option value="">Select</option>{(formData.section === 'Office' ? OFFICE_ROLES : PEOPLE_ROLES).map(r=><option key={r} value={r}>{r}</option>)}</select></div>
                                <div><label className="block text-sm font-bold mb-1">Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded" required/></div>
                                <div><label className="block text-sm font-bold mb-1">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2 border rounded" required/></div>
                                <div><label className="block text-sm font-bold mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border rounded"/></div>
                                <div className="col-span-2"><label className="block text-sm font-bold mb-1">PSSM ID</label><input type="text" name="pssmId" value={formData.pssmId} onChange={handleInputChange} className="w-full p-2 border rounded"/></div>
                             </div>
                             
                             <div className="pt-4 border-t">
                                <h4 className="font-bold text-sm text-slate-500 uppercase mb-3">Address</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <SearchableSelect label="State" value={formData.state} options={states} onChange={(v) => handleLocationChange('state', v)} placeholder="State"/>
                                    <SearchableSelect label="District" value={formData.district} options={districts} onChange={(v) => handleLocationChange('district', v)} placeholder="District" disabled={!formData.state}/>
                                    <SearchableSelect label="Town" value={formData.town} options={towns} onChange={(v) => handleLocationChange('town', v)} placeholder="Town" disabled={!formData.district}/>
                                    <div><label className="block text-xs font-bold mb-1">Pincode</label><input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full p-2 border rounded text-sm"/></div>
                                </div>
                             </div>
                        </form>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                        <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50">Cancel</button>
                        <button form="edit-user-form" type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center">
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>} Update
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default UsersInfo;
