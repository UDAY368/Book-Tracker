
import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, AlertCircle, MapPin, 
  User, Phone, Calendar, Book, ArrowRight,
  Filter, ChevronLeft, ChevronRight, X, Loader2,
  RefreshCw, History, ClipboardList, ChevronDown, CheckSquare, Square, Edit
} from 'lucide-react';
import { api } from '../services/api';

// --- Local Searchable Select Component (Reused logic) ---
const SearchableSelect = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder,
  disabled = false
}: { label: string, value: string, options: string[], onChange: (val: string) => void, placeholder: string, disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
      setFilter(value);
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="relative">
      <label className="block text-sm font-bold text-slate-700 mb-1">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
          <input
              type="text"
              value={filter} 
              onClick={() => !disabled && setIsOpen(!isOpen)}
              onChange={(e) => {
                  setFilter(e.target.value);
                  onChange(e.target.value); 
                  setIsOpen(true);
              }}
              disabled={disabled}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all"
              placeholder={placeholder}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              autoComplete="off"
          />
          {!disabled && (
              <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
          )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-48 rounded-lg py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none custom-scrollbar border border-slate-100">
              {filteredOptions.map((opt) => (
                  <li 
                      key={opt}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-slate-900 transition-colors"
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

const NewBookRegister: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'registered'>('pending');
  
  // Register Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
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
     center: '', // Keeping Center if needed, though req spec mainly focused on State/Dist/Town
     houseNo: '',
     pincode: ''
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

  // Filter Logic
  const filteredBooks = books.filter(book => {
      const matchesSearch = 
          book.bookNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (book.recipientName && book.recipientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (book.phone && book.phone.includes(searchQuery)) || 
          (book.inchargeName && book.inchargeName.toLowerCase().includes(searchQuery.toLowerCase()));
      
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
    setSelectedBooks(new Set()); // Reset selections on tab/search change
  }, [activeTab, searchQuery]);

  // --- Handlers ---

  // Checkbox Logic
  const handleSelectAll = () => {
      if (selectedBooks.size === paginatedBooks.length && paginatedBooks.length > 0) {
          setSelectedBooks(new Set());
      } else {
          const newSet = new Set<string>();
          paginatedBooks.forEach(b => newSet.add(b.bookNumber));
          setSelectedBooks(newSet);
      }
  };

  const handleSelectOne = (bookNumber: string) => {
      const newSet = new Set(selectedBooks);
      if (newSet.has(bookNumber)) {
          newSet.delete(bookNumber);
      } else {
          newSet.add(bookNumber);
      }
      setSelectedBooks(newSet);
  };

  // Modal Triggers
  const openRegisterModal = (bookToEdit?: any) => {
      if (bookToEdit) {
          // Single Edit Mode (from History or Single Action)
          setSelectedBooks(new Set([bookToEdit.bookNumber]));
          
          // Pre-fill form if editing
          if (activeTab === 'registered') {
              setFormData({
                  recipientName: bookToEdit.recipientName || '',
                  phone: bookToEdit.phone || '',
                  pssmId: bookToEdit.pssmId || '',
                  date: bookToEdit.date ? bookToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0],
                  state: bookToEdit.locationState || '',
                  district: bookToEdit.locationDistrict || '',
                  town: bookToEdit.locationTown || '',
                  center: bookToEdit.center || '',
                  houseNo: bookToEdit.address ? bookToEdit.address.split(',')[0] : '', // Rough approximation for edit
                  pincode: bookToEdit.pincode || ''
              });
          } else {
              // New Registration default
              setFormData({
                  recipientName: '', phone: '', pssmId: '',
                  date: new Date().toISOString().split('T')[0],
                  state: '', district: '', town: '', center: '', houseNo: '', pincode: ''
              });
          }
      } else {
          // Bulk Mode
          if (selectedBooks.size === 0) return;
          setFormData({
              recipientName: '', phone: '', pssmId: '',
              date: new Date().toISOString().split('T')[0],
              state: '', district: '', town: '', center: '', houseNo: '', pincode: ''
          });
      }
      setIsModalOpen(true);
  };

  const handleLocationChange = (field: string, value: string) => {
      setFormData(prev => {
          const next = { ...prev, [field]: value };
          if (field === 'state') { next.district = ''; next.town = ''; }
          if (field === 'district') { next.town = ''; }
          return next;
      });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Basic validation
      if (!formData.state || !formData.district || !formData.town) {
          alert("Please select State, District, and Town.");
          return;
      }

      setIsSaving(true);
      try {
          const bookNumbers = Array.from(selectedBooks);
          await api.registerBook({
              bookNumbers: bookNumbers,
              recipientName: formData.recipientName,
              phone: formData.phone,
              pssmId: formData.pssmId,
              date: formData.date,
              state: formData.state,
              district: formData.district,
              town: formData.town,
              center: formData.center,
              pincode: formData.pincode,
              specificAddress: formData.houseNo, // Helper for constructing full address
              address: `${formData.houseNo}, ${formData.town}, ${formData.district}, ${formData.state}${formData.pincode ? ' - ' + formData.pincode : ''}`
          });

          setToastMessage(`${bookNumbers.length} Book(s) Registered Successfully!`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          
          await loadBooks(); 
          setIsModalOpen(false);
          setSelectedBooks(new Set());
      } catch (error) {
          console.error(error);
          alert("Failed to register books");
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
           <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 sticky top-0 z-20">
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
               
               <div className="flex items-center gap-3">
                   {activeTab === 'pending' && selectedBooks.size > 0 && (
                       <button 
                          onClick={() => openRegisterModal()}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all animate-in zoom-in"
                       >
                           <ClipboardList size={16} />
                           Register Selected ({selectedBooks.size})
                       </button>
                   )}
                   <button onClick={loadBooks} className="p-2 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all" title="Refresh Data">
                       <RefreshCw size={18} />
                   </button>
               </div>
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
                       <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                           <tr>
                               {/* Pending Registration Columns */}
                               {activeTab === 'pending' && (
                                   <>
                                       <th className="px-6 py-3 w-10">
                                           <button onClick={handleSelectAll} className="text-slate-500 hover:text-indigo-600">
                                               {selectedBooks.size === paginatedBooks.length && paginatedBooks.length > 0 ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18}/>}
                                           </button>
                                       </th>
                                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Book Number</th>
                                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Incharge Name</th>
                                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Num</th>
                                       <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                   </>
                               )}

                               {/* Registration History Columns */}
                               {activeTab === 'registered' && (
                                   <>
                                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Book Number</th>
                                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient Name</th>
                                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Num</th>
                                       <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                   </>
                               )}
                           </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-slate-100">
                           {paginatedBooks.length === 0 ? (
                               <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No books found in this category.</td></tr>
                           ) : (
                               paginatedBooks.map((book, idx) => (
                                   <tr key={idx} className={`hover:bg-slate-50 transition-colors ${selectedBooks.has(book.bookNumber) ? 'bg-indigo-50/40' : ''}`}>
                                       
                                       {/* Pending Row */}
                                       {activeTab === 'pending' && (
                                           <>
                                               <td className="px-6 py-4 whitespace-nowrap">
                                                   <button onClick={() => handleSelectOne(book.bookNumber)} className="text-slate-400 hover:text-indigo-600">
                                                       {selectedBooks.has(book.bookNumber) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18}/>}
                                                   </button>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap">
                                                   <div className="flex items-center gap-2">
                                                       <Book size={16} className="text-slate-400" />
                                                       <span className="font-bold font-mono text-indigo-600">{book.bookNumber}</span>
                                                   </div>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap">
                                                   <span className="text-sm font-bold text-slate-800">{book.inchargeName || 'N/A'}</span>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap">
                                                   <span className="text-sm font-medium text-slate-600">{book.inchargePhone || 'N/A'}</span>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap text-right">
                                                   <button 
                                                      onClick={() => openRegisterModal(book)}
                                                      className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
                                                   >
                                                       Register <ArrowRight size={12} className="ml-1" />
                                                   </button>
                                               </td>
                                           </>
                                       )}

                                       {/* History Row */}
                                       {activeTab === 'registered' && (
                                           <>
                                               <td className="px-6 py-4 whitespace-nowrap">
                                                   <div className="flex items-center gap-2">
                                                       <Book size={16} className="text-slate-400" />
                                                       <span className="font-bold font-mono text-indigo-600">{book.bookNumber}</span>
                                                   </div>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap">
                                                   <span className="text-sm font-bold text-slate-800">{book.recipientName}</span>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap">
                                                   <span className="text-sm font-medium text-slate-600 flex items-center"><Phone size={14} className="mr-1 text-slate-400"/> {book.phone}</span>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap text-right">
                                                   <button 
                                                      onClick={() => openRegisterModal(book)}
                                                      className="inline-flex items-center px-3 py-1.5 bg-white text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 border border-slate-200 transition-all shadow-sm"
                                                   >
                                                       <Edit size={14} className="mr-1"/> Edit Details
                                                   </button>
                                               </td>
                                           </>
                                       )}
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
       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
               <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                   {/* Modal Header */}
                   <div className="bg-indigo-600 px-6 py-5 text-white flex justify-between items-start shrink-0">
                       <div>
                           <h3 className="text-xl font-bold">Register Books</h3>
                           <div className="flex items-center gap-2 mt-1 opacity-90 text-sm">
                               <Book size={16} />
                               <span>Registering {selectedBooks.size} Book(s)</span>
                           </div>
                           <div className="flex flex-wrap gap-1 mt-2">
                               {Array.from(selectedBooks).slice(0, 5).map(b => (
                                   <span key={b} className="px-1.5 py-0.5 bg-indigo-500 rounded text-[10px] font-mono">{b}</span>
                               ))}
                               {selectedBooks.size > 5 && <span className="px-1.5 py-0.5 bg-indigo-500 rounded text-[10px] font-mono">+{selectedBooks.size - 5} more</span>}
                           </div>
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="text-indigo-200 hover:text-white bg-indigo-700 hover:bg-indigo-500 p-1.5 rounded-full transition-colors">
                           <X size={20} />
                       </button>
                   </div>

                   {/* Modal Body */}
                   <form onSubmit={handleRegisterSubmit} className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1">
                       
                       <div className="space-y-6">
                           
                           {/* Personal Information Section */}
                           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                                   <User size={14} className="text-indigo-500"/> Recipient Details
                               </h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                   <div className="col-span-2 md:col-span-1">
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
                                   <div className="col-span-2 md:col-span-1">
                                       <label className="block text-sm font-bold text-slate-700 mb-1">PSSM ID</label>
                                       <input 
                                          type="text" 
                                          placeholder="Optional ID"
                                          value={formData.pssmId}
                                          onChange={(e) => setFormData({...formData, pssmId: e.target.value})}
                                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                       />
                                   </div>
                                   <div className="col-span-2">
                                       <label className="block text-sm font-bold text-slate-700 mb-1">Recipient Name <span className="text-red-500">*</span></label>
                                       <input 
                                          type="text" 
                                          required
                                          placeholder="Enter Full Name"
                                          value={formData.recipientName}
                                          onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                       />
                                   </div>
                                   <div className="col-span-2">
                                       <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                       <div className="relative">
                                           <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                           <input 
                                              type="tel" 
                                              required
                                              placeholder="10-digit Mobile Number"
                                              value={formData.phone}
                                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                           />
                                       </div>
                                   </div>
                               </div>
                           </div>

                           {/* Location Section */}
                           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                                   <MapPin size={14} className="text-indigo-500"/> Location Details
                               </h4>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                   <SearchableSelect 
                                       label="State" 
                                       value={formData.state} 
                                       options={getStates()} 
                                       onChange={(val) => handleLocationChange('state', val)} 
                                       placeholder="Select State"
                                   />
                                   <SearchableSelect 
                                       label="District" 
                                       value={formData.district} 
                                       options={getDistricts()} 
                                       onChange={(val) => handleLocationChange('district', val)} 
                                       placeholder="Select District"
                                       disabled={!formData.state}
                                   />
                                   <SearchableSelect 
                                       label="Town / Mandal" 
                                       value={formData.town} 
                                       options={getTowns()} 
                                       onChange={(val) => handleLocationChange('town', val)} 
                                       placeholder="Select Town"
                                       disabled={!formData.district}
                                   />
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5">
                                   <div className="md:col-span-3">
                                       <label className="block text-sm font-bold text-slate-700 mb-1">House # / Street Area</label>
                                       <input 
                                          type="text" 
                                          placeholder="Detailed Address"
                                          value={formData.houseNo}
                                          onChange={(e) => setFormData({...formData, houseNo: e.target.value})}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                                       />
                                   </div>
                                   <div className="md:col-span-1">
                                       <label className="block text-sm font-bold text-slate-700 mb-1">Pincode</label>
                                       <input 
                                          type="text" 
                                          placeholder="6-digit"
                                          value={formData.pincode}
                                          onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                                          maxLength={6}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                                       />
                                   </div>
                               </div>
                           </div>

                       </div>
                   </form>

                   {/* Footer Actions */}
                   <div className="pt-4 pb-5 px-6 flex justify-end gap-3 border-t border-slate-200 bg-white shrink-0">
                       <button 
                          type="button" 
                          onClick={() => setIsModalOpen(false)}
                          className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-bold transition-colors shadow-sm text-sm"
                       >
                           Cancel
                       </button>
                       <button 
                          type="submit" 
                          onClick={handleRegisterSubmit}
                          disabled={isSaving}
                          className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center text-sm"
                       >
                           {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle className="mr-2" size={18} />}
                           Confirm Registration
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default NewBookRegister;
