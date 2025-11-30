import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronRight, ArrowLeft, 
  FileText, Loader2, IndianRupee, Printer, User, Hash, Calendar, Package, Edit, Trash2, Tag,
  ChevronDown, ChevronUp, CheckCircle, Book, Save, Upload
} from 'lucide-react';
import { api } from '../services/api';
import { ReceiverBook, BookPage } from '../types';

const DonorSubmit: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [books, setBooks] = useState<ReceiverBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<ReceiverBook | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Registered' | 'Received'>('All');

  // Expandable Row State
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  // Detail View State
  const [activePage, setActivePage] = useState<BookPage | null>(null);
  const [detailTab, setDetailTab] = useState<'manual' | 'bulk'>('manual');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const data = await api.getReceiverBooks();
    setBooks(data);
    setLoading(false);
  };

  const handleToggleExpand = (groupId: string) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  };
  
  const handleToggleBookExpand = (book: ReceiverBook) => {
     // For this page, maybe we just want to view details or go to detail view
     // Keeping consistent with Book Update for now, but 'View' action goes to detail page
     handleBookClick(book);
  };

  const handleBookClick = async (book: ReceiverBook) => {
    setSelectedBook(book);
    setView('detail');
    setLoading(true);
    const pagesData = await api.getReceiverBookDetails(book.id);
    setPages(pagesData);
    setActivePage(pagesData[0]); // Default to first page
    setLoading(false);
  };

  const handlePageClick = (pageNumber: number) => {
    const page = pages.find(p => p.pageNumber === pageNumber);
    if (page) setActivePage(page);
  };

  const handlePageUpdate = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!activePage) return;
    const { name, value } = e.target;
    setActivePage({ ...activePage, [name]: value });
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !activePage) return;

    setSaving(true);
    const updatedPage = { 
       ...activePage, 
       isFilled: true,
       amount: Number(activePage.amount) || 0
    };

    await api.saveBookPage(selectedBook.id, updatedPage);
    
    const newPages = pages.map(p => p.pageNumber === updatedPage.pageNumber ? updatedPage : p);
    setPages(newPages);
    
    const nextPage = newPages.find(p => p.pageNumber > updatedPage.pageNumber && !p.isFilled);
    if (nextPage) {
        setActivePage(nextPage);
    }
    setSaving(false);
  };

  const handleFinalize = async () => {
    if (!selectedBook) return;
    if (confirm("Confirm that you have received this book and collected the amount? This will change status to 'Received'.")) {
        await api.finalizeBook(selectedBook.id);
        const updatedBooks = books.map(b => b.id === selectedBook.id ? { ...b, status: 'Received' as const } : b);
        setBooks(updatedBooks);
        alert("Book Successfully Received!");
        setView('list');
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedBook) {
          setSaving(true);
          await api.uploadBookExcel(selectedBook.id, file);
          setSaving(false);
          alert("Excel uploaded successfully! Pages updated.");
          const pagesData = await api.getReceiverBookDetails(selectedBook.id);
          setPages(pagesData);
      }
  };

  // --- Filtering Logic ---
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (statusFilter !== 'All' && book.status !== statusFilter) return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        book.bookNumber.toLowerCase().includes(q) ||
        book.assignedToName.toLowerCase().includes(q) ||
        book.assignedToPhone.includes(q) ||
        (book.pssmId && book.pssmId.toLowerCase().includes(q)) ||
        book.batchName.toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [books, searchQuery, statusFilter]);

  // --- Grouping Logic (Matches BookUpdate.tsx) ---
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


  if (loading && view === 'list') return <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-96"><Loader2 className="animate-spin h-8 w-8 mb-4" />Loading Inventory...</div>;

  // View 1: Book List (Main Page)
  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
        
        <div className="flex justify-between items-center shrink-0">
           <div>
              <h2 className="text-2xl font-bold text-slate-800">Donor Submission</h2>
              <p className="text-slate-500 text-sm">Process registered books and submit donor details.</p>
           </div>
        </div>

        {/* Main Content Area (Hierarchical Table) */}
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden flex flex-col flex-1">
           
           {/* Toolbar */}
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row justify-between gap-4 shrink-0">
              <div className="relative flex-1 max-w-lg">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                 </div>
                 <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Book #, Name, Phone, or PSSM ID..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                 />
              </div>
              <div className="flex p-1 bg-slate-200 rounded-lg shrink-0">
                 {(['All', 'Registered', 'Received'] as const).map((status) => (
                    <button
                       key={status}
                       onClick={() => setStatusFilter(status)}
                       className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                          statusFilter === status 
                             ? 'bg-white text-indigo-600 shadow-sm' 
                             : 'text-slate-600 hover:text-slate-800'
                       }`}
                    >
                       {status}
                    </button>
                 ))}
              </div>
           </div>

           {/* Table */}
           <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200">
                 {/* High Contrast Header */}
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
                    {groupedData.length === 0 ? (
                       <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                             <div className="flex flex-col items-center justify-center">
                                <Search size={32} className="mb-2 opacity-50" />
                                <p>No records found matching criteria.</p>
                             </div>
                          </td>
                       </tr>
                    ) : (
                        groupedData.map(group => {
                          const isExpanded = expandedGroupId === group.id;
                          return (
                            <React.Fragment key={group.id}>
                               {/* Parent Row */}
                               <tr 
                                  className={`transition-all duration-200 border-b border-slate-100 cursor-pointer 
                                     ${isExpanded ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}
                                  `}
                                  onClick={() => handleToggleExpand(group.id)}
                               >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 flex items-center gap-2 align-top">
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
                                        className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                     >
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                     </button>
                                  </td>
                               </tr>

                               {/* Child Row (Books Table) */}
                               {isExpanded && (
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
                                                                      {isBookExpanded ? 'Close' : 'View'}
                                                                   </button>
                                                                </td>
                                                             </tr>
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
  }

  // View 2: Detail Data Entry (Unchanged)
  const totalAmount = pages.reduce((acc, p) => acc + (p.amount || 0), 0);
  
  return (
    <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
       {/* Top Bar */}
       <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                   {selectedBook?.bookNumber}
                   <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 font-normal">
                      {selectedBook?.batchName}
                   </span>
                </h2>
                <div className="flex gap-4 text-sm mt-1">
                   <p className="text-slate-600"><span className="text-slate-400">Holder:</span> <span className="font-semibold">{selectedBook?.assignedToName}</span></p>
                   <p className="text-slate-600"><span className="text-slate-400">Phone:</span> {selectedBook?.assignedToPhone}</p>
                </div>
             </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
             <div className="text-right">
                 <p className="text-xs text-slate-500">Collected Amount</p>
                 <p className="text-2xl font-bold text-emerald-600">₹{totalAmount.toLocaleString()}</p>
             </div>
             <div className="flex gap-2">
                 <div className="bg-slate-100 rounded-md p-1 flex">
                    <button 
                       onClick={() => setDetailTab('manual')}
                       className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${detailTab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       Manual
                    </button>
                    <button 
                       onClick={() => setDetailTab('bulk')}
                       className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${detailTab === 'bulk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       Bulk Upload
                    </button>
                 </div>
                 {selectedBook?.status !== 'Received' && (
                    <button 
                       onClick={handleFinalize}
                       className="flex items-center px-4 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-xs font-bold uppercase tracking-wide transition-colors ml-2 shadow-sm"
                    >
                       <CheckCircle size={14} className="mr-2" /> Mark Received
                    </button>
                 )}
             </div>
          </div>
       </div>

       {detailTab === 'manual' ? (
         <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
            {/* Left: Grid Navigation */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6 overflow-y-auto">
               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Printer size={18} /> Select Page (1-20)
               </h3>
               <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-lg">
                  {pages.map(page => (
                     <button
                        key={page.pageNumber}
                        onClick={() => handlePageClick(page.pageNumber)}
                        className={`
                           aspect-square rounded-lg text-sm font-bold flex items-center justify-center transition-all border shadow-sm
                           ${activePage?.pageNumber === page.pageNumber 
                              ? 'ring-2 ring-indigo-500 ring-offset-2 z-10 scale-105' 
                              : ''}
                           ${page.isFilled 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}
                        `}
                     >
                        {page.pageNumber}
                     </button>
                  ))}
               </div>
               <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded"></div> Filled</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border border-slate-200 rounded"></div> Empty</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-indigo-500 rounded"></div> Selected</div>
               </div>
            </div>

            {/* Right: Entry Form */}
            <div className="w-full md:w-96 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col shrink-0">
               <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                  <h3 className="font-bold text-slate-800">Page {activePage?.pageNumber} Details</h3>
               </div>
               <div className="p-6 flex-1 overflow-y-auto">
                  {loading ? (
                     <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-300" /></div>
                  ) : activePage ? (
                     <form id="page-form" onSubmit={handleSavePage} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-1">
                              <label className="block text-sm font-medium text-slate-700 flex items-center">
                                 <Hash size={12} className="mr-1" /> Receipt #
                              </label>
                              <input 
                                 type="text" 
                                 name="receiptNumber" 
                                 value={activePage.receiptNumber || ''} 
                                 onChange={handlePageUpdate}
                                 className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                                 placeholder="RCP-XXXX"
                              />
                           </div>
                           <div className="col-span-1">
                               <label className="block text-sm font-medium text-slate-700">Amount (₹)</label>
                               <input 
                                  type="number" 
                                  name="amount" 
                                  value={activePage.amount || ''} 
                                  onChange={handlePageUpdate}
                                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono font-bold text-emerald-600"
                                  placeholder="0"
                               />
                           </div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-700">Donor Name</label><input type="text" name="donorName" value={activePage.donorName || ''} onChange={handlePageUpdate} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Rajesh Kumar" /></div>
                        <div><label className="block text-sm font-medium text-slate-700">Phone Number</label><input type="tel" name="donorPhone" value={activePage.donorPhone || ''} onChange={handlePageUpdate} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="10 digit number" /></div>
                        <div><label className="block text-sm font-medium text-slate-700">Address / City</label><textarea name="donorAddress" value={activePage.donorAddress || ''} onChange={handlePageUpdate} rows={2} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea></div>
                        <div><label className="block text-sm font-medium text-slate-700 flex items-center"><User size={12} className="mr-1" /> Receiver Name</label><input type="text" name="receiverName" value={activePage.receiverName || ''} onChange={handlePageUpdate} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Collected By" /></div>
                     </form>
                  ) : (
                     <p className="text-slate-400 text-center mt-10">Select a page to edit</p>
                  )}
               </div>
               <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                  <button 
                     type="submit" 
                     form="page-form"
                     disabled={saving || selectedBook?.status === 'Received'}
                     className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
                  >
                     {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                     Save Page Data
                  </button>
               </div>
            </div>
         </div>
       ) : (
         <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
            <div className="max-w-md w-full space-y-6">
               <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto"><FileText size={32} /></div>
               <div><h3 className="text-xl font-bold text-slate-900">Upload Book Data</h3><p className="text-slate-500 mt-2">Download the template, fill in the 20 pages for <strong>{selectedBook?.bookNumber}</strong>, and upload here.</p></div>
               <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors cursor-pointer relative"><input type="file" onChange={handleBulkUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".xlsx" /><Upload className="mx-auto text-slate-400 mb-2" /><span className="text-indigo-600 font-medium">Click to upload Excel</span></div>
               <button className="text-sm text-slate-500 hover:text-indigo-600 underline">Download Excel Template</button>
            </div>
         </div>
       )}
    </div>
  );
};

export default DonorSubmit;