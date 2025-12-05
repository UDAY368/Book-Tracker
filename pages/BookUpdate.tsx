
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, CheckCircle, AlertCircle, 
  Save, X, Loader2, ChevronLeft, ChevronRight,
  Book, Calendar, User, Phone, 
  ArrowRight, CreditCard, Banknote, IndianRupee, RefreshCw, Hash, FileText,
  Printer, CheckSquare, Square, Download
} from 'lucide-react';
import { api } from '../services/api';
import { ReceiverBook } from '../types';

const BookSubmit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [books, setBooks] = useState<ReceiverBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Submit/Update Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ReceiverBook | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // History Selection State
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
     submissionDate: new Date().toISOString().split('T')[0],
     pagesFilled: '', // Keep as string for input handling, convert to number on submit
     paymentMode: 'Offline' as 'Online' | 'Offline' | 'Check',
     transactionId: '',
     checkNumber: '',
     amount: '' // Keep as string for input handling
  });

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await api.getReceiverBooks();
      setBooks(data);
    } catch (e) {
      console.error("Failed to load books", e);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredBooks = books.filter(book => {
      const matchesSearch = 
          book.bookNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (book.assignedToName && book.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (activeTab === 'pending') {
          // In Book Receiver context, 'Registered' status implies it is with the receiver and pending submission
          return matchesSearch && (book.status === 'Registered');
      } else {
          return matchesSearch && (book.status === 'Received');
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
    setSelectedHistoryIds(new Set()); // Reset selection on tab change
  }, [activeTab, searchQuery]);

  // Handlers
  const openSubmitModal = (book: ReceiverBook) => {
      setSelectedBook(book);
      // Pre-fill existing data if updating, or defaults if new submission
      setFormData({
         submissionDate: book.receivedDate ? book.receivedDate.split('T')[0] : new Date().toISOString().split('T')[0],
         pagesFilled: book.filledPages ? String(book.filledPages) : '',
         paymentMode: book.paymentMode || 'Offline',
         transactionId: book.transactionId || '',
         checkNumber: book.checkNumber || '',
         amount: book.totalAmount ? String(book.totalAmount) : ''
      });
      setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBook) return;

      setIsSubmitting(true);
      try {
          await api.submitBook(selectedBook.bookNumber, {
              submissionDate: formData.submissionDate,
              pagesFilled: Number(formData.pagesFilled),
              amount: Number(formData.amount),
              paymentMode: formData.paymentMode,
              transactionId: formData.transactionId,
              checkNumber: formData.checkNumber
          });

          setToastMessage(activeTab === 'pending' ? 'Book Submitted Successfully!' : 'Submission Updated Successfully!');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          
          await loadBooks(); 
          setIsModalOpen(false);
      } catch (error) {
          alert("Failed to submit book");
      } finally {
          setIsSubmitting(false);
      }
  };

  // Selection Handlers
  const handleSelectHistory = (id: string) => {
      const newSet = new Set(selectedHistoryIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedHistoryIds(newSet);
  };

  const handleSelectAllHistory = () => {
      if (selectedHistoryIds.size === paginatedBooks.length && paginatedBooks.length > 0) {
          setSelectedHistoryIds(new Set());
      } else {
          const newSet = new Set<string>();
          paginatedBooks.forEach(b => newSet.add(b.id));
          setSelectedHistoryIds(newSet);
      }
  };

  const handlePrintReceipt = () => {
      const content = receiptRef.current;
      if (!content) return;

      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
          doc.open();
          doc.write(`
              <html>
                  <head>
                      <title>Submission Receipt</title>
                      <style>
                          body { font-family: 'Inter', sans-serif; padding: 40px; }
                          .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 8px; }
                          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
                          .header h1 { color: #1e293b; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                          .header p { color: #64748b; font-size: 14px; margin-top: 8px; }
                          .content { margin-bottom: 40px; }
                          .row { display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
                          .label { font-weight: bold; color: #64748b; font-size: 14px; }
                          .value { font-weight: bold; color: #0f172a; font-size: 16px; text-align: right; }
                          .footer { text-align: center; margin-top: 60px; color: #64748b; font-size: 14px; font-weight: 600; }
                          .book-list { font-family: monospace; background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 14px; line-height: 1.5; text-align: right; max-width: 60%; }
                      </style>
                  </head>
                  <body>
                      ${content.innerHTML}
                  </body>
              </html>
          `);
          doc.close();
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          // Cleanup
          setTimeout(() => {
              document.body.removeChild(iframe);
          }, 1000);
      }
  };

  const handleDownloadPDF = () => {
      const element = receiptRef.current;
      if (!element) return;

      const opt = {
          margin: 10,
          filename: `submission_receipt_${new Date().getTime()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const scriptUrl = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      
      // Helper to execute save
      const savePdf = () => {
          if ((window as any).html2pdf) {
              (window as any).html2pdf().set(opt).from(element).save();
          } else {
              alert("Error loading PDF generator. Please check your connection.");
          }
      };

      // Check if script is already loaded
      if ((window as any).html2pdf) {
          savePdf();
      } else {
          // Dynamic Load
          const script = document.createElement('script');
          script.src = scriptUrl;
          script.onload = savePdf;
          document.body.appendChild(script);
      }
  };

  // Stats Calculation
  const stats = {
      totalAssigned: books.filter(b => b.status === 'Registered' || b.status === 'Received').length,
      pending: books.filter(b => b.status === 'Registered').length,
      submitted: books.filter(b => b.status === 'Received').length
  };

  const completionRate = stats.totalAssigned > 0 ? Math.round((stats.submitted / stats.totalAssigned) * 100) : 0;

  // Receipt Data Preparation
  const getReceiptData = () => {
      const selectedItems = books.filter(b => selectedHistoryIds.has(b.id));
      if (selectedItems.length === 0) return null;

      const totalDonors = selectedItems.reduce((sum, b) => sum + (b.filledPages || 0), 0);
      const totalAmount = selectedItems.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      // Determine recipient name
      const uniqueNames = Array.from(new Set(selectedItems.map(b => b.assignedToName)));
      const recipientName = uniqueNames.length === 1 ? uniqueNames[0] : 'Multiple Recipients';

      return {
          items: selectedItems,
          totalDonors,
          totalAmount,
          recipientName,
          isSingle: selectedItems.length === 1
      };
  };

  const receiptData = getReceiptData();

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

       {/* Header & Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Progress Card */}
           <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
               <div>
                  <h2 className="text-xl font-bold text-slate-800">Book Submit</h2>
                  <p className="text-sm text-slate-500 mt-1">Manage returns & collections</p>
               </div>
               <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600">{completionRate}%</span>
                  </div>
                  <p className="text-xs text-slate-400">Submission Rate</p>
               </div>
           </div>
           
           {/* Total Assigned */}
           <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><Book size={20} /></div>
                   <span className="text-indigo-900 font-bold text-sm uppercase opacity-70">Total Assigned</span>
               </div>
               <span className="text-3xl font-bold text-indigo-900">{stats.totalAssigned}</span>
           </div>

           {/* Pending Submission */}
           <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm"><AlertCircle size={20} /></div>
                   <span className="text-amber-900 font-bold text-sm uppercase opacity-70">Pending Submit</span>
               </div>
               <span className="text-3xl font-bold text-amber-900">{stats.pending}</span>
           </div>
       </div>

       {/* Main Content Area */}
       <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
           
           {/* Tabs */}
           <div className="flex border-b border-slate-200">
               <button 
                  onClick={() => setActiveTab('pending')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'pending' ? 'border-amber-500 text-amber-700 bg-amber-50/20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
               >
                  <AlertCircle size={16} /> Pending Submission
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{stats.pending}</span>
               </button>
               <button 
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'history' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
               >
                  <CheckCircle size={16} /> Generate Receipt
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{stats.submitted}</span>
               </button>
           </div>

           {/* Toolbar */}
           <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 sticky top-0 z-20">
               <div className="relative w-full max-w-md">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="text" 
                      placeholder="Search Book Number or Recipient Name..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                   />
               </div>
               
               <div className="flex items-center gap-3">
                   {activeTab === 'history' && selectedHistoryIds.size > 0 && (
                       <button 
                          onClick={() => setShowReceiptModal(true)}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-all animate-in zoom-in"
                       >
                           <Printer size={16} /> Generate Receipt ({selectedHistoryIds.size})
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
                               {activeTab === 'history' && (
                                   <th className="px-6 py-3 w-10">
                                       <button onClick={handleSelectAllHistory} className="text-slate-500 hover:text-indigo-600">
                                           {selectedHistoryIds.size === paginatedBooks.length && paginatedBooks.length > 0 ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18}/>}
                                       </button>
                                   </th>
                               )}
                               <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Book Number</th>
                               <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient Name</th>
                               <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</th>
                               {activeTab === 'history' && (
                                   <>
                                       <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Total Donors</th>
                                       <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Donation Amount</th>
                                   </>
                               )}
                               <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                           </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-slate-100">
                           {paginatedBooks.length === 0 ? (
                               <tr><td colSpan={activeTab === 'history' ? 7 : 4} className="px-6 py-12 text-center text-slate-400 italic">No books found in this category.</td></tr>
                           ) : (
                               paginatedBooks.map((book, idx) => (
                                   <tr key={idx} className={`hover:bg-slate-50 transition-colors ${selectedHistoryIds.has(book.id) ? 'bg-indigo-50/40' : ''}`}>
                                       {activeTab === 'history' && (
                                           <td className="px-6 py-4 whitespace-nowrap">
                                               <button onClick={() => handleSelectHistory(book.id)} className="text-slate-400 hover:text-indigo-600">
                                                   {selectedHistoryIds.has(book.id) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18}/>}
                                               </button>
                                           </td>
                                       )}
                                       <td className="px-6 py-4 whitespace-nowrap">
                                           <div className="flex items-center gap-2">
                                               <Book size={16} className="text-slate-400" />
                                               <span className="font-bold font-mono text-indigo-600">{book.bookNumber}</span>
                                           </div>
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-800">{book.assignedToName}</span>
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Phone size={14} className="text-slate-400" />
                                                <span className="text-sm font-medium">{book.assignedToPhone || '-'}</span>
                                            </div>
                                       </td>
                                       {activeTab === 'history' && (
                                           <>
                                               <td className="px-6 py-4 whitespace-nowrap text-center">
                                                   <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{book.filledPages}/20</span>
                                               </td>
                                               <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                                                   ₹{book.totalAmount.toLocaleString()}
                                               </td>
                                           </>
                                       )}
                                       <td className="px-6 py-4 whitespace-nowrap text-right">
                                           {activeTab === 'pending' ? (
                                               <button 
                                                  onClick={() => openSubmitModal(book)}
                                                  className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
                                               >
                                                   Submit <ArrowRight size={12} className="ml-1" />
                                               </button>
                                           ) : (
                                               <button 
                                                  onClick={() => openSubmitModal(book)}
                                                  className="inline-flex items-center px-3 py-1.5 bg-white text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 border border-slate-200 transition-all"
                                               >
                                                   Update Info
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

       {/* Submit/Update Modal */}
       {isModalOpen && selectedBook && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
               <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                   {/* Modal Header */}
                   <div className="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
                       <div>
                           <h3 className="text-xl font-bold">{activeTab === 'pending' ? 'Submit Book' : 'Update Submission'}</h3>
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
                   <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                       
                       {/* Read-only Information */}
                       <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 border-b border-slate-200 pb-2">Recipient Details</h4>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="text-xs text-slate-500 block">Name</label>
                                   <p className="text-sm font-bold text-slate-800">{selectedBook.assignedToName}</p>
                                </div>
                                <div>
                                   <label className="text-xs text-slate-500 block">Phone</label>
                                   <p className="text-sm font-medium text-slate-800">{selectedBook.assignedToPhone}</p>
                                </div>
                                <div>
                                   <label className="text-xs text-slate-500 block">PSSM ID</label>
                                   <p className="text-sm font-medium text-slate-800">{selectedBook.pssmId || 'N/A'}</p>
                                </div>
                                <div>
                                   <label className="text-xs text-slate-500 block">Address</label>
                                   <p className="text-sm font-medium text-slate-800 truncate" title={selectedBook.address}>{selectedBook.address || 'N/A'}</p>
                                </div>
                           </div>
                       </div>

                       {/* Input Fields */}
                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Submission Date</label>
                           <div className="relative">
                               <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                               <input 
                                  type="date" 
                                  name="submissionDate"
                                  required
                                  value={formData.submissionDate}
                                  onChange={handleInputChange}
                                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                               />
                           </div>
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Total Donors <span className="text-slate-400 font-normal">(Max 20)</span></label>
                           <div className="flex items-center">
                               <input 
                                  type="number" 
                                  name="pagesFilled"
                                  required
                                  min="0"
                                  max="20"
                                  value={formData.pagesFilled}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                  placeholder="0"
                               />
                               <span className="bg-slate-100 text-slate-500 px-4 py-2 border border-l-0 border-slate-300 rounded-r-lg font-bold">/ 20</span>
                           </div>
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Payment Mode</label>
                           <div className="grid grid-cols-3 gap-2">
                               {['Offline', 'Online', 'Check'].map((mode) => (
                                   <label 
                                      key={mode}
                                      className={`
                                        cursor-pointer text-center py-2 rounded-lg border text-sm font-medium transition-all
                                        ${formData.paymentMode === mode 
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                        }
                                      `}
                                   >
                                       <input 
                                          type="radio" 
                                          name="paymentMode" 
                                          value={mode} 
                                          checked={formData.paymentMode === mode} 
                                          onChange={handleInputChange}
                                          className="hidden" 
                                       />
                                       {mode === 'Offline' && <Banknote size={16} className="inline mr-1 mb-0.5" />}
                                       {mode === 'Online' && <CreditCard size={16} className="inline mr-1 mb-0.5" />}
                                       {mode === 'Check' && <FileText size={16} className="inline mr-1 mb-0.5" />}
                                       {mode}
                                   </label>
                               ))}
                           </div>
                       </div>

                       {/* Conditional Fields based on Payment Mode */}
                       {formData.paymentMode === 'Online' && (
                           <div className="animate-in fade-in slide-in-from-top-2">
                               <label className="block text-sm font-bold text-slate-700 mb-1">Transaction ID <span className="text-red-500">*</span></label>
                               <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        name="transactionId"
                                        required
                                        placeholder="Enter UPI / Bank Ref No."
                                        value={formData.transactionId}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-indigo-50/30"
                                    />
                               </div>
                           </div>
                       )}

                       {formData.paymentMode === 'Check' && (
                           <div className="animate-in fade-in slide-in-from-top-2">
                               <label className="block text-sm font-bold text-slate-700 mb-1">Check Number <span className="text-red-500">*</span></label>
                               <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        name="checkNumber"
                                        required
                                        placeholder="Enter Check No."
                                        value={formData.checkNumber}
                                        onChange={handleInputChange}
                                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-indigo-50/30"
                                    />
                               </div>
                           </div>
                       )}

                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Donation Amount <span className="text-red-500">*</span></label>
                           <div className="relative">
                               <IndianRupee className="absolute left-3 top-2.5 text-slate-400" size={16} />
                               <input 
                                  type="number" 
                                  name="amount"
                                  required
                                  value={formData.amount}
                                  onChange={handleInputChange}
                                  placeholder="0.00"
                                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
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
                              disabled={isSubmitting}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center"
                           >
                               {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                               {activeTab === 'pending' ? 'Submit Book' : 'Update Info'}
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* Receipt Modal */}
       {showReceiptModal && receiptData && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReceiptModal(false)}></div>
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl relative z-10 flex flex-col max-h-[90vh]">
                   <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center rounded-t-xl">
                       <h3 className="text-xl font-bold flex items-center gap-2"><Printer size={20}/> Submission Receipt Preview</h3>
                       <button onClick={() => setShowReceiptModal(false)} className="text-indigo-200 hover:text-white bg-indigo-700/50 p-1.5 rounded-full transition-colors"><X size={20} /></button>
                   </div>
                   
                   <div className="flex-1 overflow-auto bg-slate-100 p-8 flex justify-center">
                       <div ref={receiptRef} className="bg-white p-10 shadow-lg w-full max-w-2xl border border-slate-200 print:shadow-none print:border-0">
                           {/* Receipt Content Structure matches specified requirements */}
                           <div className="text-center border-b-2 border-slate-100 pb-6 mb-6">
                               <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">Patriji Dhayana Maha Yagam - 4</h1>
                               <p className="text-slate-500 text-sm mt-2">Official Book Submission Receipt</p>
                           </div>

                           <div className="space-y-4 text-slate-700">
                               {receiptData.isSingle ? (
                                   <>
                                       <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                           <span className="font-bold text-slate-500">Book Number</span>
                                           <span className="font-bold font-mono text-lg">{receiptData.items[0].bookNumber}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                           <span className="font-bold text-slate-500">Recipient Name</span>
                                           <span className="font-bold">{receiptData.items[0].assignedToName}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                           <span className="font-bold text-slate-500">Total Donors</span>
                                           <span className="font-bold">{receiptData.items[0].filledPages}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                           <span className="font-bold text-slate-500">Donation Amount</span>
                                           <span className="font-bold text-xl">₹{receiptData.items[0].totalAmount.toLocaleString()}</span>
                                       </div>
                                   </>
                               ) : (
                                   <>
                                       <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-2">
                                           <span className="font-bold text-slate-500 mt-1">Book Numbers</span>
                                           <div className="font-mono text-sm text-right bg-slate-50 p-2 rounded max-w-[60%] leading-relaxed">
                                               {receiptData.items.map(b => b.bookNumber).join(', ')}
                                           </div>
                                       </div>
                                       <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                           <span className="font-bold text-slate-500">Recipient Name</span>
                                           <span className="font-bold">{receiptData.recipientName}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                           <span className="font-bold text-slate-500">Total Donors</span>
                                           <span className="font-bold">{receiptData.totalDonors}</span>
                                       </div>
                                       <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                           <span className="font-bold text-slate-500">Total Donation Amount</span>
                                           <span className="font-bold text-xl">₹{receiptData.totalAmount.toLocaleString()}</span>
                                       </div>
                                   </>
                               )}
                           </div>

                           <div className="text-center mt-12 pt-6 border-t border-slate-100">
                               <h3 className="text-xl font-serif italic text-slate-600">Thank You</h3>
                               <p className="text-xs text-slate-400 mt-2">Pyramid Spiritual Society Movement</p>
                           </div>
                       </div>
                   </div>

                   <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
                       <button onClick={() => setShowReceiptModal(false)} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-bold transition-colors">
                           Cancel
                       </button>
                       <button onClick={handlePrintReceipt} className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 shadow-lg flex items-center gap-2">
                           <Printer size={18} /> Print
                       </button>
                       <button onClick={handleDownloadPDF} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
                           <Download size={18} /> Download PDF
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default BookSubmit;
