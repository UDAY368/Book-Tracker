
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { api } from '../services/api';
import AddDistribution from './AddDistribution';
import { 
  FileText, Search, User, X, Upload, Loader2, CheckCircle, 
  Printer, Package, ChevronRight, ChevronDown, ChevronUp, MapPin, Edit,
  Book, Download, AlertTriangle, FileSpreadsheet, RefreshCw,
  Truck, Clock, Filter, Layers, Heart, ArrowUpDown, CreditCard, ChevronLeft
} from 'lucide-react';

// Location Data for Filters (Empty)
const LOCATION_DATA: Record<string, Record<string, string[]>> = {};

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

const DISTRIBUTION_TYPES = ["Individual", "District", "Center", "Autonomous"];

const getCentersForTown = (town: string) => {
    return [];
};

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
  
  // Loading States
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Import Flow States
  const [importStep, setImportStep] = useState<'idle' | 'fileSelected' | 'validating' | 'report'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<ImportRowResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded Row State for Accordion
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  // Filter state for the expanded detailed view
  const [detailFilter, setDetailFilter] = useState<'All' | 'Distributed' | 'Registered' | 'Submitted' | 'Donor Updated'>('All');
  
  // Right Sidebar State for Book Details
  const [selectedBookDetail, setSelectedBookDetail] = useState<any | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Location Filter State
  const [filterLocation, setFilterLocation] = useState({ state: '', district: '', town: '', center: '', type: '' });

  // Data State - Initialized empty, loaded via API
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
        const [distData, batchData] = await Promise.all([
            api.getDistributions(),
            api.getBatches()
        ]);
        
        // Enrich data with mock donor updated counts for the demo
        const enrichedDist = distData.map(d => ({
            ...d,
            donorUpdatedCount: Math.floor((d.submittedCount || 0) * 0.8)
        }));

        setDistributedList(enrichedDist);
        setBatchesList(batchData);
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
        // Simple mock check assuming address string contains state/district
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

  // --- Handlers ---

  const handleToggleExpand = (id: number) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
      setDetailFilter('All'); // Reset filter
    }
  };

  const handleBookGridClick = (e: React.MouseEvent, bookNum: string, status: string, parentItem: any) => {
    e.stopPropagation();
    
    // Determine phases based on status hierarchy
    const isRegistered = status === 'Registered' || status === 'Submitted' || status === 'Donor Updated';
    const isSubmitted = status === 'Submitted' || status === 'Donor Updated';
    const isDonorUpdated = status === 'Donor Updated';

    // Mock dates based on distribution date
    const distDate = new Date(parentItem.date);
    const regDate = new Date(distDate); regDate.setDate(distDate.getDate() + 15);
    const subDate = new Date(regDate); subDate.setDate(regDate.getDate() + 10);
    const updateDate = new Date(subDate); updateDate.setDate(subDate.getDate() + 5);

    setSelectedBookDetail({
        bookNumber: bookNum,
        status: status,
        
        // Distribution Phase
        inchargeName: parentItem.name,
        inchargePhone: parentItem.phone,
        distributionDate: parentItem.date,
        distributionAddress: parentItem.address,

        // Registered Phase
        recipientName: isRegistered ? 'Ravi Kumar' : 'Pending',
        recipientPhone: isRegistered ? '9876543210' : '-',
        registeredDate: isRegistered ? regDate.toISOString().split('T')[0] : '-',
        registeredAddress: isRegistered ? parentItem.address : '-', // Mock same address

        // Submission Phase
        submissionDate: isSubmitted ? subDate.toISOString().split('T')[0] : '-',
        paymentMode: isSubmitted ? 'Online' : '-',
        totalDonors: isSubmitted ? 12 : 0,
        donationAmount: isSubmitted ? 6000 : 0,

        // Donor Update Phase
        donorUpdatedDate: isDonorUpdated ? updateDate.toISOString().split('T')[0] : '-',
        isDonorUpdated: isDonorUpdated
    });
  };

  // Helper to generate book list for the grid based on range
  const generateBookGrid = (item: any) => {
    if (item.bookChips && item.bookChips.length > 0) {
        return item.bookChips.map((num: string) => ({ number: num, status: 'Distributed' })); 
    }

    if (!item.range || !item.range.includes('-')) return [];
    
    const [start, end] = item.range.split('-').map((s: string) => s.trim());
    const prefixMatch = start.match(/^([A-Z]+)/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    const startNumMatch = start.match(/(\d+)$/);
    const startNum = startNumMatch ? parseInt(startNumMatch[0]) : 0;
    
    const books = [];
    for (let i = 0; i < item.count; i++) {
        const currentNum = startNum + i;
        const bookNum = `${prefix}${String(currentNum).padStart(start.length - prefix.length, '0')}`;
        
        let status = 'Distributed';
        if (i < (item.donorUpdatedCount || 0)) {
            status = 'Donor Updated';
        } else if (i < (item.submittedCount || 0)) {
            status = 'Submitted';
        } else if (i < (item.registeredCount || 0)) {
            status = 'Registered';
        }
        
        books.push({ number: bookNum, status });
    }
    return books;
  };

  // Helper to calculate available books
  const getAvailableBooks = (batch: any) => {
    if (batch.remainingBooks !== undefined) return batch.remainingBooks;
    if (batch.status === 'Fully Distributed') return 0;
    if (batch.status === 'In Stock') return batch.totalBooks;
    return Math.floor(batch.totalBooks * 0.6);
  };

  // --- Import / Export Handlers ---

  const downloadTemplate = () => {
    let headers: string[] = [];
    let sampleRow: string[] = [];
    let filename = '';

    if (activeTab === 'distribution') {
        headers = [
            'Distribution Date', 'Incharge Type', 'Full Name', 'Phone', 
            'PSSM ID', 'State', 'District', 'Town / Mandal', 'Center', 
            'Batch Number', 'Book Numbers', 'Book count'
        ];
        sampleRow = [
            '2023-10-30', 'Individual', 'Ravi Kumar', '9876543210', 
            'PSSM-123', 'Telangana', 'Hyderabad', 'Kukatpally', 'Main Center', 
            'HYD-OCT-23', 'B100-B150', '51'
        ];
        filename = 'Distribution_Import_Template.csv';
    } else {
        headers = ['Batch Name', 'Printed Date', 'Total Books', 'Start Serial', 'End Serial'];
        sampleRow = ['HYD-DEC-23', '2023-12-01', '5000', 'D00001', 'D05000'];
        filename = 'Batch_Import_Template.csv';
    }

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImportStep('validating');
        setSelectedFile(file);
        
        // Read and Validate
        const reader = new FileReader();
        reader.onload = (event) => {
            setTimeout(() => {
                const text = event.target?.result as string;
                validateFile(text);
            }, 1000); // Simulate processing delay
        };
        reader.readAsText(file);
    }
  };

  const validateFile = (text: string) => {
    try {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim());
        if (lines.length < 2) throw new Error("File is empty or missing data.");

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        let required: string[] = [];
        
        if (activeTab === 'distribution') {
            required = ['Distribution Date', 'Incharge Type', 'Full Name', 'Phone', 'State', 'Book count'];
        } else {
            required = ['Batch Name', 'Printed Date', 'Total Books', 'Start Serial', 'End Serial'];
        }

        const missing = required.filter(h => !headers.includes(h));
        if (missing.length > 0) {
            throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }

        // Process rows
        const rowsResult: ImportRowResult[] = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
            const getVal = (header: string) => {
                const idx = headers.indexOf(header);
                return idx > -1 ? cols[idx] : '';
            };

            const rowData: any = {};
            let error = '';

            if (activeTab === 'distribution') {
                rowData.date = getVal('Distribution Date');
                rowData.type = getVal('Incharge Type');
                rowData.name = getVal('Full Name');
                rowData.phone = getVal('Phone');
                rowData.pssmId = getVal('PSSM ID');
                rowData.address = `${getVal('Center')}, ${getVal('Town / Mandal')}, ${getVal('District')}, ${getVal('State')}`.replace(/^, |, $/g, '');
                rowData.batchName = getVal('Batch Number');
                rowData.range = getVal('Book Numbers');
                rowData.count = parseInt(getVal('Book count')) || 0;

                if (!rowData.name || !rowData.phone || rowData.count <= 0) error = 'Missing Name, Phone or valid Count';
            } else {
                rowData.batchName = getVal('Batch Name');
                rowData.printedDate = getVal('Printed Date');
                rowData.totalBooks = parseInt(getVal('Total Books')) || 0;
                rowData.startSerial = getVal('Start Serial');
                rowData.endSerial = getVal('End Serial');
                rowData.status = 'In Stock';

                if (!rowData.batchName || rowData.totalBooks <= 0) error = 'Invalid Batch data';
            }

            rowsResult.push({
                id: i,
                data: rowData,
                status: error ? 'error' : 'valid',
                message: error || 'Valid'
            });
        }

        setImportReport(rowsResult);
        setImportStep('report');

    } catch (e: any) {
        setImportReport([{ id: 0, data: {}, status: 'error', message: e.message }]);
        setImportStep('report');
    }
  };

  const finalizeImport = async () => {
    const validRows = importReport.filter(r => r.status === 'valid').map(r => r.data);
    if (validRows.length === 0) return;

    if (activeTab === 'distribution') {
        await api.saveDistributionsBulk(validRows);
    } else {
        await api.saveBatchesBulk(validRows);
    }

    setToastMessage("File upload successful");
    setShowToast(true);
    setImportModalOpen(false);
    resetImport();
    loadData(); // Refresh list
    setTimeout(() => setShowToast(false), 3000);
  };

  const resetImport = () => {
    setImportStep('idle');
    setSelectedFile(null);
    setImportReport([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
    let headers: string[] = [];
    let dataToExport: any[] = [];
    let filename = '';

    if (activeTab === 'distribution') {
        headers = ['Distribution Date', 'Incharge Type', 'Full Name', 'Phone', 'PSSM ID', 'Address', 'Batch Number', 'Book Range', 'Book Count', 'Status'];
        dataToExport = filteredDistributedList.map(item => ({
            'Distribution Date': item.date,
            'Incharge Type': item.type,
            'Full Name': item.name,
            'Phone': item.phone,
            'PSSM ID': item.pssmId || '',
            'Address': item.address,
            'Batch Number': item.batchName || '',
            'Book Range': item.range,
            'Book Count': item.count,
            'Status': 'Distributed' 
        }));
        filename = `Distribution_List_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
        headers = ['Batch Name', 'Printed Date', 'Total Books', 'Start Serial', 'End Serial', 'Status', 'Remaining Books'];
        dataToExport = filteredBatchesList.map(item => ({
            'Batch Name': item.batchName,
            'Printed Date': item.printedDate,
            'Total Books': item.totalBooks,
            'Start Serial': item.startSerial || '',
            'End Serial': item.endSerial || '',
            'Status': item.status,
            'Remaining Books': getAvailableBooks(item)
        }));
        filename = `Batch_List_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = [headers.join(','), ...dataToExport.map(row => 
        headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditDistribution = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setCurrentEditItem(item);
    setCurrentEditType('distribution');
    setEditModalOpen(true);
  };

  const handleEditBatch = (e: React.MouseEvent, batch: any) => {
    e.stopPropagation();
    setCurrentEditItem(batch);
    setCurrentEditType('batch');
    setEditModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-5 duration-500 ease-in-out">
          <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-3 border border-emerald-200 ring-1 ring-emerald-100">
            <div className="bg-white p-1.5 rounded-full shadow-sm text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
            <div><h4 className="font-bold text-sm text-emerald-900">Success</h4><p className="text-xs text-emerald-700">{toastMessage}</p></div>
            <button onClick={() => setShowToast(false)} className="ml-4 text-emerald-400 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-100 rounded-full"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Right Sidebar for Book Details */}
      {selectedBookDetail && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBookDetail(null)}></div>
            <div className="w-[450px] bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
               {/* Header */}
               <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start">
                  <div>
                     <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Book className="text-indigo-400" size={24} />
                        {selectedBookDetail.bookNumber}
                     </h3>
                     <div className="mt-2 flex gap-2 items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            selectedBookDetail.status === 'Donor Updated' ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' :
                            selectedBookDetail.status === 'Submitted' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' :
                            selectedBookDetail.status === 'Registered' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' :
                            'bg-slate-700 text-slate-300 border-slate-600'
                        }`}>
                            {selectedBookDetail.status}
                        </span>
                     </div>
                  </div>
                  <button onClick={() => setSelectedBookDetail(null)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800"><X size={24} /></button>
               </div>
               
               {/* Content - Timeline Style */}
               <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  <div className="space-y-0 relative pb-10">
                      {/* Vertical Line */}
                      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-200"></div>

                      {/* Phase 1: Distribution */}
                      <div className="relative pl-10 pb-8">
                          <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center text-indigo-600 z-10 shadow-sm">
                              <Truck size={16} />
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                              <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex justify-between">
                                  Distribution Phase
                                  <span className="text-xs text-slate-400 font-normal">{formatDate(selectedBookDetail.distributionDate)}</span>
                              </h4>
                              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                                  <div>
                                      <p className="text-slate-400 uppercase font-semibold text-[10px]">Incharge Name</p>
                                      <p className="text-slate-800 font-medium">{selectedBookDetail.inchargeName}</p>
                                  </div>
                                  <div>
                                      <p className="text-slate-400 uppercase font-semibold text-[10px]">Phone Number</p>
                                      <p className="text-slate-800 font-medium">{selectedBookDetail.inchargePhone}</p>
                                  </div>
                                  <div className="col-span-2">
                                      <p className="text-slate-400 uppercase font-semibold text-[10px] mb-1">Location</p>
                                      <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-1">
                                          <MapPin size={12} className="mt-0.5 text-indigo-400 shrink-0" />
                                          {selectedBookDetail.distributionAddress}
                                      </p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Phase 2: Registration */}
                      <div className="relative pl-10 pb-8">
                          <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm ${selectedBookDetail.status !== 'Distributed' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                              <User size={16} />
                          </div>
                          <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative ${selectedBookDetail.status === 'Distributed' ? 'opacity-50 grayscale' : ''}`}>
                              <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex justify-between">
                                  Registered Phase
                                  <span className="text-xs text-slate-400 font-normal">{formatDate(selectedBookDetail.registeredDate)}</span>
                              </h4>
                              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                                  <div>
                                      <p className="text-slate-400 uppercase font-semibold text-[10px]">Recipient Name</p>
                                      <p className="text-slate-800 font-medium">{selectedBookDetail.recipientName}</p>
                                  </div>
                                  <div>
                                      <p className="text-slate-400 uppercase font-semibold text-[10px]">Phone Number</p>
                                      <p className="text-slate-800 font-medium">{selectedBookDetail.recipientPhone}</p>
                                  </div>
                                  <div className="col-span-2">
                                      <p className="text-slate-400 uppercase font-semibold text-[10px] mb-1">Address</p>
                                      <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-1">
                                          <MapPin size={12} className="mt-0.5 text-blue-400 shrink-0" />
                                          {selectedBookDetail.registeredAddress}
                                      </p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Phase 3: Submission */}
                      <div className="relative pl-10 pb-8">
                          <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm ${selectedBookDetail.status === 'Submitted' || selectedBookDetail.status === 'Donor Updated' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                              <CheckCircle size={16} />
                          </div>
                          <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative ${selectedBookDetail.status === 'Submitted' || selectedBookDetail.status === 'Donor Updated' ? '' : 'opacity-50 grayscale'}`}>
                              <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex justify-between">
                                  Submission Phase
                                  <span className="text-xs text-slate-400 font-normal">{formatDate(selectedBookDetail.submissionDate)}</span>
                              </h4>
                              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                                  <div>
                                      <p className="text-slate-400 uppercase font-semibold text-[10px]">Payment Mode</p>
                                      <p className="text-slate-800 font-medium flex items-center gap-1"><CreditCard size={12} /> {selectedBookDetail.paymentMode}</p>
                                  </div>
                                  <div>
                                      <p className="text-slate-400 uppercase font-semibold text-[10px]">Total Donors</p>
                                      <p className="text-slate-800 font-medium">{selectedBookDetail.totalDonors}</p>
                                  </div>
                                  <div className="col-span-2 bg-emerald-50 p-2 rounded border border-emerald-100 flex justify-between items-center">
                                      <span className="text-emerald-700 font-bold uppercase text-[10px]">Donation Amount</span>
                                      <span className="text-emerald-600 font-bold text-sm">₹{selectedBookDetail.donationAmount.toLocaleString()}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Phase 4: Donation Update */}
                      <div className="relative pl-10">
                          <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm ${selectedBookDetail.status === 'Donor Updated' ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-400'}`}>
                              <Heart size={16} />
                          </div>
                          <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative ${selectedBookDetail.status === 'Donor Updated' ? '' : 'opacity-50 grayscale'}`}>
                              <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex justify-between">
                                  Donation Update Phase
                                  <span className="text-xs text-slate-400 font-normal">{formatDate(selectedBookDetail.donorUpdatedDate)}</span>
                              </h4>
                              <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500 font-medium">Donor Update Status</span>
                                  <span className={`px-2 py-1 rounded font-bold ${selectedBookDetail.isDonorUpdated ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                      {selectedBookDetail.isDonorUpdated ? 'Yes' : 'No'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>
               </div>
               <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 text-center"><button onClick={() => setSelectedBookDetail(null)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Close Panel</button></div>
            </div>
         </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h2 className="text-2xl font-bold text-slate-800">Distribution Info</h2><p className="text-slate-500 text-sm mt-1">View distributed books and print batches.</p></div>
        
        {/* Top Layer Filter */}
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

      <div className="border-b border-slate-200 shrink-0">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('distribution')} className={`${activeTab === 'distribution' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}><Package className="mr-2 h-4 w-4" /> Distributed Books</button>
            <button onClick={() => setActiveTab('batches')} className={`${activeTab === 'batches' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}><Printer className="mr-2 h-4 w-4" /> Print Batches</button>
          </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative mt-4">
          
        {/* TAB: Distributed Books */}
        {activeTab === 'distribution' && (
           <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 shrink-0 bg-slate-50">
                    <div className="relative max-w-sm w-full"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow" placeholder="Search recipient, book #..." /></div>
                    <div className="flex gap-2"><button onClick={() => { setImportModalOpen(true); resetImport(); }} className="flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"><Upload size={16} className="mr-2" /> Import</button><button onClick={handleExport} className="flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"><Download size={16} className="mr-2" /> Export</button></div>
                </div>
                
                {/* Advanced Filters */}
                <div className="px-4 py-3 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mr-2 md:col-span-5 mb-1">
                        <Filter size={16} className="text-indigo-500" />
                        Filters:
                        {(filterLocation.state || filterLocation.district || filterLocation.town || filterLocation.type) && (
                             <button 
                                onClick={() => setFilterLocation({ state: '', district: '', town: '', center: '', type: '' })}
                                className="text-xs text-red-600 hover:text-red-800 font-medium ml-auto sm:ml-2 flex items-center"
                             >
                                <RefreshCw size={10} className="mr-1" /> Clear
                             </button>
                        )}
                    </div>
                    
                    <select 
                        value={filterLocation.type}
                        onChange={(e) => setFilterLocation(prev => ({ ...prev, type: e.target.value }))}
                        className="pl-2 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                    >
                        <option value="">All Types</option>
                        {DISTRIBUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <select 
                        value={filterLocation.state} 
                        onChange={(e) => setFilterLocation({ ...filterLocation, state: e.target.value, district: '', town: '', center: '' })}
                        className="pl-2 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                    >
                        <option value="">All States</option>
                        {Object.keys(LOCATION_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select 
                        value={filterLocation.district} 
                        onChange={(e) => setFilterLocation(prev => ({ ...prev, district: e.target.value, town: '', center: '' }))}
                        className="pl-2 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 disabled:opacity-50"
                        disabled={!filterLocation.state}
                    >
                        <option value="">All Districts</option>
                         {filterLocation.state && Object.keys(LOCATION_DATA[filterLocation.state] || {}).map(d => (
                            <option key={d} value={d}>{d}</option>
                         ))}
                    </select>

                    <select 
                        value={filterLocation.town} 
                        onChange={(e) => setFilterLocation(prev => ({ ...prev, town: e.target.value, center: '' }))}
                        className="pl-2 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 disabled:opacity-50"
                        disabled={!filterLocation.district}
                    >
                        <option value="">All Towns</option>
                         {filterLocation.district && (LOCATION_DATA[filterLocation.state]?.[filterLocation.district] || []).map(t => (
                            <option key={t} value={t}>{t}</option>
                         ))}
                    </select>

                    <select 
                        value={filterLocation.center} 
                        onChange={(e) => setFilterLocation(prev => ({ ...prev, center: e.target.value }))}
                        className="pl-2 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 disabled:opacity-50"
                        disabled={!filterLocation.town}
                    >
                        <option value="">All Centers</option>
                         {filterLocation.town && getCentersForTown(filterLocation.town).map(c => (
                            <option key={c} value={c}>{c}</option>
                         ))}
                    </select>
                </div>

                <div className="overflow-auto flex-1">
                    {isDataLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-400"><Loader2 className="animate-spin mr-2" /> Loading Data...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Incharge Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Distribution Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lifecycle Status</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {paginatedDistributedList.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No records found.</td></tr>
                            ) : (
                                paginatedDistributedList.map((item) => {
                                    const isExpanded = expandedRowId === item.id;
                                    const totalDistributed = item.count || 0;
                                    const pendingRegistered = Math.max(0, totalDistributed - (item.registeredCount || 0));
                                    const pendingSubmitted = Math.max(0, totalDistributed - (item.submittedCount || 0));
                                    const donorUpdatedCount = item.donorUpdatedCount || 0;
                                    
                                    const bookList = generateBookGrid(item);
                                    const filteredBookList = detailFilter === 'All' ? bookList : bookList.filter((b: any) => b.status === detailFilter);
                                    
                                    return (
                                    <React.Fragment key={item.id}>
                                        <tr className={`transition-colors border-b border-slate-100 ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`} onClick={() => handleToggleExpand(item.id)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 align-top">{formatDate(item.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap align-top">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{item.name ? item.name.charAt(0) : '?'}</div>
                                                <div className="ml-4"><div className="text-sm font-medium text-slate-900">{item.name}</div><div className="text-sm text-slate-500">{item.phone}</div></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 align-top"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{item.type}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm align-top">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-bold text-slate-900">{item.count ? item.count.toLocaleString() : '0'} Books</span>
                                                <span className="text-xs text-slate-500 font-mono">{item.range}</span>
                                                {item.batchName && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">{item.batchName}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap align-top">
                                            <div className="flex flex-col gap-1.5 w-52">
                                                <div className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded border border-slate-100"><span className="text-slate-600 font-medium">Distributed</span><span className="font-bold text-slate-900">{totalDistributed}</span></div>
                                                <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Registered</span><div className="flex items-center gap-1.5"><span className="font-bold text-blue-600">{item.registeredCount || 0}</span><span className="text-slate-300">|</span><span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${pendingRegistered > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{pendingRegistered}</span></div></div>
                                                <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Submitted</span><div className="flex items-center gap-1.5"><span className="font-bold text-green-600">{item.submittedCount || 0}</span><span className="text-slate-300">|</span><span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${pendingSubmitted > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{pendingSubmitted}</span></div></div>
                                                <div className="flex items-center justify-between text-xs border-t border-dashed border-slate-200 pt-1 mt-1"><span className="text-purple-600 font-medium flex items-center"><Heart size={10} className="mr-1" /> Donor Updated</span><span className="font-bold text-purple-700">{donorUpdatedCount}</span></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={(e) => handleEditDistribution(e, item)} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md"><Edit size={14} className="mr-1.5" /> Edit</button>
                                                <button className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
                                            </div>
                                        </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-slate-50/50 animate-in fade-in duration-200">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center"><Book size={14} className="mr-2" /> Book Lifecycle Details</h4>
                                                            <div className="flex gap-1 bg-slate-100 p-1 rounded-md overflow-x-auto max-w-full">
                                                                {(['All', 'Distributed', 'Registered', 'Submitted', 'Donor Updated'] as const).map(filter => (
                                                                <button key={filter} onClick={(e) => { e.stopPropagation(); setDetailFilter(filter); }} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all whitespace-nowrap ${detailFilter === filter ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{filter}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-60 overflow-y-auto p-1">
                                                            {filteredBookList.map((book: any) => (
                                                                <button 
                                                                    key={book.number} 
                                                                    onClick={(e) => handleBookGridClick(e, book.number, book.status, item)} 
                                                                    className={`
                                                                        flex flex-col items-center justify-center py-2 rounded border text-[10px] font-mono transition-all hover:shadow-md active:scale-95
                                                                        ${book.status === 'Donor Updated' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' :
                                                                          book.status === 'Submitted' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 
                                                                          book.status === 'Registered' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 
                                                                          'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}
                                                                    `} 
                                                                    title={`${book.number} - ${book.status}`}
                                                                >
                                                                    <span className="font-bold">{book.number}</span>
                                                                    <span className="text-[8px] uppercase mt-0.5 opacity-80">{book.status === 'Donor Updated' ? 'Updated' : book.status}</span>
                                                                </button>
                                                            ))}
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
                    )}
                </div>
                
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={endIndex}
                />
            </div>
        )}

        {/* TAB: Print Batches */}
        {activeTab === 'batches' && (
           <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
               <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 shrink-0 bg-slate-50">
                   <div className="relative max-w-sm w-full"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow" placeholder="Search batch name, status..." /></div>
                   <div className="flex gap-2"><button onClick={() => { setImportModalOpen(true); resetImport(); }} className="flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"><Upload size={16} className="mr-2" /> Import</button><button onClick={handleExport} className="flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"><Download size={16} className="mr-2" /> Export</button></div>
               </div>
               <div className="overflow-auto flex-1">
                   <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Printed Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Serial Range</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Books</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Available Books</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                          {filteredBatchesList.map((batch) => (
                             <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{batch.batchName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{batch.printedDate ? new Date(batch.printedDate).toLocaleDateString() : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{batch.startSerial} - {batch.endSerial}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{batch.totalBooks ? batch.totalBooks.toLocaleString() : '0'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-700 font-bold">{getAvailableBooks(batch).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${batch.status === 'Fully Distributed' ? 'bg-green-100 text-green-800' : batch.status === 'Partially Distributed' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>{batch.status}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-end gap-2"><button onClick={(e) => handleEditBatch(e, batch)} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md"><Edit size={14} className="mr-1.5" /> Edit</button></div></td>
                             </tr>
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
                <AddDistribution 
                   role={role}
                   isModal={true}
                   editData={currentEditItem}
                   editType={currentEditType}
                   onClose={() => setEditModalOpen(false)}
                   onSuccess={() => {
                      setEditModalOpen(false);
                      loadData();
                      setToastMessage("Update Successful");
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                   }}
                />
             </div>
          </div>
        )}

        {/* --- IMPORT MODAL --- */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setImportModalOpen(false)}></div>
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Import {activeTab === 'distribution' ? 'Distribution' : 'Batches'}
                    </h3>
                    <p className="text-sm text-slate-500">Bulk upload using CSV template.</p>
                  </div>
                  <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                  
                  {/* Step 1: Download Template */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm"><FileSpreadsheet size={20} /></div>
                          <div className="flex-1">
                              <h4 className="text-sm font-bold text-indigo-900">1. Download Template</h4>
                              <p className="text-xs text-indigo-700 mt-1 mb-3">Use the standard CSV format to avoid errors.</p>
                              <button onClick={downloadTemplate} className="text-xs font-medium bg-white text-indigo-600 px-3 py-1.5 rounded border border-indigo-200 hover:bg-indigo-50 shadow-sm flex items-center w-fit">
                                  <Download size={12} className="mr-1.5" /> Download CSV
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Step 2: Upload */}
                  <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">2. Upload File</h4>
                      
                      <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${importStep === 'fileSelected' || importStep === 'validating' ? 'bg-slate-50 border-slate-300' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                          {importStep === 'validating' ? (
                              <div className="flex flex-col items-center">
                                  <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mb-2" />
                                  <p className="text-sm text-slate-600 font-medium">Validating file structure...</p>
                              </div>
                          ) : importStep === 'report' ? (
                              <div className="flex flex-col items-center">
                                  <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                                      <CheckCircle size={20} />
                                  </div>
                                  <p className="text-sm text-slate-800 font-bold">File Analyzed</p>
                                  <p className="text-xs text-slate-500 mt-1">{importReport.filter(r => r.status === 'valid').length} valid rows ready.</p>
                              </div>
                          ) : (
                              <>
                                  <input 
                                      type="file" 
                                      accept=".csv"
                                      onChange={handleFileSelect}
                                      ref={fileInputRef}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <Upload size={20} />
                                  </div>
                                  <p className="text-sm font-medium text-slate-700">Click to upload CSV</p>
                                  <p className="text-xs text-slate-400 mt-1">Max file size 5MB</p>
                              </>
                          )}
                      </div>

                      {/* Validation Report */}
                      {importReport.some(r => r.status === 'error') && (
                          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-2">
                                  <AlertTriangle size={14} /> Validation Errors Found
                              </div>
                              <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                                  {importReport.filter(r => r.status === 'error').map((err, idx) => (
                                      <div key={idx} className="text-red-600 flex gap-2">
                                          <span className="font-mono bg-white px-1 rounded border border-red-100">Row {err.id}</span>
                                          <span>{err.message}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl shrink-0 flex justify-end gap-3">
                   <button onClick={() => { setImportModalOpen(false); resetImport(); }} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm">Cancel</button>
                   <button 
                      onClick={finalizeImport} 
                      disabled={importStep !== 'report' || importReport.filter(r => r.status === 'valid').length === 0}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                   >
                      <CheckCircle size={16} className="mr-2" /> Process Import
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Distribution;
