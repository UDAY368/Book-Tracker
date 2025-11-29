import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronRight, X, Save, CheckCircle, Loader2, Book, Edit, 
  ChevronDown, ChevronUp, Calendar, User, Package, Clock, Tag, Hash
} from 'lucide-react';
import { api } from '../services/api';
import { ReceiverBook } from '../types';

const BookUpdate: React.FC = () => {
  const [books, setBooks] = useState<ReceiverBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expandable Row States
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    filledPages: 0,
    totalAmount: 0,
    status: 'Registered' as 'Registered' | 'Received'
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

  const handleToggleGroupExpand = (groupId: string) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  };

  const handleToggleBookExpand = (book: ReceiverBook) => {
    if (expandedBookId === book.id) {
      setExpandedBookId(null);
    } else {
      setExpandedBookId(book.id);
      setFormData({
        filledPages: book.filledPages,
        totalAmount: book.totalAmount,
        // Map existing status to form, defaulting to Registered if it was Distributed
        status: (book.status === 'Received' || book.status === 'Registered') ? book.status : 'Registered'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedBookId) return;

    setIsSaving(true);

    // Optimistic Update
    const updatedBooks = books.map(book => {
        if (book.id === expandedBookId) {
            return {
                ...book,
                filledPages: formData.status === 'Received' ? formData.filledPages : 0, // Reset if moving back to Registered
                totalAmount: formData.status === 'Received' ? formData.totalAmount : 0,
                status: formData.status as any
            };
        }
        return book;
    });
    
    setBooks(updatedBooks);

    // Sync with API
    await api.updateBookQuickStats(
      expandedBookId,
      formData.status === 'Received' ? formData.filledPages : 0,
      formData.status === 'Received' ? formData.totalAmount : 0,
      formData.status as any
    );
    
    await loadBooks();
    setIsSaving(false);
    setExpandedBookId(null); 
  };

  // Filter Books
  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    const q = searchQuery.toLowerCase();
    return books.filter(book => 
      book.bookNumber.toLowerCase().includes(q) ||
      book.assignedToName.toLowerCase().includes(q) ||
      book.assignedToPhone.includes(q) ||
      (book.pssmId && book.pssmId.toLowerCase().includes(q)) ||
      book.batchName.toLowerCase().includes(q)
    );
  }, [books, searchQuery]);

  // Group Books by Batch + Recipient
  const groupedData = useMemo(() => {
    const groups: Record<string, ReceiverBook[]> = {};
    filteredBooks.forEach(book => {
      const key = `${book.batchName}-${book.assignedToName}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(book);
    });

    return Object.entries(groups).map(([key, groupBooks]) => {
      const first = groupBooks[0];
      const sortedBooks = [...groupBooks].sort((a, b) => a.bookNumber.localeCompare(b.bookNumber));
      const range = sortedBooks.length > 0 
        ? `${sortedBooks[0].bookNumber} - ${sortedBooks[sortedBooks.length - 1].bookNumber}`
        : '-';

      return {
        id: key,
        batchName: first.batchName,
        recipientName: first.assignedToName,
        recipientPhone: first.assignedToPhone,
        date: first.assignedDate,
        totalBooks: groupBooks.length,
        range: range,
        registeredCount: groupBooks.filter(b => b.status === 'Registered').length,
        submittedCount: groupBooks.filter(b => b.status === 'Received').length,
        books: groupBooks
      };
    });
  }, [filteredBooks]);

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
              placeholder="Search by Book Number, Holder Name, Phone Number, or Batch..."
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            />
        </div>
      </div>

      {/* Hierarchical Table */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden min-h-[400px]">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
               {/* High Contrast Header for Outer Table */}
               <thead className="bg-slate-800 text-white sticky top-0 z-10 shadow-md">
                  <tr>
                     <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                     <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Recipient</th>
                     <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Type</th>
                     <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Distribution Details</th>
                     <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Lifecycle Status</th>
                     <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-slate-200">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin h-8 w-8 mx-auto mb-2"/>Loading books...</td></tr>
                  ) : groupedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                         <div className="flex flex-col items-center">
                            <Search className="h-8 w-8 mb-2 opacity-50" />
                            <p>No books found matching criteria.</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    groupedData.map(group => {
                       const isGroupExpanded = expandedGroupId === group.id;
                       return (
                          <React.Fragment key={group.id}>
                             {/* Parent Group Row */}
                             <tr 
                                className={`border-b border-slate-100 cursor-pointer 
                                   ${isGroupExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}
                                `}
                                onClick={() => handleToggleGroupExpand(group.id)}
                             >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 flex items-center gap-2">
                                   <Calendar size={14} className="text-slate-400" />
                                   {new Date(group.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap align-top">
                                   <div className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                         {group.recipientName.charAt(0)}
                                      </div>
                                      <div className="ml-4">
                                         <div className="text-sm font-medium text-slate-900">{group.recipientName}</div>
                                         <div className="text-sm text-slate-500">{group.recipientPhone}</div>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 align-top">
                                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                     Individual
                                   </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm align-top">
                                   <div className="flex flex-col items-start gap-1">
                                      <span className="font-bold text-slate-900">{group.totalBooks.toLocaleString()} Books</span>
                                      <span className="text-xs text-slate-500 font-mono">{group.range}</span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                                         {group.batchName}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap align-top">
                                   <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center text-xs">
                                         <span className={`w-1.5 h-1.5 rounded-full mr-2 ${group.registeredCount > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                                         <span className="font-semibold text-slate-700 min-w-[70px]">Registered:</span>
                                         <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{group.registeredCount}</span>
                                      </div>
                                      <div className="flex items-center text-xs">
                                         <span className={`w-1.5 h-1.5 rounded-full mr-2 ${group.submittedCount > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                         <span className="font-semibold text-slate-700 min-w-[70px]">Submitted:</span>
                                         <span className="font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">{group.submittedCount}</span>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                                   <button 
                                      className={`p-1.5 rounded-full transition-colors ${isGroupExpanded ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                   >
                                      {isGroupExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                   </button>
                                </td>
                             </tr>

                             {/* Expanded Inner Table for Books - VISUALLY DISTINCT AND HIGHLIGHTED */}
                             {isGroupExpanded && (
                                <tr className="animate-in fade-in duration-200">
                                   <td colSpan={6} className="px-0 py-0 border-t border-slate-300">
                                      <div className="bg-slate-200/50 p-6 border-b border-slate-300 shadow-inner">
                                         <div className="bg-white border border-indigo-200 rounded-xl overflow-hidden shadow-md ring-1 ring-black/5">
                                            {/* Inner Header - High Contrast */}
                                            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
                                               <h4 className="font-bold text-indigo-900 text-sm flex items-center">
                                                  <User size={16} className="mr-2 text-indigo-600" /> 
                                                  Detailed Book List &mdash; <span className="ml-1 text-indigo-800 text-base">{group.recipientName}</span>
                                               </h4>
                                               <span className="text-xs font-medium text-indigo-500 bg-white px-2 py-1 rounded border border-indigo-100">
                                                  Batch: {group.batchName}
                                               </span>
                                            </div>
                                            <table className="min-w-full divide-y divide-indigo-100">
                                               <thead className="bg-indigo-900 text-white">
                                                  <tr>
                                                     <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Book Number</th>
                                                     <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Holder Name</th>
                                                     <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Phone</th>
                                                     <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Pages Filled</th>
                                                     <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider">Total Amount</th>
                                                     <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Current Status</th>
                                                     <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider">Action</th>
                                                  </tr>
                                               </thead>
                                               <tbody className="divide-y divide-indigo-50 bg-white">
                                                  {group.books.map(book => {
                                                     const isBookExpanded = expandedBookId === book.id;
                                                     return (
                                                        <React.Fragment key={book.id}>
                                                           <tr className={`transition-colors ${isBookExpanded ? 'bg-indigo-50' : 'hover:bg-indigo-50/30'}`}>
                                                              <td className="px-6 py-3 whitespace-nowrap text-sm font-mono font-bold text-slate-700 border-l-4 border-l-transparent hover:border-l-indigo-400">
                                                                 {book.bookNumber}
                                                              </td>
                                                              <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-900 font-medium">
                                                                 {book.assignedToName}
                                                              </td>
                                                              <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                                 {book.assignedToPhone}
                                                              </td>
                                                              <td className="px-6 py-3 whitespace-nowrap text-sm text-center font-mono text-slate-700">
                                                                 {book.status === 'Received' ? (book.filledPages > 0 ? `${book.filledPages}/20` : '0/20') : '-'}
                                                              </td>
                                                              <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-bold text-emerald-600 font-mono">
                                                                 {book.status === 'Received' ? (book.totalAmount > 0 ? `₹${book.totalAmount.toLocaleString()}` : '₹0') : '-'}
                                                              </td>
                                                              <td className="px-6 py-3 whitespace-nowrap text-center">
                                                                 <span className={`px-2 py-1 text-xs rounded-full border font-medium ${
                                                                    book.status === 'Received' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    book.status === 'Registered' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                                 }`}>
                                                                    {book.status === 'Received' ? 'Submitted' : book.status}
                                                                 </span>
                                                              </td>
                                                              <td className="px-6 py-3 whitespace-nowrap text-right">
                                                                 <button 
                                                                    onClick={() => handleToggleBookExpand(book)}
                                                                    className={`inline-flex items-center px-3 py-1 border rounded-md text-xs font-medium transition-colors ${
                                                                      isBookExpanded 
                                                                        ? 'border-indigo-200 bg-indigo-100 text-indigo-700' 
                                                                        : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                                                    }`}
                                                                 >
                                                                    {isBookExpanded ? <ChevronUp size={12} className="mr-1" /> : <Edit size={12} className="mr-1" />}
                                                                    {isBookExpanded ? 'Close' : 'Update'}
                                                                 </button>
                                                              </td>
                                                           </tr>

                                                           {/* Expanded Form for Book */}
                                                           {isBookExpanded && (
                                                               <tr className="bg-indigo-50 animate-in fade-in zoom-in-95 duration-200">
                                                                  <td colSpan={7} className="px-6 py-4 border-b border-indigo-100">
                                                                     <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-indigo-100 shadow-sm p-4 flex flex-col lg:flex-row gap-6 items-end">
                                                                        
                                                                        {/* Status Select - RESTRICTED OPTIONS */}
                                                                        <div className="flex-1 w-full">
                                                                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                                                                           <select 
                                                                              value={formData.status}
                                                                              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                                                              className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                                                                           >
                                                                              <option value="Registered">Registered</option>
                                                                              <option value="Received">Submitted</option>
                                                                           </select>
                                                                        </div>

                                                                        {/* Pages Input - Disabled unless Submitted */}
                                                                        <div className="flex-1 w-full">
                                                                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pages Filled (Max 20)</label>
                                                                           <div className="relative">
                                                                              <input 
                                                                                 type="number" 
                                                                                 min="0" 
                                                                                 max="20"
                                                                                 required
                                                                                 disabled={formData.status !== 'Received'}
                                                                                 value={formData.filledPages}
                                                                                 onChange={(e) => setFormData({...formData, filledPages: parseInt(e.target.value)})}
                                                                                 className={`block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900 ${formData.status !== 'Received' ? 'bg-slate-100 text-slate-400' : 'bg-white'}`}
                                                                              />
                                                                              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">/ 20</span>
                                                                           </div>
                                                                        </div>

                                                                        {/* Amount Input - Disabled unless Submitted */}
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
                                                                                 disabled={formData.status !== 'Received'}
                                                                                 value={formData.totalAmount}
                                                                                 onChange={(e) => setFormData({...formData, totalAmount: parseInt(e.target.value)})}
                                                                                 className={`block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-bold text-emerald-700 ${formData.status !== 'Received' ? 'bg-slate-100 text-slate-400' : 'bg-white'}`}
                                                                              />
                                                                           </div>
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
                                                  })}
                                               </tbody>
                                            </table>
                                         </div>
                                      </div>
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