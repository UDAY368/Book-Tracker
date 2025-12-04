
import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, AlertCircle, MapPin, 
  User, Phone, Calendar, Book, ArrowRight,
  Filter, ChevronLeft, ChevronRight, X, Loader2,
  RefreshCw, History, ClipboardList, ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

const NewBookRegister: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'registered'>('pending');
  
  // Register Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Location Data State
  const [locationData, setLocationData] = useState<any>({});
  
  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
     recipientName: '',
     phone: '',
     pssmId: '',
     date: new Date().toISOString().split('T')[0],
     state: '',
     district: '',
     town: '',
     center: '',
     specificAddress: ''
  });

  useEffect(() => {
    loadBooks();
    loadLocations();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await api.getAllBooksForRegister();
      setBooks(data);
    } catch (e) {
      console.error("Failed to load books", e);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    const locData = await api.getLocations();
    setLocationData(locData);
  };

  // Helper to get dropdown options
  const getStates = () => Object.keys(locationData);
  const getDistricts = () => formData.state ? Object.keys(locationData[formData.state] || {}) : [];
  const getTowns = () => formData.district ? Object.keys(locationData[formData.state]?.[formData.district] || {}) : [];
  const getCenters = () => formData.town ? (locationData[formData.state]?.[formData.district]?.[formData.town] || []) : [];

  // Filter Logic
  const filteredBooks = books.filter(book => {
      const matchesSearch = 
          book.bookNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (book.recipientName && book.recipientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (book.phone && book.phone.includes(searchQuery));
      
      if (activeTab === 'pending') {
          return matchesSearch && book.status === 'Pending';
      } else {
          return matchesSearch && book.status === 'Registered';
      }
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalItems = filteredBooks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Handlers
  const openRegisterModal = (book: any) => {
      setSelectedBook(book);
      setFormData({
         recipientName: '',
         phone: '',
         pssmId: '',
         date: new Date().toISOString().split('T')[0],
         state: '',
         district: '',
         town: '',
         center: '',
         specificAddress: ''
      });
      setIsModalOpen(true);
  };

  const handleLocationChange = (field: string, value: string) => {
      setFormData(prev => {
          const next = { ...prev, [field]: value };
          if (field === 'state') { next.district = ''; next.town = ''; next.center = ''; }
          if (field === 'district') { next.town = ''; next.center = ''; }
          if (field === 'town') { next.center = ''; }
          return next;
      });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBook) return;
      
      // Basic validation for location
      if (!formData.state || !formData.district || !formData.town) {
          alert("Please select State, District, and Town.");
          return;
      }

      setIsSaving(true);
      try {
          await api.registerBook({
              bookNumber: selectedBook.bookNumber,
              recipientName: formData.recipientName,
              phone: formData.phone,
              pssmId: formData.pssmId,
              date: formData.date,
              state: formData.state,
              district: formData.district,
              town: formData.town,
              center: formData.center,
              address: `${formData.specificAddress}, ${formData.center ? formData.center + ', ' : ''}${formData.town}, ${formData.district}, ${formData.state}`
          });

          setToastMessage(`Book ${selectedBook.bookNumber} Registered Successfully!`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          
          await loadBooks(); // Refresh list to reflect changes in "Pending" and "History"
          setIsModalOpen(false);
      } catch (error) {
          alert("Failed to register book");
      } finally {
          setIsSaving(false);
      }
  };

  // Stats
  const stats = {
      total: books.length,
      pending: books.filter(b => b.status === 'Pending').length,
      registered: books.filter(b => b.status === 'Registered').length
  };

  const completionRate = stats.total > 0 ? Math.round((stats.registered / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500 relative">
       
       {/* Toast Notification */}
       {showToast && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-3 border border-emerald-200 ring-1 ring-emerald-100">
            <div className="bg-white p-1.5 rounded-full shadow-sm text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
            <div><h4 className="font-bold text-sm text-emerald-900">Success</h4><p className="text-xs text-emerald-700">{toastMessage}</p></div>
            <button onClick={() => setShowToast(false)} className="ml-4 text-emerald-400 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-100 rounded-full"><X size={16} /></button>
          </div>
        </div>
      )}

       {/* Header & Stats */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h2 className="text-xl font-bold text-slate-800">Book Register</h2>
               <p className="text-sm text-slate-500 mt-1">Manage assignments</p>
               <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600">{completionRate}%</span>
                  </div>
                  <p className="text-xs text-slate-400">Completion Rate</p>
               </div>
           </div>
           
           <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><Book size={20} /></div>
                   <span className="text-indigo-900 font-bold text-sm uppercase opacity-70">Total Books</span>
               </div>
               <span className="text-3xl font-bold text-indigo-900">{stats.total}</span>
           </div>

           <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm"><AlertCircle size={20} /></div>
                   <span className="text-amber-900 font-bold text-sm uppercase opacity-70">Pending</span>
               </div>
               <span className="text-3xl font-bold text-amber-900">{stats.pending}</span>
           </div>

           <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><CheckCircle size={20} /></div>
                   <span className="text-emerald-900 font-bold text-sm uppercase opacity-70">Registered</span>
               </div>
               <span className="text-3xl font-bold text-emerald-900">{stats.registered}</span>
           </div>
       </div>

       {/* Main Content */}
       <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
           
           {/* Tabs */}
           <div className="flex border-b border-slate-200">
               <button 
                  onClick={() => setActiveTab('pending')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'pending' ? 'border-amber-500 text-amber-700 bg-amber-50/20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
               >
                  <AlertCircle size={16} /> Pending Registration
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{stats.pending}</span>
               </button>
               <button 
                  onClick={() => setActiveTab('registered')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'registered' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
               >
                  <History size={16} /> Registration History
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{stats.registered}</span>
               </button>
           </div>

           {/* Toolbar */}
           <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
               <div className="relative w-full max-w-md">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="text" 
                      placeholder="Search Book Number, Name or Phone..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                   />
               </div>
               <button onClick={loadBooks} className="p-2 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all" title="Refresh Data">
                   <RefreshCw size={18} />
               </button>
           </div>

           {/* Table */}
           <div className="flex-1 overflow-auto">
               {loading ? (
                   <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                       <Loader2 className="animate-spin mb-2" size={32} />
                       <span className="text-sm">Loading Books...</span>
                   </div>
               ) : (
                   <table className="min-w-full divide-y divide-slate-200">
                       <thead className="bg-slate-50 sticky top-0 z-10">
                           <tr>
                               <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Book Number</th>
                               <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Location</th>
                               {activeTab === 'registered' && (
                                   <>
                                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient</th>
                                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reg. Date</th>
                                   </>
                               )}
                               <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                           </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-slate-100">
                           {paginatedBooks.length === 0 ? (
                               <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No books found in this category.</td></tr>
                           ) : (
                               paginatedBooks.map((book, idx) => (
                                   <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-6 py-4 whitespace-nowrap">
                                           <div className="flex items-center gap-2">
                                               <Book size={16} className="text-slate-400" />
                                               <span className="font-bold font-mono text-indigo-600">{book.bookNumber}</span>
                                           </div>
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap">
                                           <div className="flex flex-col">
                                               <span className="text-sm text-slate-900 font-medium">{book.locationTown}, {book.locationDistrict}</span>
                                               <span className="text-xs text-slate-500">{book.locationState}</span>
                                           </div>
                                       </td>
                                       {activeTab === 'registered' && (
                                           <>
                                               <td className="px-6 py-4 whitespace-nowrap">
                                                   <div className="flex flex-col">
                                                       <span className="text-sm font-bold text-slate-800">{book.recipientName}</span>
                                                       <span className="text-xs text-slate-500 flex items-center"><Phone size={10} className="mr-1"/> {book.phone}</span>
                                                   </div>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                   {new Date(book.date).toLocaleDateString()}
                                               </td>
                                           </>
                                       )}
                                       <td className="px-6 py-4 whitespace-nowrap text-right">
                                           {activeTab === 'pending' ? (
                                               <button 
                                                  onClick={() => openRegisterModal(book)}
                                                  className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
                                               >
                                                   Register <ArrowRight size={12} className="ml-1" />
                                               </button>
                                           ) : (
                                               <button 
                                                  onClick={() => openRegisterModal(book)} // Edit mode essentially
                                                  className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 border border-slate-200 transition-all"
                                               >
                                                   Edit Details
                                               </button>
                                           )}
                                       </td>
                                   </tr>
                               ))
                           )}
                       </tbody>
                   </table>
               )}
           </div>

           {/* Pagination */}
           {totalItems > 0 && (
               <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                   <div className="text-xs text-slate-500">
                       Page <span className="font-bold">{currentPage}</span> of {totalPages} ({totalItems} items)
                   </div>
                   <div className="flex gap-2">
                       <button 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="p-2 bg-white border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-100"
                       >
                           <ChevronLeft size={16} />
                       </button>
                       <button 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 bg-white border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-100"
                       >
                           <ChevronRight size={16} />
                       </button>
                   </div>
               </div>
           )}
       </div>

       {/* Registration Modal */}
       {isModalOpen && selectedBook && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
               <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                   {/* Modal Header */}
                   <div className="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
                       <div>
                           <h3 className="text-xl font-bold">Register Book</h3>
                           <div className="flex items-center gap-2 mt-2 opacity-90">
                               <Book size={16} />
                               <span className="font-mono text-lg font-bold bg-indigo-500 px-2 rounded">{selectedBook.bookNumber}</span>
                           </div>
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="text-indigo-200 hover:text-white bg-indigo-700 hover:bg-indigo-500 p-1.5 rounded-full transition-colors">
                           <X size={20} />
                       </button>
                   </div>

                   {/* Modal Body */}
                   <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Recipient Name <span className="text-red-500">*</span></label>
                           <div className="relative">
                               <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                               <input 
                                  type="text" 
                                  required
                                  placeholder="Full Name"
                                  value={formData.recipientName}
                                  onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                               />
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                               <div className="relative">
                                   <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                   <input 
                                      type="tel" 
                                      required
                                      placeholder="10-digit Mobile"
                                      value={formData.phone}
                                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-1">PSSM ID</label>
                               <input 
                                  type="text" 
                                  placeholder="Optional"
                                  value={formData.pssmId}
                                  onChange={(e) => setFormData({...formData, pssmId: e.target.value})}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                               />
                           </div>
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Registration Date</label>
                           <div className="relative">
                               <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                               <input 
                                  type="date" 
                                  required
                                  value={formData.date}
                                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                               />
                           </div>
                       </div>
                       
                       {/* Location Dropdowns */}
                       <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                           <h5 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin size={12}/> Location Details</h5>
                           
                           <div className="grid grid-cols-2 gap-3">
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">State <span className="text-red-500">*</span></label>
                                   <div className="relative">
                                       <select 
                                          required 
                                          value={formData.state} 
                                          onChange={e => handleLocationChange('state', e.target.value)} 
                                          className="w-full pl-2 pr-6 py-1.5 text-sm border border-slate-300 rounded appearance-none bg-white"
                                       >
                                           <option value="">Select State</option>
                                           {getStates().map(s => <option key={s} value={s}>{s}</option>)}
                                       </select>
                                       <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                                   </div>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">District <span className="text-red-500">*</span></label>
                                   <div className="relative">
                                       <select 
                                          required 
                                          value={formData.district} 
                                          onChange={e => handleLocationChange('district', e.target.value)} 
                                          disabled={!formData.state}
                                          className="w-full pl-2 pr-6 py-1.5 text-sm border border-slate-300 rounded appearance-none bg-white disabled:bg-slate-100"
                                       >
                                           <option value="">Select District</option>
                                           {getDistricts().map(d => <option key={d} value={d}>{d}</option>)}
                                       </select>
                                       <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                                   </div>
                               </div>
                           </div>

                           <div className="grid grid-cols-2 gap-3">
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">Town / Mandal <span className="text-red-500">*</span></label>
                                   <div className="relative">
                                       <select 
                                          required 
                                          value={formData.town} 
                                          onChange={e => handleLocationChange('town', e.target.value)} 
                                          disabled={!formData.district}
                                          className="w-full pl-2 pr-6 py-1.5 text-sm border border-slate-300 rounded appearance-none bg-white disabled:bg-slate-100"
                                       >
                                           <option value="">Select Town</option>
                                           {getTowns().map(t => <option key={t} value={t}>{t}</option>)}
                                       </select>
                                       <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                                   </div>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">Center</label>
                                   <div className="relative">
                                       <select 
                                          value={formData.center} 
                                          onChange={e => handleLocationChange('center', e.target.value)} 
                                          disabled={!formData.town}
                                          className="w-full pl-2 pr-6 py-1.5 text-sm border border-slate-300 rounded appearance-none bg-white disabled:bg-slate-100"
                                       >
                                           <option value="">Select Center</option>
                                           {getCenters().map(c => <option key={c} value={c}>{c}</option>)}
                                       </select>
                                       <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                                   </div>
                               </div>
                           </div>
                           
                           <div>
                               <label className="block text-xs font-bold text-slate-600 mb-1">House #, Street, Landmark</label>
                               <input 
                                  type="text" 
                                  placeholder="Specific Address Details"
                                  value={formData.specificAddress}
                                  onChange={(e) => setFormData({...formData, specificAddress: e.target.value})}
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded outline-none"
                               />
                           </div>
                       </div>

                       <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4 shrink-0">
                           <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
                              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold transition-colors"
                           >
                               Cancel
                           </button>
                           <button 
                              type="submit" 
                              disabled={isSaving}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center"
                           >
                               {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle className="mr-2" size={18} />}
                               Confirm Registration
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

export default NewBookRegister;
