
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { api } from '../services/api';
import AddDistribution from './AddDistribution';
import { 
  FileText, Search, User, X, Upload, Loader2, CheckCircle, 
  Printer, Package, ChevronRight, ChevronDown, ChevronUp, MapPin, Edit,
  Book, Download, AlertTriangle, FileSpreadsheet, RefreshCw,
  Truck, Clock, Filter, Layers, Heart, ArrowUpDown, CreditCard, ChevronLeft, Phone, Calendar,
  Check, Eye
} from 'lucide-react';

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

const DISTRIBUTION_TYPES = ["Individual", "District", "Center", "Autonomous"];

interface DistributionProps {
  role: UserRole;
}

type Tab = 'distribution' | 'batches';

// Helper type for validation results
interface ImportRowResult {
  id: number;
  data: any;
  status: 'valid' | 'error';
  message: string;
}

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  startIndex, 
  endIndex 
}: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (p: number) => void, 
  totalItems: number, 
  startIndex: number, 
  endIndex: number 
}) => {
  if (totalItems === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t border-slate-200 bg-white gap-4">
      <div className="text-sm text-slate-600">
        Showing <span className="font-bold text-slate-900">{Math.min(startIndex + 1, totalItems)}</span> to <span className="font-bold text-slate-900">{Math.min(endIndex, totalItems)}</span> of <span className="font-bold text-slate-900">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-slate-700 px-2">Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const TimelineNode = ({ 
  title, 
  icon: Icon, 
  isActive, 
  isCompleted, 
  isLast = false,
  children 
}: { 
  title: string, 
  icon: any, 
  isActive: boolean, 
  isCompleted: boolean, 
  isLast?: boolean,
  children?: React.ReactNode 
}) => {
  return (
    <div className={`relative pl-8 pb-8 ${!isLast ? 'border-l-2' : ''} ${isCompleted ? 'border-indigo-200' : 'border-slate-100'}`}>
      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${isCompleted || isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}></div>
      <div className={`${!isActive && !isCompleted ? 'opacity-50 grayscale' : ''}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon size={16} className={isCompleted || isActive ? 'text-indigo-600' : 'text-slate-400'} />
          <h4 className="font-bold text-sm ${isCompleted || isActive ? 'text-slate-800' : 'text-slate-500'}">{title}</h4>
          {isCompleted && <CheckCircle size={14} className="text-emerald-500 ml-auto" />}
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm space-y-2">
            {children || <span className="text-slate-400 text-xs italic">Pending Action...</span>}
        </div>
      </div>
    </div>
  );
};

interface BookChipProps {
  number: string;
  status: string;
  isDonorUpdated: boolean;
  onClick: (e: any) => void;
}

const BookChip: React.FC<BookChipProps> = ({ number, status, isDonorUpdated, onClick }) => {
    let statusColor = "bg-slate-100 border-slate-200 text-slate-600";
    let statusDot = "bg-slate-400";
    
    if (isDonorUpdated) {
        statusColor = "bg-purple-50 border-purple-200 text-purple-700";
        statusDot = "bg-purple-500";
    } else if (status === 'Received') {
        statusColor = "bg-emerald-50 border-emerald-200 text-emerald-700";
        statusDot = "bg-emerald-500";
    } else if (status === 'Registered') {
        statusColor = "bg-blue-50 border-blue-200 text-blue-700";
        statusDot = "bg-blue-500";
    }

    return (
        <button 
            onClick={onClick}
            className={`
                group relative flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-200
                hover:shadow-md hover:scale-[1.02] active:scale-95
                ${statusColor}
            `}
        >
            <span className="font-mono font-bold text-sm tracking-wide">{number}</span>
            <span className={`h-2 w-2 rounded-full ${statusDot} ring-2 ring-white ml-2`}></span>
        </button>
    );
};

const Distribution: React.FC<DistributionProps> = ({ role }) => {
  const navigate = useNavigate();
  const canManageBatches = role === UserRole.SUPER_ADMIN || role === UserRole.BOOK_DISTRIBUTOR;

  const [activeTab, setActiveTab] = useState<Tab>('distribution');
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  // Top Layer Filter
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [currentEditType, setCurrentEditType] = useState<'distribution' | 'batch'>('distribution');
  
  // View Modal State
  const [viewModalData, setViewModalData] = useState<any | null>(null);
  
  // Loading States
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Expanded Row State for Accordion
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [expandedViewFilter, setExpandedViewFilter] = useState<string>('All'); // 'All' | 'Distributed' | 'Registered' | 'Submitted' | 'Donor Updated'
  
  // Right Sidebar State for Book Details
  const [selectedBookDetail, setSelectedBookDetail] = useState<any | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Location Filter State
  const [filterLocation, setFilterLocation] = useState({ state: '', district: '', town: '', center: '', type: '' });
  const [locationData, setLocationData] = useState<any>({});

  // Data State
  const [distributedList, setDistributedList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);

  // Load Data on Mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterLocation]);

  const loadData = async () => {
    setIsDataLoading(true);
    try {
        const [distData, batchData, locData] = await Promise.all([
            api.getDistributions(),
            api.getBatches(),
            api.getLocations()
        ]);
        
        setDistributedList(distData);
        setBatchesList(batchData);
        setLocationData(locData);
    } catch (e) {
        console.error("Failed to load distribution data");
    } finally {
        setIsDataLoading(false);
    }
  };

  // --- Search & Filter Logic ---
  const filteredDistributedList = distributedList.filter(item => {
    // 1. Search Query
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone?.includes(searchQuery) ||
      item.range?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Type Filter
    if (filterLocation.type && item.type !== filterLocation.type) return false;

    // 3. Location Filter
    if (filterLocation.state) {
        if (!item.address) return false;
        if (!item.address.includes(filterLocation.state)) return false;
        if (filterLocation.district && !item.address.includes(filterLocation.district)) return false;
        if (filterLocation.town && !item.address.includes(filterLocation.town)) return false;
        if (filterLocation.center && !item.address.includes(filterLocation.center)) return false;
    }

    return true;
  });

  // Pagination Logic
  const totalItems = filteredDistributedList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDistributedList = filteredDistributedList.slice(startIndex, endIndex);

  const filteredBatchesList = batchesList.filter(batch => 
    batch.batchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleExpand = (id: number) => {
    if (expandedRowId === id) { 
        setExpandedRowId(null); 
    } else { 
        setExpandedRowId(id); 
        setExpandedViewFilter('All'); // Reset inner filter on expand
    }
  };

  const handleBookGridClick = async (e: React.MouseEvent, bookNum: string) => {
    e.stopPropagation();
    const bookData = await api.getBookLifecycle(bookNum);
    if (bookData) {
        setSelectedBookDetail(bookData);
    }
  };

  const generateBookGrid = (item: any) => {
    // If we have detailed book objects (populated by updated API)
    if (item.bookDetails && item.bookDetails.length > 0) {
        return item.bookDetails.filter((book: any) => {
            if (expandedViewFilter === 'All') return true;
            if (expandedViewFilter === 'Distributed') return book.status === 'Distributed';
            if (expandedViewFilter === 'Registered') return book.status === 'Registered';
            if (expandedViewFilter === 'Submitted') return book.status === 'Received';
            if (expandedViewFilter === 'Donor Updated') return book.isDonorUpdated;
            return true;
        });
    }

    // Fallback logic for legacy data or if API didn't return details
    let books: any[] = [];
    if (item.bookChips && item.bookChips.length > 0) {
        books = item.bookChips.map((num: string) => ({ number: num, status: 'Distributed', isDonorUpdated: false })); 
    } else if (item.range && item.range.includes('-')) {
        const [start, end] = item.range.split('-').map((s: string) => s.trim());
        const prefixMatch = start.match(/^([A-Z]+)/);
        const prefix = prefixMatch ? prefixMatch[0] : '';
        const startNumMatch = start.match(/(\d+)$/);
        const startNum = startNumMatch ? parseInt(startNumMatch[0]) : 0;
        for (let i = 0; i < item.count; i++) {
            const currentNum = startNum + i;
            const bookNum = `${prefix}${String(currentNum).padStart(start.length - prefix.length, '0')}`;
            books.push({ number: bookNum, status: 'Distributed', isDonorUpdated: false });
        }
    }

    // Since this is fallback data, filtering is limited unless we know the status.
    // Assuming distributed by default.
    if (expandedViewFilter !== 'All' && expandedViewFilter !== 'Distributed') return [];
    return books;
  };
  
  const handleExport = () => { alert("Export feature pending integration"); };
  const resetImport = () => { setImportModalOpen(false); };

  const handleEditDistribution = (e: React.MouseEvent, item: any) => { e.stopPropagation(); setCurrentEditItem(item); setCurrentEditType('distribution'); setEditModalOpen(true); };
  const handleEditBatch = (e: React.MouseEvent, batch: any) => { e.stopPropagation(); setCurrentEditItem(batch); setCurrentEditType('batch'); setEditModalOpen(true); };
  const handleViewDistribution = (e: React.MouseEvent, item: any) => { e.stopPropagation(); setViewModalData(item); };
  const formatDate = (dateStr: string) => { try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return dateStr; } };

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      {/* Toast */}
      {showToast && <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-5"><div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-lg border border-emerald-200 flex items-center gap-2"><CheckCircle size={18} /><span>{toastMessage}</span></div></div>}

      {/* View Distribution Modal */}
      {viewModalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewModalData(null)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                 <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Incharge Details</h3>
                    <button onClick={() => setViewModalData(null)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm border border-slate-200"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                         <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 shrink-0">
                             <User size={24} />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Incharge Name</label>
                             <p className="text-lg font-bold text-slate-900">{viewModalData.name}</p>
                             <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium border ${viewModalData.type === 'Individual' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                {viewModalData.type}
                             </span>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><CreditCard size={12}/> PSSM ID</label>
                             <p className="text-sm font-medium text-slate-700 mt-1">{viewModalData.pssmId || 'N/A'}</p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Phone size={12}/> Phone</label>
                             <p className="text-sm font-medium text-slate-700 mt-1">{viewModalData.phone}</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Calendar size={12}/> Distribution Date</label>
                         <p className="text-sm font-medium text-slate-700 mt-1">{formatDate(viewModalData.date)}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><MapPin size={12}/> Address</label>
                         <p className="text-sm font-medium text-slate-700 mt-1 leading-relaxed">{viewModalData.address}</p>
                    </div>
                </div>
                 <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setViewModalData(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm text-slate-700">Close</button>
                </div>
            </div>
        </div>
      )}

      {/* Right Sidebar - Book Details Panel */}
      {selectedBookDetail && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBookDetail(null)}></div>
            <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start shadow-md z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Book size={24} className="text-emerald-400" />
                            <h2 className="text-2xl font-bold tracking-tight">{selectedBookDetail.bookNumber}</h2>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs font-medium border border-slate-700">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${selectedBookDetail.status === 'Received' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                            <span className={selectedBookDetail.status === 'Received' ? 'text-emerald-400' : 'text-blue-400'}>
                                {selectedBookDetail.status === 'Received' ? 'Submitted' : selectedBookDetail.status}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setSelectedBookDetail(null)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Timeline Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                    <div className="max-w-sm mx-auto pt-4">
                        
                        {/* 1. Distribution Phase */}
                        <TimelineNode 
                            title="Distribution Phase" 
                            icon={Truck} 
                            isActive={true} 
                            isCompleted={true}
                        >
                            <div className="grid gap-2">
                                <div className="flex items-start gap-2">
                                    <User size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Incharge Name</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedBookDetail.distributorName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Phone size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Phone Number</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedBookDetail.distributorPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Calendar size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Distribution Date</p>
                                        <p className="text-sm font-medium text-slate-900">{formatDate(selectedBookDetail.distributionDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 pt-2 border-t border-slate-200 mt-1">
                                    <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                    <p className="text-xs text-slate-600 leading-relaxed">{selectedBookDetail.distributionLocation}</p>
                                </div>
                            </div>
                        </TimelineNode>

                        {/* 2. Registered Phase */}
                        <TimelineNode 
                            title="Registration Phase" 
                            icon={User} 
                            isActive={selectedBookDetail.status !== 'Distributed'} 
                            isCompleted={selectedBookDetail.status !== 'Distributed'}
                        >
                            {selectedBookDetail.recipientName ? (
                                <div className="grid gap-2">
                                    <div className="flex items-start gap-2">
                                        <User size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Recipient Name</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedBookDetail.recipientName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Phone size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Phone Number</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedBookDetail.recipientPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Calendar size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Registered Date</p>
                                            <p className="text-sm font-medium text-slate-900">{formatDate(selectedBookDetail.registrationDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 pt-2 border-t border-slate-200 mt-1">
                                        <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                        <p className="text-xs text-slate-600 leading-relaxed">{selectedBookDetail.registrationAddress}</p>
                                    </div>
                                </div>
                            ) : null}
                        </TimelineNode>

                        {/* 3. Submission Phase */}
                        <TimelineNode 
                            title="Submission Phase" 
                            icon={CheckCircle} 
                            isActive={selectedBookDetail.status === 'Received'} 
                            isCompleted={selectedBookDetail.status === 'Received'}
                        >
                             {selectedBookDetail.receivedDate ? (
                                <div className="grid gap-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Date</p>
                                            <p className="text-sm font-medium text-slate-900">{formatDate(selectedBookDetail.receivedDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Payment</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedBookDetail.paymentMode || 'Offline'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Total Donors</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedBookDetail.filledPages || 0}</p>
                                        </div>
                                         <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Amount</p>
                                            <p className="text-sm font-bold text-emerald-600">₹{selectedBookDetail.totalAmount?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                             ) : null}
                        </TimelineNode>

                         {/* 4. Donor Update Phase */}
                        <TimelineNode 
                            title="Donation Update Phase" 
                            icon={Heart} 
                            isActive={selectedBookDetail.isDonorUpdated} 
                            isCompleted={selectedBookDetail.isDonorUpdated}
                            isLast={true}
                        >
                            {selectedBookDetail.isDonorUpdated ? (
                                <div className="grid gap-2">
                                    <div className="flex items-start gap-2">
                                        <Calendar size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Donor Updated Date</p>
                                            <p className="text-sm font-medium text-slate-900">{formatDate(selectedBookDetail.donorUpdateDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                         <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                                         <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">Yes, Updated</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">Pending</span>
                                </div>
                            )}
                        </TimelineNode>

                    </div>
                </div>
            </div>
         </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h2 className="text-2xl font-bold text-slate-800">Distribution Info</h2><p className="text-slate-500 text-sm mt-1">View distributed books and print batches.</p></div>
        <div className="w-full md:w-auto bg-indigo-50 p-2 rounded-lg border border-indigo-100"><label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1 ml-1">Event Context</label><div className="relative"><select value={selectedYagam} onChange={(e) => setSelectedYagam(e.target.value)} className="w-full md:w-64 appearance-none bg-white border border-indigo-200 text-indigo-700 font-bold py-2 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm">{YAGAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div></div>
      </div>

      <div className="border-b border-slate-200 shrink-0"><nav className="-mb-px flex space-x-8"><button onClick={() => setActiveTab('distribution')} className={`${activeTab === 'distribution' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'} py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>Distributed Books</button><button onClick={() => setActiveTab('batches')} className={`${activeTab === 'batches' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'} py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>Print Batches</button></nav></div>

      <div className="flex-1 relative mt-4">
        {activeTab === 'distribution' && (
           <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                
                {/* Search Bar & Action Buttons - Clean Layout */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 shrink-0 bg-white">
                    <div className="relative max-w-sm w-full"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="Search..." /></div>
                    <div className="flex gap-2"><button onClick={() => { setImportModalOpen(true); resetImport(); }} className="px-3 py-2 border rounded text-sm bg-white hover:bg-slate-50">Import</button><button onClick={handleExport} className="px-3 py-2 border rounded text-sm bg-white hover:bg-slate-50">Export</button></div>
                </div>
                
                <div className="px-4 py-3 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mr-2 md:col-span-5 mb-1"><Filter size={16} /> Filters: <button onClick={() => setFilterLocation({ state: '', district: '', town: '', center: '', type: '' })} className="text-xs text-red-600 ml-auto">Clear</button></div>
                    
                    <select value={filterLocation.type} onChange={(e) => setFilterLocation(prev => ({ ...prev, type: e.target.value }))} className="pl-2 pr-8 py-1.5 text-sm border rounded bg-slate-50"><option value="">All Types</option>{DISTRIBUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>

                    <select value={filterLocation.state} onChange={(e) => setFilterLocation({ ...filterLocation, state: e.target.value, district: '', town: '', center: '' })} className="pl-2 pr-8 py-1.5 text-sm border rounded bg-slate-50"><option value="">All States</option>{Object.keys(locationData).map(s => <option key={s} value={s}>{s}</option>)}</select>

                    <select value={filterLocation.district} onChange={(e) => setFilterLocation(prev => ({ ...prev, district: e.target.value, town: '', center: '' }))} className="pl-2 pr-8 py-1.5 text-sm border rounded bg-slate-50" disabled={!filterLocation.state}><option value="">All Districts</option>{filterLocation.state && Object.keys(locationData[filterLocation.state] || {}).map(d => <option key={d} value={d}>{d}</option>)}</select>

                    <select value={filterLocation.town} onChange={(e) => setFilterLocation(prev => ({ ...prev, town: e.target.value, center: '' }))} className="pl-2 pr-8 py-1.5 text-sm border rounded bg-slate-50" disabled={!filterLocation.district}><option value="">All Towns</option>{filterLocation.district && (Object.keys(locationData[filterLocation.state]?.[filterLocation.district] || {})).map(t => <option key={t} value={t}>{t}</option>)}</select>

                    <select value={filterLocation.center} onChange={(e) => setFilterLocation(prev => ({ ...prev, center: e.target.value }))} className="pl-2 pr-8 py-1.5 text-sm border rounded bg-slate-50" disabled={!filterLocation.town}><option value="">All Centers</option>{filterLocation.town && (locationData[filterLocation.state]?.[filterLocation.district]?.[filterLocation.town] || []).map((c: string) => <option key={c} value={c}>{c}</option>)}</select>
                </div>

                <div className="overflow-auto flex-1">
                    {isDataLoading ? <div className="p-10 text-center">Loading...</div> : (
                        <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10">
                            <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Incharge Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Books</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {paginatedDistributedList.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No records found for current filters.</td></tr>
                            ) : paginatedDistributedList.map((item) => (
                                <React.Fragment key={item.id}>
                                    <tr className={`hover:bg-slate-50 transition-colors ${expandedRowId === item.id ? 'bg-indigo-50/30' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{formatDate(item.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.type === 'Individual' ? 'bg-blue-50 text-blue-700 border-blue-200' : item.type === 'District' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                            {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{item.count}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={(e) => handleViewDistribution(e, item)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleEditDistribution(e, item)}
                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleExpand(item.id)}
                                                    className={`p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-all ${expandedRowId === item.id ? 'bg-slate-100 rotate-180' : ''}`}
                                                    title="Expand"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRowId === item.id && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-6 bg-slate-50 shadow-inner">
                                                <div className="flex flex-col gap-4">
                                                    
                                                    {/* Inner Filter Tabs */}
                                                    <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-200">
                                                        <span className="text-xs font-bold text-slate-500 uppercase mr-2">Filter Books:</span>
                                                        {['All', 'Distributed', 'Registered', 'Submitted', 'Donor Updated'].map(filter => (
                                                            <button
                                                                key={filter}
                                                                onClick={() => setExpandedViewFilter(filter)}
                                                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                                                                    expandedViewFilter === filter 
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300'
                                                                }`}
                                                            >
                                                                {filter}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Book Grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
                                                        {generateBookGrid(item).length === 0 ? (
                                                            <div className="col-span-full py-8 text-center text-slate-400 italic text-sm">
                                                                No books found with status "{expandedViewFilter}".
                                                            </div>
                                                        ) : (
                                                            generateBookGrid(item).map((book: any) => (
                                                                <BookChip 
                                                                    key={book.number} 
                                                                    number={book.number}
                                                                    status={book.status}
                                                                    isDonorUpdated={book.isDonorUpdated}
                                                                    onClick={(e) => handleBookGridClick(e, book.number)}
                                                                />
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        </table>
                    )}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
            </div>
        )}

        {/* TAB: Batches */}
        {activeTab === 'batches' && (
           <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
               <div className="p-4 border-b border-slate-200 flex justify-between"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border p-2 rounded" placeholder="Search..." /><button onClick={handleExport} className="border p-2 rounded">Export</button></div>
               <div className="overflow-auto flex-1">
                   <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 sticky top-0 z-10"><tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Batch Name</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th><th className="px-6 py-3"></th></tr></thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                          {filteredBatchesList.map((batch) => (
                             <tr key={batch.id} className="hover:bg-slate-50"><td className="px-6 py-4 text-sm font-medium">{batch.batchName}</td><td className="px-6 py-4 text-sm text-slate-500">{new Date(batch.printedDate).toLocaleDateString()}</td><td className="px-6 py-4 text-sm">{batch.totalBooks}</td><td className="px-6 py-4 text-sm">{batch.status}</td><td className="px-6 py-4 text-right"><button onClick={(e) => handleEditBatch(e, batch)} className="text-indigo-600"><Edit size={14} /></button></td></tr>
                          ))}
                      </tbody>
                   </table>
               </div>
           </div>
        )}

        {/* --- EDIT MODAL --- */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditModalOpen(false)}></div>
             <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl flex flex-col">
                <AddDistribution role={role} isModal={true} editData={currentEditItem} editType={currentEditType} onClose={() => setEditModalOpen(false)} onSuccess={() => { setEditModalOpen(false); loadData(); setShowToast(true); setToastMessage("Update Successful"); setTimeout(() => setShowToast(false), 3000); }} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Distribution;
