
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, CheckCircle, Clock, ChevronRight, Save, Upload, ArrowLeft, 
  FileText, Loader2, IndianRupee, Printer, User, Hash, Search, Filter 
} from 'lucide-react';
import { api } from '../../services/api';
import { ReceiverBook, BookPage } from '../../types';

const ReceiverDashboard: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [books, setBooks] = useState<ReceiverBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<ReceiverBook | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Registered' | 'Received' | 'Distributed'>('Registered');

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
    
    // Update local state
    const newPages = pages.map(p => p.pageNumber === updatedPage.pageNumber ? updatedPage : p);
    setPages(newPages);
    
    // Auto-advance to next empty page
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
        
        // Optimistic Update
        const updatedBooks = books.map(b => b.id === selectedBook.id ? { ...b, status: 'Received' as const } : b);
        setBooks(updatedBooks);
        
        alert("Book Successfully Received!");
        setView('list');
        // Reset Filter to Received so they see it there? Or stay on Registered? 
        // Staying on current filter is usually better UX, but maybe they want to verify it moved.
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedBook) {
          setSaving(true);
          await api.uploadBookExcel(selectedBook.id, file);
          setSaving(false);
          alert("Excel uploaded successfully! Pages updated.");
          // Reload pages to show new data
          const pagesData = await api.getReceiverBookDetails(selectedBook.id);
          setPages(pagesData);
      }
  };

  // --- Filtering Logic ---
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      // 1. Status Filter
      if (book.status !== statusFilter) return false;

      // 2. Search Filter (Book #, Name, Phone, PSSM ID)
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        book.bookNumber.toLowerCase().includes(q) ||
        book.assignedToName.toLowerCase().includes(q) ||
        book.assignedToPhone.includes(q) ||
        (book.pssmId && book.pssmId.toLowerCase().includes(q));

      return matchesSearch;
    });
  }, [books, searchQuery, statusFilter]);

  // Calculate Stats based on *All* books (or current filter? Usually all is better for top cards)
  const receivedBooks = books.filter(b => b.status === 'Received');
  const totalAmountCollected = receivedBooks.reduce((acc, b) => acc + b.totalAmount, 0);
  const pendingCollection = books.filter(b => b.status === 'Registered').length;

  // --- Render Functions ---

  if (loading && view === 'list') return <div className="p-8 text-center text-slate-400">Loading Inventory...</div>;

  // View 1: Book List
  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* KPI Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-xs text-slate-500 uppercase font-semibold">Total Received Books</p>
                 <h3 className="text-2xl font-bold text-slate-900 mt-1">{receivedBooks.length}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={24} /></div>
           </div>
           <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-xs text-slate-500 uppercase font-semibold">Total Amount Collected</p>
                 <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{totalAmountCollected.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><IndianRupee size={24} /></div>
           </div>
           <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-xs text-slate-500 uppercase font-semibold">Pending Collection</p>
                 <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingCollection}</h3>
                 <p className="text-xs text-amber-600 mt-1">Ready to receive</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock size={24} /></div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
           
           {/* Toolbar: Search & Tabs */}
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row justify-between gap-4">
              
              {/* Search Bar */}
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

              {/* Status Filter Tabs */}
              <div className="flex p-1 bg-slate-200 rounded-lg shrink-0">
                 {(['Registered', 'Received', 'Distributed'] as const).map((status) => (
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
           <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200">
                 <thead className="bg-slate-50">
                    <tr>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Book Number</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Book Holder (Receiver)</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</th>
                       <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pages Filled</th>
                       <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
                       <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                       <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                    {filteredBooks.length === 0 ? (
                       <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                             <div className="flex flex-col items-center justify-center">
                                <Search size={32} className="mb-2 opacity-50" />
                                <p>No books found matching criteria.</p>
                             </div>
                          </td>
                       </tr>
                    ) : (
                       filteredBooks.map(book => (
                          <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-bold text-slate-800 font-mono bg-slate-100 px-2 py-1 rounded">{book.bookNumber}</span>
                                <div className="text-[10px] text-slate-400 mt-1">{book.batchName}</div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                   <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">
                                      {book.assignedToName.charAt(0)}
                                   </div>
                                   <div>
                                      <div className="text-sm font-medium text-slate-900">{book.assignedToName}</div>
                                      {book.pssmId && <div className="text-xs text-slate-500">{book.pssmId}</div>}
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                {book.assignedToPhone}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap align-middle">
                                <div className="flex items-center gap-2">
                                   <div className="w-20 bg-slate-200 rounded-full h-2">
                                      <div 
                                         className={`h-2 rounded-full transition-all ${book.filledPages === 20 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                         style={{ width: `${(book.filledPages / 20) * 100}%` }}
                                      ></div>
                                   </div>
                                   <span className="text-xs font-medium text-slate-700">{book.filledPages} / 20</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600">
                                ₹{book.totalAmount.toLocaleString()}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`px-2 py-1 text-xs rounded-full border font-medium ${
                                   book.status === 'Received' ? 'bg-green-50 text-green-700 border-green-200' :
                                   book.status === 'Registered' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                   'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                   {book.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button 
                                   onClick={() => handleBookClick(book)}
                                   className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 text-sm font-medium transition-colors"
                                >
                                   {book.status === 'Received' ? 'View Details' : 'Process'} <ChevronRight size={14} className="ml-1" />
                                </button>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  }

  // View 2: Detail Data Entry
  const totalAmount = pages.reduce((acc, p) => acc + (p.amount || 0), 0);
  const pagesFilled = pages.filter(p => p.isFilled).length;

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
               {/* Grid optimized for 20 pages (5 columns x 4 rows) */}
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

                        <div>
                           <label className="block text-sm font-medium text-slate-700">Donor Name</label>
                           <input 
                              type="text" 
                              name="donorName" 
                              value={activePage.donorName || ''} 
                              onChange={handlePageUpdate}
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="e.g. Rajesh Kumar"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                           <input 
                              type="tel" 
                              name="donorPhone" 
                              value={activePage.donorPhone || ''} 
                              onChange={handlePageUpdate}
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="10 digit number"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700">Address / City</label>
                           <textarea 
                              name="donorAddress" 
                              value={activePage.donorAddress || ''} 
                              onChange={handlePageUpdate}
                              rows={2}
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                           ></textarea>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 flex items-center">
                              <User size={12} className="mr-1" /> Receiver Name
                           </label>
                           <input 
                              type="text" 
                              name="receiverName" 
                              value={activePage.receiverName || ''} 
                              onChange={handlePageUpdate}
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Collected By"
                           />
                        </div>
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
         // Bulk View
         <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
            <div className="max-w-md w-full space-y-6">
               <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                  <FileText size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-slate-900">Upload Book Data</h3>
                  <p className="text-slate-500 mt-2">
                     Download the template, fill in the 20 pages for <strong>{selectedBook?.bookNumber}</strong>, and upload here.
                  </p>
               </div>
               
               <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input type="file" onChange={handleBulkUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".xlsx" />
                  <Upload className="mx-auto text-slate-400 mb-2" />
                  <span className="text-indigo-600 font-medium">Click to upload Excel</span>
               </div>
               
               <button className="text-sm text-slate-500 hover:text-indigo-600 underline">
                  Download Excel Template
               </button>
            </div>
         </div>
       )}
    </div>
  );
};

export default ReceiverDashboard;
