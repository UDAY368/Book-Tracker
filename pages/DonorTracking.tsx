
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, User, MapPin, 
  ArrowUpDown, Briefcase, IndianRupee, RefreshCw, Loader2,
  Eye, X, Phone, Mail, CreditCard, Hash, Map, FileText
} from 'lucide-react';
import { api } from '../services/api';

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

interface Donor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  profession: string;
  idProofType?: string;
  idProofNumber?: string;
  address: string;
  state: string;
  district: string;
  town: string;
  pincode?: string;
  bookNumber: string;
  amount: number;
  paymentMode?: string;
  transactionId?: string;
  checkNumber?: string;
  receiptNumber?: string;
  yagam: string;
}

const DonorTracking: React.FC = () => {
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);
  const [donors, setDonors] = useState<Donor[]>([]);
  
  // Modal State
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  useEffect(() => {
    loadDonors();
  }, [selectedYagam]);

  const loadDonors = async () => {
      setIsLoading(true);
      try {
          // Fetch real data from all books where pages are filled
          const allDonors = await api.getAllDonors();
          setDonors(allDonors);
      } catch (e) {
          console.error("Failed to load donors", e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredDonors = useMemo(() => {
    return donors.filter(donor => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                donor.name.toLowerCase().includes(q) || 
                donor.phone.includes(q) ||
                donor.bookNumber.toLowerCase().includes(q) ||
                (donor.email && donor.email.toLowerCase().includes(q))
            );
        }
        return true;
    });
  }, [donors, searchQuery]);

  const totalItems = filteredDonors.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedDonors = filteredDonors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Detail Modal */}
      {selectedDonor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedDonor(null)}></div>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
                   <div className="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
                       <div>
                           <h3 className="text-xl font-bold">Donor Details</h3>
                           <p className="text-indigo-100 text-sm mt-1">Receipt #: <span className="font-mono font-bold">{selectedDonor.receiptNumber || 'N/A'}</span></p>
                       </div>
                       <button onClick={() => setSelectedDonor(null)} className="text-indigo-200 hover:text-white bg-indigo-700 hover:bg-indigo-500 p-1.5 rounded-full transition-colors">
                           <X size={20} />
                       </button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 border-b border-slate-100 pb-2">
                                <User size={14}/> Personal Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400">Name</label>
                                    <p className="text-sm font-bold text-slate-800">{selectedDonor.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Gender</label>
                                    <p className="text-sm font-medium text-slate-800">{selectedDonor.gender || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Phone</label>
                                    <p className="text-sm font-medium text-slate-800">{selectedDonor.phone}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Email</label>
                                    <p className="text-sm font-medium text-slate-800 truncate" title={selectedDonor.email}>{selectedDonor.email || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400">Profession</label>
                                    <p className="text-sm font-medium text-slate-800">{selectedDonor.profession || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* ID Proof Info (New Section) */}
                        {(selectedDonor.idProofType || selectedDonor.idProofNumber) && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 border-b border-slate-100 pb-2">
                                    <FileText size={14}/> ID Proof Details
                                </h4>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase">ID Type</label>
                                        <p className="text-sm font-bold text-slate-800">{selectedDonor.idProofType || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase">ID Number</label>
                                        <p className="text-sm font-mono font-medium text-slate-700">{selectedDonor.idProofNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 border-b border-slate-100 pb-2">
                                <IndianRupee size={14}/> Donation Details
                            </h4>
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex justify-between items-center mb-3">
                                <div>
                                    <label className="text-xs text-emerald-600 font-bold uppercase">Amount Paid</label>
                                    <p className="text-2xl font-bold text-emerald-700">₹{selectedDonor.amount.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <label className="text-xs text-emerald-600 font-bold uppercase">Mode</label>
                                    <p className="text-sm font-bold text-emerald-700">{selectedDonor.paymentMode}</p>
                                </div>
                            </div>
                            
                            {selectedDonor.paymentMode === 'Online' && (
                                <div>
                                    <label className="text-xs text-slate-400">Transaction ID</label>
                                    <p className="text-sm font-mono font-bold text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">{selectedDonor.transactionId}</p>
                                </div>
                            )}
                            {selectedDonor.paymentMode === 'Check' && (
                                <div>
                                    <label className="text-xs text-slate-400">Check Number</label>
                                    <p className="text-sm font-mono font-bold text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">{selectedDonor.checkNumber}</p>
                                </div>
                            )}
                        </div>

                        {/* Location Info */}
                        <div className="space-y-4">
                             <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 border-b border-slate-100 pb-2">
                                <Map size={14}/> Address Information
                            </h4>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400">Town / Mandal</label>
                                    <p className="text-sm font-medium text-slate-800">{selectedDonor.town}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">District</label>
                                    <p className="text-sm font-medium text-slate-800">{selectedDonor.district}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">State</label>
                                    <p className="text-sm font-medium text-slate-800">{selectedDonor.state}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Pincode</label>
                                    <p className="text-sm font-medium text-slate-800 font-mono">{selectedDonor.pincode || '-'}</p>
                                </div>
                             </div>
                        </div>
                   </div>

                   <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                      <button onClick={() => setSelectedDonor(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 shadow-sm text-slate-700">Close</button>
                   </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Donor Tracking</h2>
           <p className="text-slate-500 text-sm mt-1">Global database of all contributors.</p>
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

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <div className="relative w-full max-w-md">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="text" 
                      placeholder="Search Donor, Phone or Mail..." 
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                   />
              </div>
              <div className="flex gap-2">
                 <button onClick={handleResetFilters} className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Reset</button>
                 <button onClick={loadDonors} className="p-2 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"><RefreshCw size={18}/></button>
              </div>
          </div>

          <div className="flex-1 overflow-auto">
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                       <Loader2 className="animate-spin mb-2" size={32} />
                       <span className="text-sm">Fetching Donor Data...</span>
                   </div>
              ) : (
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-xs sticky top-0">
                          <tr>
                              <th className="px-6 py-4">Donor Name</th>
                              <th className="px-6 py-4">Contact</th>
                              <th className="px-6 py-4">Profession</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                              <th className="px-6 py-4 text-center">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {paginatedDonors.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No donors found matching criteria.</td></tr>
                          ) : (
                              paginatedDonors.map(d => (
                                  <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                                      <td className="px-6 py-4">
                                          <p className="font-bold text-slate-800">{d.name}</p>
                                          <p className="text-xs text-slate-400 font-mono mt-0.5">Recpt: {d.receiptNumber || 'N/A'}</p>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex flex-col gap-0.5">
                                              <span className="text-slate-600 flex items-center text-xs"><Phone size={10} className="mr-1"/> {d.phone}</span>
                                              <span className="text-slate-500 flex items-center text-xs"><Mail size={10} className="mr-1"/> {d.email || '-'}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                              {d.profession || 'N/A'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{d.amount.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-center">
                                          <button 
                                            onClick={() => setSelectedDonor(d)}
                                            className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded transition-colors"
                                            title="View Details"
                                          >
                                              <Eye size={18} />
                                          </button>
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
                       Page <span className="font-bold">{currentPage}</span> of {totalPages} ({totalItems} records)
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
    </div>
  );
};

export default DonorTracking;
