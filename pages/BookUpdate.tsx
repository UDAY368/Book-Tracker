
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronRight, X, Save, CheckCircle, Loader2, Book, Edit, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { ReceiverBook } from '../types';

const BookUpdate: React.FC = () => {
  const [books, setBooks] = useState<ReceiverBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expandable Row State
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    filledPages: 0,
    totalAmount: 0,
    status: 'Registered' as 'Registered' | 'Received' | 'Distributed'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const data = await api.getReceiverBooks();
    setBooks(data);
    setLoading(false);
  };

  const handleToggleExpand = (book: ReceiverBook) => {
    if (expandedBookId === book.id) {
      // Collapse if already open
      setExpandedBookId(null);
    } else {
      // Expand and populate form
      setExpandedBookId(book.id);
      setFormData({
        filledPages: book.filledPages,
        totalAmount: book.totalAmount,
        status: book.status as any
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedBookId) return;

    setIsSaving(true);
    await api.updateBookQuickStats(
      expandedBookId,
      formData.filledPages,
      formData.totalAmount,
      formData.status
    );
    
    // Refresh List
    await loadBooks();
    setIsSaving(false);
    setExpandedBookId(null); // Collapse after save
  };

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    const q = searchQuery.toLowerCase();
    return books.filter(book => 
      book.bookNumber.toLowerCase().includes(q) ||
      book.assignedToName.toLowerCase().includes(q) ||
      book.assignedToPhone.includes(q) ||
      (book.pssmId && book.pssmId.toLowerCase().includes(q))
    );
  }, [books, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quick Book Update</h2>
          <p className="text-slate-500 text-sm">Search and update book totals instantly.</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Book Number, Holder Name, Phone Number, or PSSM ID"
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            />
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
               <thead className="bg-slate-50">
                  <tr>
                     <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Book Number</th>
                     <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Holder Name</th>
                     <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                     <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</th>
                     <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-slate-200">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading books...</td></tr>
                  ) : filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                         <div className="flex flex-col items-center">
                            <Search className="h-8 w-8 mb-2 opacity-50" />
                            <p>No books found. Try searching by number or name.</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map(book => {
                       const isExpanded = expandedBookId === book.id;
                       return (
                          <React.Fragment key={book.id}>
                             <tr 
                                className={`transition-colors border-b border-slate-100 ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                             >
                                <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center">
                                      <Book className={`h-4 w-4 mr-2 ${isExpanded ? 'text-indigo-600' : 'text-slate-400'}`} />
                                      <span className="text-sm font-bold text-slate-900">{book.bookNumber}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{book.assignedToName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{book.assignedToPhone}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                   <span className={`px-2 py-1 text-xs rounded-full font-medium border ${
                                      book.status === 'Received' ? 'bg-green-50 text-green-700 border-green-200' :
                                      book.status === 'Registered' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-slate-50 text-slate-600 border-slate-200'
                                   }`}>
                                      {book.status}
                                   </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                   <button 
                                      onClick={() => handleToggleExpand(book)}
                                      className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${
                                        isExpanded 
                                          ? 'border-indigo-200 bg-indigo-100 text-indigo-700' 
                                          : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                      }`}
                                   >
                                      {isExpanded ? <ChevronUp size={14} className="mr-1" /> : <Edit size={14} className="mr-1" />}
                                      {isExpanded ? 'Close' : 'Update'}
                                   </button>
                                </td>
                             </tr>
                             
                             {/* Expanded Row */}
                             {isExpanded && (
                                <tr className="bg-indigo-50/40 animate-in fade-in zoom-in-95 duration-200">
                                   <td colSpan={5} className="px-6 py-4">
                                      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-indigo-100 shadow-sm p-4 flex flex-col lg:flex-row gap-6 items-end">
                                         
                                         {/* Pages Input */}
                                         <div className="flex-1 w-full">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pages Filled (Max 20)</label>
                                            <div className="relative">
                                               <input 
                                                  type="number" 
                                                  min="0" 
                                                  max="20"
                                                  required
                                                  value={formData.filledPages}
                                                  onChange={(e) => setFormData({...formData, filledPages: parseInt(e.target.value)})}
                                                  className="block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900"
                                               />
                                               <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">/ 20</span>
                                            </div>
                                         </div>

                                         {/* Amount Input */}
                                         <div className="flex-1 w-full">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Amount (₹)</label>
                                            <div className="relative">
                                               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                  <span className="text-slate-400 font-bold">₹</span>
                                               </div>
                                               <input 
                                                  type="number" 
                                                  min="0"
                                                  required
                                                  value={formData.totalAmount}
                                                  onChange={(e) => setFormData({...formData, totalAmount: parseInt(e.target.value)})}
                                                  className="block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-bold text-emerald-700"
                                               />
                                            </div>
                                         </div>

                                         {/* Status Select */}
                                         <div className="flex-1 w-full">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                                            <select 
                                               value={formData.status}
                                               onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                               className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                                            >
                                               <option value="Registered">Registered</option>
                                               <option value="Received">Received</option>
                                               <option value="Distributed">Distributed</option>
                                            </select>
                                         </div>

                                         {/* Actions */}
                                         <div className="flex gap-2 w-full lg:w-auto">
                                            <button 
                                               type="submit" 
                                               disabled={isSaving}
                                               className="flex-1 lg:flex-none flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-colors font-medium text-sm"
                                            >
                                               {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />}
                                               Save Changes
                                            </button>
                                         </div>
                                      </form>
                                   </td>
                                </tr>
                             )}
                          </React.Fragment>
                       );
                    })
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default BookUpdate;
