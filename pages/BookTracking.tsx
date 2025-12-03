import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, X, 
  Book, Truck, User, CheckCircle, Heart, 
  MapPin, Calendar, Phone, CreditCard, ArrowUpDown, Clock, AlertCircle,
  Loader2, Layers, IndianRupee, Printer
} from 'lucide-react';

// --- Types ---

type TrackingStatus = 'Distributed' | 'Registered' | 'Submitted' | 'Donor Updated';

interface BookLifecycleData {
  id: string;
  bookNumber: string;
  status: TrackingStatus;
  currentHolder: string;
  
  // Phase 1: Distribution
  distributorName: string;
  distributorPhone: string;
  distributionDate: string;
  distributionAddress: string; // Center, Town, District, State

  // Phase 2: Registration
  recipientName?: string;
  recipientPhone?: string;
  registrationDate?: string;
  registrationAddress?: string;

  // Phase 3: Submission
  submissionDate?: string;
  paymentMode?: 'Online' | 'Offline';
  totalDonors?: number;
  donationAmount?: number;

  // Phase 4: Donor Update
  isDonorUpdated: boolean;
  donorUpdateDate?: string;
}

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

// --- Components ---

const StatusBadge = ({ status }: { status: TrackingStatus }) => {
  const styles = {
    'Distributed': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Registered': 'bg-blue-100 text-blue-700 border-blue-200',
    'Submitted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Donor Updated': 'bg-purple-100 text-purple-700 border-purple-200'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>
      {status}
    </span>
  );
};

const TimelineItem = ({ 
  active, 
  completed, 
  icon: Icon, 
  title, 
  date, 
  children,
  isLast = false
}: { 
  active: boolean, 
  completed: boolean, 
  icon: any, 
  title: string, 
  date?: string, 
  children?: React.ReactNode,
  isLast?: boolean
}) => {
  return (
    <div className="relative pl-8 pb-8">
      {!isLast && (
        <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${completed ? 'bg-indigo-200' : 'bg-slate-100'}`} />
      )}
      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${
        completed || active 
          ? 'bg-indigo-50 border-indigo-500 text-indigo-600' 
          : 'bg-slate-50 border-slate-200 text-slate-400'
      }`}>
        <Icon size={14} />
      </div>
      
      <div className={`transition-opacity duration-300 ${!active && !completed ? 'opacity-50 grayscale' : 'opacity-100'}`}>
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          {date && <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{date}</span>}
        </div>
        <div className="text-sm text-slate-600 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          {children || <span className="text-slate-400 italic text-xs">Pending action...</span>}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, count, icon: Icon, color }: { label: string, count: number, icon: any, color: string }) => (
  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 min-w-[140px] flex-1">
    <div className={`p-2 rounded-md ${color} bg-opacity-10 text-opacity-100`}>
      <Icon size={18} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">{count.toLocaleString()}</p>
    </div>
  </div>
);

const BookTracking: React.FC = () => {
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [activeTab, setActiveTab] = useState<TrackingStatus>('Distributed'); 
  const [data, setData] = useState<BookLifecycleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookLifecycleData | null>(null);
  
  // Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAmount, setSortAmount] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    // Simulate API Load (Empty Data)
    setTimeout(() => {
      setData([]);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // --- Counts for Header ---
  const counts = useMemo(() => {
      return {
          Printed: 0,
          Distributed: data.filter(b => b.status === 'Distributed').length,
          Registered: data.filter(b => b.status === 'Registered').length,
          Submitted: data.filter(b => b.status === 'Submitted').length,
          DonorUpdated: data.filter(b => b.status === 'Donor Updated').length
      };
  }, [data]);

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    let filtered = data;

    // 1. Strict Tab Filter
    // Only show books that EXACTLY match the current phase status
    filtered = data.filter(b => b.status === activeTab);

    // 2. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.bookNumber.toLowerCase().includes(q) ||
        b.distributorName.toLowerCase().includes(q) ||
        (b.recipientName && b.recipientName.toLowerCase().includes(q))
      );
    }

    // 3. Sorting (Amount) - Only relevant for Submitted & Donor Updated tabs
    if (activeTab === 'Submitted' || activeTab === 'Donor Updated') {
        filtered = [...filtered].sort((a, b) => {
            const amtA = a.donationAmount || 0;
            const amtB = b.donationAmount || 0;
            return sortAmount === 'desc' ? amtB - amtA : amtA - amtB;
        });
    }

    return filtered;
  }, [data, activeTab, searchQuery, sortAmount]);

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // --- Dynamic Columns Configuration ---
  const columns = useMemo(() => {
    switch (activeTab) {
        case 'Distributed':
            return [
                { header: 'Date', key: 'distributionDate' },
                { header: 'Book Number', key: 'bookNumber' },
                { header: 'Status', key: 'status' },
                { header: 'Incharge', key: 'distributorName' },
                { header: 'Location', key: 'distributionAddress' },
            ];
        case 'Registered':
            return [
                { header: 'Date', key: 'registrationDate' },
                { header: 'Book Number', key: 'bookNumber' },
                { header: 'Status', key: 'status' },
                { header: 'Incharge', key: 'distributorName' }, 
                { header: 'Location', key: 'registrationAddress' },
            ];
        case 'Submitted':
            return [
                { header: 'Date', key: 'submissionDate' },
                { header: 'Book Number', key: 'bookNumber' },
                { header: 'Status', key: 'status' },
                { header: 'Recipient', key: 'recipientName' },
                { header: 'Location', key: 'registrationAddress' },
                { header: 'Amount', key: 'donationAmount', align: 'right' },
            ];
        case 'Donor Updated':
            return [
                { header: 'Date', key: 'donorUpdateDate' },
                { header: 'Book Number', key: 'bookNumber' },
                { header: 'Status', key: 'status' },
                { header: 'Recipient', key: 'recipientName' },
                { header: 'Location', key: 'registrationAddress' },
                { header: 'Amount', key: 'donationAmount', align: 'right' },
            ];
        default:
            return [];
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
      
      {/* Right Side Panel (Overlay) */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBook(null)}></div>
            <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* Panel Header */}
                <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Book size={24} className="text-indigo-400" />
                            <h2 className="text-2xl font-bold tracking-tight">{selectedBook.bookNumber}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">Current Status:</span>
                            <StatusBadge status={selectedBook.status} />
                        </div>
                    </div>
                    <button onClick={() => setSelectedBook(null)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800">
                        <X size={24} />
                    </button>
                </div>

                {/* Panel Content (Timeline) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <div className="max-w-sm mx-auto">
                        
                        {/* 1. Distribution Phase */}
                        <TimelineItem 
                            title="Distribution Phase" 
                            icon={Truck} 
                            active={true} 
                            completed={true}
                            date={selectedBook.distributionDate}
                        >
                            <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <User size={14} className="mt-0.5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Incharge</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedBook.distributorName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Phone size={14} className="mt-0.5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Phone</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedBook.distributorPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                    <MapPin size={14} className="mt-0.5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Location</p>
                                        <p className="text-xs text-slate-700 leading-relaxed">{selectedBook.distributionAddress}</p>
                                    </div>
                                </div>
                            </div>
                        </TimelineItem>

                        {/* 2. Registered Phase */}
                        <TimelineItem 
                            title="Registration Phase" 
                            icon={User} 
                            active={selectedBook.status !== 'Distributed'} 
                            completed={selectedBook.status !== 'Distributed'}
                            date={selectedBook.registrationDate}
                        >
                            {selectedBook.recipientName ? (
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <User size={14} className="mt-0.5 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Recipient</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedBook.recipientName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Phone size={14} className="mt-0.5 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Phone</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedBook.recipientPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                        <MapPin size={14} className="mt-0.5 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Location</p>
                                            <p className="text-xs text-slate-700 leading-relaxed">{selectedBook.registrationAddress}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </TimelineItem>

                        {/* 3. Submission Phase */}
                        <TimelineItem 
                            title="Submission Phase" 
                            icon={CheckCircle} 
                            active={selectedBook.status === 'Submitted' || selectedBook.status === 'Donor Updated'} 
                            completed={selectedBook.status === 'Submitted' || selectedBook.status === 'Donor Updated'}
                            date={selectedBook.submissionDate}
                        >
                            {selectedBook.submissionDate ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Payment</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedBook.paymentMode}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Donors</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedBook.totalDonors}</p>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 p-2 rounded border border-emerald-100 flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-700 uppercase">Donation Amount</span>
                                        <span className="text-lg font-bold text-emerald-600">₹{selectedBook.donationAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : null}
                        </TimelineItem>

                        {/* 4. Donation Update Phase */}
                        <TimelineItem 
                            title="Donor Update Phase" 
                            icon={Heart} 
                            active={selectedBook.status === 'Donor Updated'} 
                            completed={selectedBook.status === 'Donor Updated'}
                            date={selectedBook.donorUpdateDate}
                            isLast={true}
                        >
                            <div className="flex items-center gap-2">
                                {selectedBook.isDonorUpdated ? (
                                    <>
                                        <CheckCircle size={16} className="text-purple-600" />
                                        <span className="text-sm font-medium text-slate-900">Donor Details Digitized</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={16} className="text-amber-500" />
                                        <span className="text-sm font-medium text-slate-500">Pending Update</span>
                                    </>
                                )}
                            </div>
                        </TimelineItem>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-200 bg-white shrink-0 text-center">
                    <button onClick={() => setSelectedBook(null)} className="text-sm font-medium text-slate-600 hover:text-slate-900">Close Panel</button>
                </div>
            </div>
        </div>
      )}

      {/* Page Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Book Tracking</h2>
          <p className="text-slate-500 text-sm">Track individual books throughout their entire lifecycle.</p>
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
        
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full xl:w-auto mb-6">
          <StatCard label="Printed Books" count={counts.Printed} icon={Printer} color="bg-slate-600" />
          <StatCard label="Distributed" count={counts.Distributed} icon={Truck} color="bg-indigo-600" />
          <StatCard label="Registered" count={counts.Registered} icon={User} color="bg-blue-600" />
          <StatCard label="Submitted" count={counts.Submitted} icon={CheckCircle} color="bg-emerald-600" />
          <StatCard label="Donor Updated" count={counts.DonorUpdated} icon={Heart} color="bg-purple-600" />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Tabs / Filters */}
        <div className="border-b border-slate-200 flex flex-col sm:flex-row bg-slate-50/50">
            {['Distributed', 'Registered', 'Submitted', 'Donor Updated'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as TrackingStatus)}
                    className={`flex-1 py-4 px-4 text-sm font-bold border-b-2 transition-colors flex flex-col sm:flex-row items-center justify-center gap-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    {tab} Books
                </button>
            ))}
        </div>

        {/* Controls: Search & Sort */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search Book #, Recipient, Incharge..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            {(activeTab === 'Submitted' || activeTab === 'Donor Updated') && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Sort Amount:</span>
                    <button 
                        onClick={() => setSortAmount(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 text-slate-700"
                    >
                        <CreditCard size={14} className="mr-2 text-emerald-600" />
                        {sortAmount === 'desc' ? 'High to Low' : 'Low to High'}
                        <ArrowUpDown size={12} className="ml-2 text-slate-400" />
                    </button>
                </div>
            )}
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400 h-8 w-8" /></div>
            ) : (
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx} 
                                    className={`px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${col.align === 'right' ? 'text-right' : ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {paginatedData.length === 0 ? (
                            <tr><td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 italic">No books found in this status.</td></tr>
                        ) : (
                            paginatedData.map((book) => (
                                <tr 
                                    key={book.id} 
                                    onClick={() => setSelectedBook(book)}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    {columns.map((col, idx) => {
                                        let content: React.ReactNode = null;
                                        const val = book[col.key as keyof BookLifecycleData];

                                        if (col.key === 'status') {
                                            content = <StatusBadge status={book.status} />;
                                        } else if (col.key === 'bookNumber') {
                                            content = <span className="font-bold text-indigo-600 font-mono group-hover:underline">{String(val)}</span>;
                                        } else if (col.key === 'donationAmount') {
                                            content = <span className="font-bold text-emerald-600">{val ? `₹${val.toLocaleString()}` : '-'}</span>;
                                        } else if (col.key.includes('Date')) {
                                            content = <span className="text-slate-500">{String(val || '-')}</span>;
                                        } else if (col.key.includes('Address')) {
                                            content = (
                                                <div className="flex items-center max-w-xs" title={String(val || '')}>
                                                    <MapPin size={14} className="mr-1 text-slate-300 shrink-0" />
                                                    <span className="truncate text-slate-500">{String(val || '-')}</span>
                                                </div>
                                            );
                                        } else {
                                            content = <span className="text-slate-700">{String(val || '-')}</span>;
                                        }

                                        return (
                                            <td key={idx} className={`px-6 py-4 whitespace-nowrap text-sm ${col.align === 'right' ? 'text-right' : ''}`}>
                                                {content}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t border-slate-200 gap-4 bg-slate-50">
                <div className="text-sm text-slate-600">
                    Showing <span className="font-bold text-slate-900">{Math.min((currentPage - 1) * rowsPerPage + 1, totalItems)}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * rowsPerPage, totalItems)}</span> of <span className="font-bold text-slate-900">{totalItems}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-slate-200 rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let p = i + 1;
                            if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
                            if (p > totalPages) return null;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 rounded text-xs font-medium ${currentPage === p ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                    <button 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-slate-200 rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
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

export default BookTracking;