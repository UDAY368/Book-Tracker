
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, ArrowLeft, Loader2, User, ChevronDown, ChevronUp, 
  Save, AlertTriangle, ArrowUpDown, RefreshCw, CheckCircle,
  Clock, BookOpen, AlertCircle, IndianRupee, Hash, CreditCard, Banknote, MapPin, Mail, Phone,
  FileText, Briefcase, Eye, X, Calendar, ChevronLeft, ChevronRight, FileBadge
} from 'lucide-react';
import { api } from '../services/api';
import { ReceiverBook, BookPage } from '../types';

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

// Dropdown Constants
const GENDERS = ['Male', 'Female', 'Others'];
const PROFESSIONS = [
    'Agriculture', 'Business', 'Software', 'State Govt', 
    'Central Govt', 'Doctor', 'Student', 'House Wife', 'Others'
];
const ID_PROOF_TYPES = ['Aadhar Number', 'PAN Number'];
const EMAIL_DOMAINS = ['@gmail.com', '@outlook.com', '@yahoo.com', '@hotmail.com', '@icloud.com'];

// Helper: KPI Card
const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, subtext }: { title: string, value: string | number, icon: any, colorClass: string, bgClass: string, subtext?: string }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-full hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
            </div>
            <div className={`p-2.5 rounded-lg ${bgClass} ${colorClass}`}>
                <Icon size={20} />
            </div>
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
);

const DonorSubmit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submitted' | 'info'>('submitted');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [books, setBooks] = useState<any[]>([]); 
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Location Data for Dropdowns
  const [locationData, setLocationData] = useState<any>({});
  
  // Event Context
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Detail View State
  const [activePage, setActivePage] = useState<BookPage | null>(null);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // UI Local State for Complex Inputs (Email Split)
  const [emailUser, setEmailUser] = useState('');
  const [emailDomain, setEmailDomain] = useState('');

  // Computed Totals for Validation
  const [currentTotalAmount, setCurrentTotalAmount] = useState(0);

  // Accordion State for Info Tab
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [expandedBookPages, setExpandedBookPages] = useState<BookPage[]>([]);
  const [loadingExpanded, setLoadingExpanded] = useState(false);
  const [viewDonorModal, setViewDonorModal] = useState<BookPage | null>(null);

  // --- Expanded Row Search & Pagination ---
  const [expandedSearch, setExpandedSearch] = useState('');
  const [expandedPage, setExpandedPage] = useState(1);
  const expandedRowsPerPage = 5;

  useEffect(() => {
    loadBooks();
    loadLocations();
  }, [selectedYagam]);

  // Sync email parts when activePage changes
  useEffect(() => {
      if (activePage) {
          if (activePage.email) {
              const parts = activePage.email.split('@');
              if (parts.length > 1) {
                  const domain = '@' + parts[parts.length - 1];
                  if (EMAIL_DOMAINS.includes(domain)) {
                      setEmailUser(parts.slice(0, parts.length - 1).join('@'));
                      setEmailDomain(domain);
                  } else {
                      setEmailUser(activePage.email);
                      setEmailDomain('');
                  }
              } else {
                  setEmailUser(activePage.email);
                  setEmailDomain(EMAIL_DOMAINS[0]);
              }
          } else {
              setEmailUser('');
              setEmailDomain(EMAIL_DOMAINS[0]);
          }
      }
  }, [activePage?.pageNumber]);

  const loadBooks = async () => {
    setLoading(true);
    const data = await api.getReceiverBooks();
    // Filter only Received (Submitted) books
    const submittedBooks = data.filter(b => b.status === 'Received');
    setBooks(submittedBooks);
    setLoading(false);
  };

  const loadLocations = async () => {
      const data = await api.getLocations();
      setLocationData(data);
  };

  // --- Statistics Calculation ---
  const totalReceived = books.length; 
  const completedBooks = books.filter(b => b.isDonorUpdated).length;
  const pendingBooks = totalReceived - completedBooks;
  const progressPercentage = totalReceived > 0 ? Math.round((completedBooks / totalReceived) * 100) : 0;

  // --- Filtering Logic for Main Table ---
  const getFilteredBooks = () => {
      let filtered = books.filter(b => 
          b.bookNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (b.assignedToName && b.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      if (activeTab === 'info') {
          // Show all submitted books in Info View so we can see partial progress too, 
          // or strictly fully updated. Requirement usually implies checking data.
          // Let's show all submitted so they can see donors of partially filled books too.
          return filtered; 
      }
      
      return filtered;
  };

  const filteredBooks = getFilteredBooks();
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleBookProcess = async (book: any) => {
    setSelectedBook(book);
    setView('detail');
    const pagesData = await api.getReceiverBookDetails(book.id);
    setPages(pagesData);
    
    const total = pagesData.reduce((sum, p) => sum + (p.amount || 0), 0);
    setCurrentTotalAmount(total);

    // Default to first empty page or first page
    const firstEmpty = pagesData.find(p => !p.isFilled);
    setActivePage(firstEmpty || pagesData[0]);
  };

  const handleBackToList = () => { 
      setView('list'); 
      setSelectedBook(null); 
      loadBooks(); 
  };

  const updateEmail = (user: string, domain: string) => {
      setEmailUser(user);
      setEmailDomain(domain);
      if (activePage) {
          const fullEmail = user ? (domain ? `${user}${domain}` : user) : '';
          setActivePage({...activePage, email: fullEmail});
      }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !activePage) return;
    
    setIsSavingPage(true);
    
    const amountVal = Number(activePage.amount) || 0;
    const fullEmail = emailUser ? (emailDomain ? `${emailUser}${emailDomain}` : emailUser) : '';

    const updatedPage = { 
        ...activePage, 
        isFilled: true, 
        amount: amountVal,
        email: fullEmail
    };

    await api.saveBookPage(selectedBook.id, updatedPage);
    
    const updatedPages = pages.map(p => p.pageNumber === activePage.pageNumber ? updatedPage : p);
    setPages(updatedPages);
    
    const total = updatedPages.reduce((sum, p) => sum + (p.amount || 0), 0);
    setCurrentTotalAmount(total);

    setToastMessage(`Page ${activePage.pageNumber} Saved Successfully`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    setIsSavingPage(false);

    // Auto-advance
    const nextIdx = activePage.pageNumber; 
    if (nextIdx < selectedBook.filledPages) {
        const nextPage = updatedPages.find(p => p.pageNumber === nextIdx + 1);
        if (nextPage) setActivePage(nextPage);
    }
  };

  // --- Dropdown Logic ---
  const getStates = () => Object.keys(locationData);
  const getDistricts = () => activePage?.state ? Object.keys(locationData[activePage.state] || {}) : [];
  const getTowns = () => activePage?.district ? Object.keys(locationData[activePage.state]?.[activePage.district] || {}) : [];

  const handleLocationChange = (field: keyof BookPage, value: string) => {
      if (!activePage) return;
      
      const next = { ...activePage, [field]: value };
      if (field === 'state') { next.district = ''; next.town = ''; }
      if (field === 'district') { next.town = ''; }
      
      setActivePage(next);
  };

  const handleExpandRow = async (bookId: string) => {
      if (expandedBookId === bookId) {
          setExpandedBookId(null);
          setExpandedBookPages([]);
      } else {
          setExpandedBookId(bookId);
          setLoadingExpanded(true);
          setExpandedSearch(''); // Reset inner search
          setExpandedPage(1);    // Reset inner pagination
          const p = await api.getReceiverBookDetails(bookId);
          setExpandedBookPages(p.filter(pg => pg.isFilled));
          setLoadingExpanded(false);
      }
  };

  // --- Expanded View Logic ---
  const getFilteredExpandedPages = () => {
      if (!expandedSearch) return expandedBookPages;
      const q = expandedSearch.toLowerCase();
      return expandedBookPages.filter(p => 
          (p.donorName && p.donorName.toLowerCase().includes(q)) ||
          (p.donorPhone && p.donorPhone.includes(q))
      );
  };

  const filteredExpandedPages = getFilteredExpandedPages();
  const totalExpandedPages = Math.ceil(filteredExpandedPages.length / expandedRowsPerPage);
  const paginatedExpandedPages = filteredExpandedPages.slice(
      (expandedPage - 1) * expandedRowsPerPage, 
      expandedPage * expandedRowsPerPage
  );

  const isAmountValid = selectedBook ? Math.abs(currentTotalAmount - selectedBook.totalAmount) < 1 : false;
  const isCountValid = selectedBook ? pages.filter(p => p.isFilled).length >= selectedBook.filledPages : false;
  const isFullyValid = isAmountValid && isCountValid;

  if (view === 'detail') {
      return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20 relative">
             {/* Toast */}
            {showToast && (
                <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right duration-300">
                <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-3 border border-emerald-200 ring-1 ring-emerald-100">
                    <div className="bg-white p-1.5 rounded-full shadow-sm text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
                    <div><h4 className="font-bold text-sm text-emerald-900">Success</h4><p className="text-xs text-emerald-700">{toastMessage}</p></div>
                </div>
                </div>
            )}

            {/* Top Navigation & Status */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <button onClick={handleBackToList} className="flex items-center text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-lg transition-colors shadow-sm self-start">
                    <ArrowLeft size={18} className="mr-2" /> Back to List
                </button>
                <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-800">{selectedBook?.bookNumber}</h2>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                            {selectedBook?.assignedToName}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Top Cards: Targets vs Actuals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className={`p-5 rounded-xl border shadow-sm flex justify-between items-center ${isCountValid ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                     <div>
                         <p className="text-xs font-bold text-slate-500 uppercase">Donors Filled / Declared</p>
                         <div className="flex items-baseline gap-2 mt-1">
                             <h3 className={`text-2xl font-bold ${isCountValid ? 'text-emerald-700' : 'text-slate-900'}`}>{pages.filter(p => p.isFilled).length}</h3>
                             <span className="text-sm font-medium text-slate-400">/ {selectedBook?.filledPages}</span>
                         </div>
                     </div>
                     <div className={`p-3 rounded-lg ${isCountValid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                         <User size={24} />
                     </div>
                 </div>

                 <div className={`p-5 rounded-xl border shadow-sm flex justify-between items-center ${isAmountValid ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                     <div>
                         <p className="text-xs font-bold text-slate-500 uppercase">Current Total / Expected</p>
                         <div className="flex items-baseline gap-2 mt-1">
                             <h3 className={`text-2xl font-bold ${isAmountValid ? 'text-emerald-700' : 'text-slate-900'}`}>₹{currentTotalAmount.toLocaleString()}</h3>
                             <span className="text-sm font-medium text-slate-400">/ ₹{selectedBook?.totalAmount.toLocaleString()}</span>
                         </div>
                     </div>
                     <div className={`p-3 rounded-lg ${isAmountValid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                         <IndianRupee size={24} />
                     </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Pages Grid (Left Side) */}
                <div className="lg:col-span-3 bg-white p-5 border border-slate-200 rounded-xl shadow-sm h-fit">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><BookOpen size={18}/> Donor Pages</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {pages.map(page => {
                            const isDisabled = page.pageNumber > (selectedBook?.filledPages || 0);
                            return (
                                <button 
                                    key={page.pageNumber} 
                                    disabled={isDisabled}
                                    onClick={() => setActivePage(page)} 
                                    className={`
                                        h-10 rounded-lg text-sm font-bold border transition-all relative
                                        ${activePage?.pageNumber === page.pageNumber 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 z-10' 
                                            : isDisabled 
                                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                : page.isFilled 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    {page.pageNumber}
                                    {page.isFilled && !isDisabled && <div className="absolute top-0 right-0 -mt-1 -mr-1 w-2.5 h-2.5 bg-emerald-50 rounded-full border-2 border-white"></div>}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        {isFullyValid ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                                <CheckCircle className="mx-auto text-emerald-500 mb-2" size={24} />
                                <p className="text-sm font-bold text-emerald-800">Validation Passed</p>
                                <p className="text-xs text-emerald-600 mt-1">Book is automatically marked as completed.</p>
                            </div>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                                <AlertTriangle className="mx-auto text-amber-500 mb-2" size={24} />
                                <p className="text-sm font-bold text-amber-800">Validation Pending</p>
                                <p className="text-xs text-amber-600 mt-1">Amounts & Count must match total declared.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Donor Entry Form (Right Side) */}
                <div className="lg:col-span-9 bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
                    {activePage ? (
                        <>
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        <User size={20} className="text-indigo-500"/> 
                                        Donor Details - Page {activePage.pageNumber}
                                    </h3>
                                    <p className="text-xs text-slate-500 ml-7">Enter details for the donor on this receipt page.</p>
                                </div>
                                {activePage.isFilled && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center"><CheckCircle size={12} className="mr-1"/> Details Saved</span>}
                            </div>

                            <form onSubmit={handleSavePage} className="space-y-6">
                                {/* Row 1: Receipt, Name, Phone */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Receipt Number <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Hash size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                                            <input 
                                                type="text" 
                                                required
                                                value={activePage.receiptNumber || ''} 
                                                onChange={e => setActivePage({...activePage, receiptNumber: e.target.value})} 
                                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                                                placeholder="Recpt #"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Donor Name <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            value={activePage.donorName || ''} 
                                            onChange={e => setActivePage({...activePage, donorName: e.target.value})} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                        <input 
                                            type="tel" 
                                            required
                                            value={activePage.donorPhone || ''} 
                                            onChange={e => setActivePage({...activePage, donorPhone: e.target.value})} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            placeholder="Mobile Number"
                                        />
                                    </div>
                                </div>

                                {/* Row 1.5: ID Proof Section */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">ID Proof Type <span className="text-red-500">*</span></label>
                                        <select 
                                            required
                                            value={activePage.idProofType || ''} 
                                            onChange={e => setActivePage({...activePage, idProofType: e.target.value})} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        >
                                            <option value="">Select ID Type</option>
                                            {ID_PROOF_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">ID Number <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            value={activePage.idProofNumber || ''} 
                                            onChange={e => setActivePage({...activePage, idProofNumber: e.target.value})} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            placeholder="Enter ID Number"
                                            disabled={!activePage.idProofType}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Mail, Gender, Profession */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Mail ID</label>
                                        <div className="flex -space-x-px">
                                            <input 
                                                type="text" 
                                                value={emailUser} 
                                                onChange={e => updateEmail(e.target.value, emailDomain)} 
                                                className="w-full px-3 py-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:z-10 outline-none text-sm min-w-0"
                                                placeholder="username"
                                            />
                                            <select
                                                value={emailDomain}
                                                onChange={e => updateEmail(emailUser, e.target.value)}
                                                className="w-32 px-2 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:z-10 outline-none text-sm bg-slate-50 text-slate-600 border-l-0"
                                            >
                                                <option value="">Other</option>
                                                {EMAIL_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Gender <span className="text-red-500">*</span></label>
                                        <select 
                                            required
                                            value={activePage.gender || ''} 
                                            onChange={e => setActivePage({...activePage, gender: e.target.value as any})} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        >
                                            <option value="">Select Gender</option>
                                            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Profession <span className="text-red-500">*</span></label>
                                        <select 
                                            required
                                            value={activePage.profession || ''} 
                                            onChange={e => setActivePage({...activePage, profession: e.target.value})} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        >
                                            <option value="">Select Profession</option>
                                            {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 3: Payment & Amount */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-5">
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Payment Mode <span className="text-red-500">*</span></label>
                                        <select 
                                            required
                                            value={activePage.paymentMode || 'Offline'} 
                                            onChange={e => setActivePage({...activePage, paymentMode: e.target.value as any})} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        >
                                            <option value="Offline">Offline (Cash)</option>
                                            <option value="Online">Online (UPI/Bank)</option>
                                            <option value="Check">Check / DD</option>
                                        </select>
                                    </div>
                                    
                                    <div className="md:col-span-4">
                                        {activePage.paymentMode === 'Online' && (
                                            <>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Transaction ID <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={activePage.transactionId || ''} 
                                                    onChange={e => setActivePage({...activePage, transactionId: e.target.value})} 
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    placeholder="UPI / Ref No."
                                                />
                                            </>
                                        )}
                                        {activePage.paymentMode === 'Check' && (
                                            <>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Check Number <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={activePage.checkNumber || ''} 
                                                    onChange={e => setActivePage({...activePage, checkNumber: e.target.value})} 
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    placeholder="Check No."
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <IndianRupee size={16} className="absolute left-3 top-2.5 text-slate-500"/>
                                            <input 
                                                type="number" 
                                                required
                                                min="1"
                                                value={activePage.amount || ''} 
                                                onChange={e => setActivePage({...activePage, amount: Number(e.target.value)})} 
                                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-900 placeholder-slate-400"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 4: Address */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><MapPin size={12}/> Address Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                         <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">State <span className="text-red-500">*</span></label>
                                            <select 
                                                required
                                                value={activePage.state || ''} 
                                                onChange={e => handleLocationChange('state', e.target.value)} 
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            >
                                                <option value="">Select State</option>
                                                {getStates().map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                         </div>
                                         <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">District <span className="text-red-500">*</span></label>
                                            <select 
                                                required
                                                value={activePage.district || ''} 
                                                onChange={e => handleLocationChange('district', e.target.value)} 
                                                disabled={!activePage.state}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white disabled:bg-slate-50"
                                            >
                                                <option value="">Select District</option>
                                                {getDistricts().map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                         </div>
                                         <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Town <span className="text-red-500">*</span></label>
                                            <select 
                                                required
                                                value={activePage.town || ''} 
                                                onChange={e => handleLocationChange('town', e.target.value)} 
                                                disabled={!activePage.district}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white disabled:bg-slate-50"
                                            >
                                                <option value="">Select Town</option>
                                                {getTowns().map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                         </div>
                                         <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">Pincode <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                required
                                                value={activePage.pincode || ''} 
                                                onChange={e => setActivePage({...activePage, pincode: e.target.value})} 
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                placeholder="6-digit PIN"
                                                maxLength={6}
                                            />
                                         </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                    <button 
                                        type="submit" 
                                        disabled={isSavingPage}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-indigo-200 transition-all flex items-center"
                                    >
                                        {isSavingPage ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>}
                                        Save Details
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10">
                            <BookOpen size={48} className="mb-4 opacity-20"/>
                            <p className="text-sm">Select a page from the left to enter details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // --- Improved Donor Details Modal ---
  if (viewDonorModal) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewDonorModal(null)}></div>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                   <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white flex justify-between items-start shrink-0">
                       <div className="flex items-center gap-4">
                           <div className="bg-white/20 p-2 rounded-lg">
                               <User size={24} className="text-white"/>
                           </div>
                           <div>
                               <h3 className="text-xl font-bold">Donor Information</h3>
                               <p className="text-indigo-100 text-sm mt-0.5 opacity-90">Review submitted details</p>
                           </div>
                       </div>
                       <button onClick={() => setViewDonorModal(null)} className="text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                           <X size={20} />
                       </button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 max-h-[75vh]">
                        {/* Summary Badge */}
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Receipt Number</p>
                                <span className="font-mono font-bold text-lg text-slate-800 tracking-wide">{viewDonorModal.receiptNumber || 'N/A'}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Donation Amount</p>
                                <span className="font-bold text-2xl text-emerald-600">₹{viewDonorModal.amount?.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Personal & ID Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-2 border-b border-indigo-100 pb-2">
                                <FileBadge size={16}/> Identity & Contact
                            </h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-0.5">Full Name</label>
                                    <p className="text-sm font-bold text-slate-900">{viewDonorModal.donorName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-0.5">Gender</label>
                                    <p className="text-sm font-medium text-slate-800">{viewDonorModal.gender || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-0.5">ID Proof Type</label>
                                    <p className="text-sm font-medium text-slate-800">{viewDonorModal.idProofType || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-0.5">ID Number</label>
                                    <p className="text-sm font-medium text-slate-800 font-mono">{viewDonorModal.idProofNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-0.5">Phone</label>
                                    <p className="text-sm font-medium text-slate-800">{viewDonorModal.donorPhone}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-0.5">Email</label>
                                    <p className="text-sm font-medium text-slate-800 break-all">{viewDonorModal.email || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400 block mb-0.5">Profession</label>
                                    <p className="text-sm font-medium text-slate-800">{viewDonorModal.profession || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-2 border-b border-indigo-100 pb-2">
                                <CreditCard size={16}/> Payment Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-0.5">Payment Mode</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        viewDonorModal.paymentMode === 'Online' ? 'bg-blue-100 text-blue-700' : 
                                        viewDonorModal.paymentMode === 'Check' ? 'bg-amber-100 text-amber-700' : 
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                        {viewDonorModal.paymentMode}
                                    </span>
                                </div>
                                {viewDonorModal.paymentMode === 'Online' && (
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-0.5">Transaction ID</label>
                                        <p className="text-sm font-mono font-medium text-slate-800 bg-slate-50 p-1 px-2 rounded border border-slate-200 inline-block">{viewDonorModal.transactionId}</p>
                                    </div>
                                )}
                                {viewDonorModal.paymentMode === 'Check' && (
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-0.5">Check Number</label>
                                        <p className="text-sm font-mono font-medium text-slate-800 bg-slate-50 p-1 px-2 rounded border border-slate-200 inline-block">{viewDonorModal.checkNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-4">
                             <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-2 border-b border-indigo-100 pb-2">
                                <MapPin size={16}/> Residential Address
                            </h4>
                             <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {viewDonorModal.town}, {viewDonorModal.district}, {viewDonorModal.state}
                                {viewDonorModal.pincode && <span className="font-bold text-slate-900 block mt-1">PIN: {viewDonorModal.pincode}</span>}
                             </p>
                        </div>
                   </div>
                   <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                      <button onClick={() => setViewDonorModal(null)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors">Close Details</button>
                   </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
       
       {/* 1. Header with Context */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Donor Submission</h2>
            <p className="text-slate-500 text-sm mt-1">Update donor details for submitted books.</p>
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

       {/* 2. KPI Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Progress Card */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
               <div>
                  <h2 className="text-lg font-bold text-slate-800">Donor Submit Progress</h2>
                  <p className="text-xs text-slate-500 mt-1">Overall completion status</p>
               </div>
               <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600">{progressPercentage}%</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">{completedBooks} of {totalReceived} Books Completed</p>
               </div>
           </div>

           {/* Total Assigned */}
           <StatCard 
               title="Books Assigned" 
               value={totalReceived} 
               icon={BookOpen} 
               bgClass="bg-indigo-50" 
               colorClass="text-indigo-600"
               subtext="Ready for Entry"
           />

           {/* Pending Submit */}
           <StatCard 
               title="Pending Submit" 
               value={pendingBooks} 
               icon={Clock} 
               bgClass="bg-amber-50" 
               colorClass="text-amber-600"
               subtext="Incomplete Donor Data"
           />
       </div>

       {/* 3. Main Table Section */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="flex border-b bg-slate-50/50">
                <button onClick={() => {setActiveTab('submitted'); setExpandedBookId(null);}} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab==='submitted' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700'}`}>
                    <CheckCircle size={16} /> Submitted Books
                </button>
                <button onClick={() => {setActiveTab('info'); setExpandedBookId(null);}} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab==='info' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700'}`}>
                    <User size={16} /> Donor Info View
                </button>
            </div>
            
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <div className="relative w-full max-w-md">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="text" 
                      placeholder="Search Book # or Recipient..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                   />
               </div>
               <button onClick={loadBooks} className="p-2 text-slate-500 hover:text-indigo-600 border rounded-lg hover:bg-slate-50"><RefreshCw size={18}/></button>
            </div>

            <div className="p-0 flex-1 overflow-auto">
                {loading ? <div className="text-center py-20 text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Loading Books...</div> : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs sticky top-0">
                            <tr>
                                <th className="px-6 py-4">Book Number</th>
                                <th className="px-6 py-4">Recipient Name</th>
                                {activeTab === 'submitted' ? (
                                    <>
                                        <th className="px-6 py-4">Entry Progress</th>
                                        <th className="px-6 py-4 text-center">Donor Status</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4 text-center">Total Donors</th>
                                        <th className="px-6 py-4 text-center">Donor Status</th>
                                    </>
                                )}
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedBooks.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No books found matching criteria.</td></tr>
                            ) : (
                                paginatedBooks.map(book => {
                                    // Status Logic
                                    const declared = book.filledPages || 0;
                                    const entered = book.enteredDonors || 0;
                                    const isComplete = book.isDonorUpdated;
                                    const pct = declared > 0 ? Math.min(100, Math.round((entered / declared) * 100)) : 0;

                                    return (
                                        <React.Fragment key={book.id}>
                                            <tr className={`hover:bg-slate-50 transition-colors ${expandedBookId === book.id ? 'bg-indigo-50/50' : ''}`}>
                                                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{book.bookNumber}</td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{book.assignedToName}</td>
                                                
                                                {activeTab === 'submitted' ? (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-24 overflow-hidden">
                                                                    <div className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${pct}%`}}></div>
                                                                </div>
                                                                <span className="text-xs font-medium text-slate-500">{entered}/{declared}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {isComplete ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Completed</span> : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{entered} Donors</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${isComplete ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                                {isComplete ? 'Fully Updated' : 'Partial'}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}

                                                <td className="px-6 py-4 text-right font-bold text-slate-700">₹{book.totalAmount?.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {activeTab === 'submitted' ? (
                                                        <button 
                                                            onClick={() => handleBookProcess(book)} 
                                                            className={`px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors ${isComplete ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' : 'text-white bg-indigo-600 hover:bg-indigo-700'}`}
                                                        >
                                                            {isComplete ? 'Edit Details' : 'Enter Donors'}
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleExpandRow(book.id)} 
                                                            className={`p-1.5 rounded-full transition-colors ${expandedBookId === book.id ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                        >
                                                            <ChevronDown size={16} className={`transition-transform duration-200 ${expandedBookId === book.id ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {/* Expanded Row for Info View */}
                                            {activeTab === 'info' && expandedBookId === book.id && (
                                                <tr>
                                                    <td colSpan={6} className="px-0 py-0 border-b border-slate-200">
                                                        <div className="bg-slate-50 p-4 shadow-inner">
                                                            {loadingExpanded ? (
                                                                <div className="text-center py-4 text-slate-500"><Loader2 className="animate-spin inline mr-2" size={16}/> Loading donors...</div>
                                                            ) : (
                                                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                                                    {/* Inner Header with Search */}
                                                                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Donors in Book {book.bookNumber}</h4>
                                                                        <div className="relative w-64">
                                                                            <Search className="absolute left-2 top-2 text-slate-400" size={14} />
                                                                            <input 
                                                                                type="text" 
                                                                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                                                                placeholder="Search donor inside book..."
                                                                                value={expandedSearch}
                                                                                onChange={(e) => { setExpandedSearch(e.target.value); setExpandedPage(1); }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Inner Table Header */}
                                                                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                                                                        <div className="col-span-3">Donor Name</div>
                                                                        <div className="col-span-3">Contact</div>
                                                                        <div className="col-span-3">Profession</div>
                                                                        <div className="col-span-2 text-right">Amount</div>
                                                                        <div className="col-span-1 text-center">Action</div>
                                                                    </div>

                                                                    {/* Inner Rows */}
                                                                    {paginatedExpandedPages.length === 0 ? (
                                                                        <div className="text-center py-6 text-slate-400 italic text-sm">No donors found.</div>
                                                                    ) : (
                                                                        paginatedExpandedPages.map((page) => (
                                                                            <div key={page.pageNumber} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors items-center text-sm">
                                                                                
                                                                                {/* Col 1: Name */}
                                                                                <div className="col-span-3">
                                                                                    <p className="font-bold text-slate-800">{page.donorName}</p>
                                                                                    <p className="text-xs text-slate-500 mt-0.5">Recpt: <span className="font-mono">{page.receiptNumber || 'N/A'}</span></p>
                                                                                </div>

                                                                                {/* Col 2: Contact */}
                                                                                <div className="col-span-3">
                                                                                    <div className="flex items-center text-xs text-slate-600 mb-1">
                                                                                        <Phone size={12} className="mr-1.5 text-slate-400" /> {page.donorPhone}
                                                                                    </div>
                                                                                    <div className="flex items-center text-xs text-slate-600" title={page.email}>
                                                                                        <Mail size={12} className="mr-1.5 text-slate-400" /> 
                                                                                        <span className="truncate w-32 block">{page.email || '-'}</span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Col 3: Profession */}
                                                                                <div className="col-span-3">
                                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                                                        {page.profession || 'N/A'}
                                                                                    </span>
                                                                                </div>

                                                                                {/* Col 4: Amount */}
                                                                                <div className="col-span-2 text-right">
                                                                                    <span className="font-bold text-emerald-600">₹{page.amount?.toLocaleString()}</span>
                                                                                </div>

                                                                                {/* Col 5: Action */}
                                                                                <div className="col-span-1 text-center">
                                                                                    <button 
                                                                                        onClick={() => setViewDonorModal(page)}
                                                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                                                        title="View Details"
                                                                                    >
                                                                                        <Eye size={18} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    )}

                                                                    {/* Inner Pagination */}
                                                                    {totalExpandedPages > 1 && (
                                                                        <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-t border-slate-200">
                                                                            <span className="text-xs text-slate-500">Page {expandedPage} of {totalExpandedPages}</span>
                                                                            <div className="flex gap-2">
                                                                                <button 
                                                                                    onClick={() => setExpandedPage(p => Math.max(1, p-1))}
                                                                                    disabled={expandedPage === 1}
                                                                                    className="p-1 bg-white border rounded hover:bg-slate-100 disabled:opacity-50"
                                                                                >
                                                                                    <ChevronLeft size={14}/>
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => setExpandedPage(p => Math.min(totalExpandedPages, p+1))}
                                                                                    disabled={expandedPage === totalExpandedPages}
                                                                                    className="p-1 bg-white border rounded hover:bg-slate-100 disabled:opacity-50"
                                                                                >
                                                                                    <ChevronRight size={14}/>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
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
                )}
            </div>
       </div>
    </div>
  );
};

export default DonorSubmit;
