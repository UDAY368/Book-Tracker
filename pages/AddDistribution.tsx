
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { api } from '../services/api';
import { 
  Plus, User, X, CheckCircle, 
  Package, AlertTriangle, ChevronDown, ArrowUpDown, 
  Search, Filter, Eye, Edit, ChevronLeft, ChevronRight, Book,
  Truck, Archive, Building2, MapPin, Phone, BookOpen, FileText, Heart, Clock, CreditCard, RotateCcw
} from 'lucide-react';

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

const DISTRIBUTION_TYPES = ["Individual", "District", "Center", "Autonomous"];

interface AddDistributionProps {
  role: UserRole;
  isModal?: boolean;
  editData?: any;
  editType?: 'distribution';
  onClose?: () => void;
  onSuccess?: () => void;
}

type Tab = 'new_distribution' | 'distributed_books';

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
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-slate-700 px-2">Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight size={16} />
        </button>
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
    // Logic for color based on strict status
    let styles = "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300";
    let iconColor = "text-slate-400";
    
    if (isDonorUpdated) {
        // Updated
        styles = "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300";
        iconColor = "text-purple-500";
    } else if (status === 'Received') {
        // Submitted
        styles = "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300";
        iconColor = "text-emerald-500";
    } else if (status === 'Registered') {
        // Registered
        styles = "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300";
        iconColor = "text-blue-500";
    }

    return (
        <button 
            onClick={onClick}
            className={`
                group flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200
                shadow-sm hover:shadow-md font-mono font-bold text-sm w-full
                ${styles}
            `}
        >
            <BookOpen size={16} className={iconColor} />
            {number}
        </button>
    );
};

// --- Timeline Components ---
const TimelineItem = ({ 
  icon: Icon, 
  title, 
  date, 
  children,
  isLast = false,
  statusColor = "slate" // slate, indigo, blue, emerald, purple
}: { 
  icon: any, 
  title: string, 
  date?: string, 
  children?: React.ReactNode,
  isLast?: boolean,
  statusColor?: string
}) => {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-500 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const activeClass = colorMap[statusColor] || colorMap['slate'];

  return (
    <div className="relative pl-8 pb-8">
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />
      )}
      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-white ${activeClass.split(' ')[2]}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${activeClass.split(' ')[1]}`}>
           <Icon size={14} />
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className={`text-sm font-bold uppercase tracking-wide ${activeClass.split(' ')[1]}`}>{title}</h4>
          {date && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{new Date(date).toLocaleDateString()}</span>}
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
          {children || <span className="text-slate-400 italic text-xs">Pending action...</span>}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, icon: Icon }: { label: string, value: string | undefined, icon?: any }) => (
    <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 flex items-center gap-1">
            {Icon && <Icon size={10} />} {label}
        </span>
        <span className="text-sm font-semibold text-slate-800 break-words">{value || '-'}</span>
    </div>
);

const SearchableSelect = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder,
  disabled = false,
  className
}: { label: string, value: string, options: string[], onChange: (val: string) => void, placeholder: string, disabled?: boolean, className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
      setFilter(value);
  }, [value]);

  const safeOptions = Array.isArray(options) ? options : [];
  const filteredOptions = safeOptions.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className={`relative ${className}`}>
      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">{label}</label>
      <div className="relative">
          <input
              type="text"
              value={filter} 
              onClick={() => !disabled && setIsOpen(!isOpen)}
              onChange={(e) => {
                  setFilter(e.target.value);
                  if(e.target.value === '') onChange(''); // Clear value on empty input
                  setIsOpen(true);
              }}
              disabled={disabled}
              className={`block w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all text-slate-700 font-medium ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
              placeholder={placeholder}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              autoComplete="off"
          />
          {!disabled && (
              <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
          )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-56 rounded-lg py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none custom-scrollbar border border-slate-100 animate-in fade-in zoom-in-95 duration-100">
              {filteredOptions.map((opt) => (
                  <li 
                      key={opt}
                      className="cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-indigo-50 text-slate-900 transition-colors font-medium border-b border-slate-50 last:border-0"
                      onMouseDown={(e) => {
                          e.preventDefault(); 
                          onChange(opt);
                          setFilter(opt);
                          setIsOpen(false);
                      }}
                  >
                      {opt}
                  </li>
              ))}
          </ul>
      )}
    </div>
  );
};

const AddDistribution: React.FC<AddDistributionProps> = ({ 
  role, 
  isModal = false, 
  editData = null, 
  editType, 
  onClose, 
  onSuccess 
}) => {
  const locationState = useLocation().state as any;
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<Tab>('new_distribution');
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any>({});
  
  const [selectedBatchAvailable, setSelectedBatchAvailable] = useState<number | null>(null);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Form States ---
  const [location, setLocation] = useState({ state: '', district: '', town: '' });
  const [bookChips, setBookChips] = useState<string[]>([]);
  const [tempSerial, setTempSerial] = useState({ start: '', end: '', single: '' });

  const initialFormData = {
    date: new Date().toISOString().split('T')[0],
    recipientType: 'Individual',
    recipientName: '',
    entityName: '',
    phone: '',
    pssmId: '',
    address: '',
    batchNumber: '',
    startSerial: '',
    endSerial: '',
    numberOfBooks: '',
    pincode: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editingDistributionId, setEditingDistributionId] = useState<number | null>(null);

  // --- Table View States ---
  const [distributedList, setDistributedList] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState({ state: '', district: '', town: '', center: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [expandedViewFilter, setExpandedViewFilter] = useState<string>('All');
  
  // Modals / Panels
  const [viewModalData, setViewModalData] = useState<any | null>(null);
  const [selectedBookForPanel, setSelectedBookForPanel] = useState<any | null>(null);
  const [isPanelLoading, setIsPanelLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterLocation]);

  const loadData = async () => {
    setIsDataLoading(true);
    try {
        const [batchData, locData, distData] = await Promise.all([
             api.getBatches(),
             api.getLocations(),
             api.getDistributions()
        ]);
        setBatchesList(batchData);
        setLocationData(locData);
        setDistributedList(distData);
    } catch (e) {
        console.error("Failed to load data");
    } finally {
        setIsDataLoading(false);
    }
  };

   useEffect(() => {
    if (isModal && editData) {
        if (editType === 'distribution') {
            handleEditDistribution(editData);
        }
    }
  }, [locationState, isModal, editData, editType, batchesList]); 

  const getAvailableBooks = (batch: any) => {
    if (batch.remainingBooks !== undefined) return batch.remainingBooks;
    if (batch.status === 'Fully Distributed') return 0;
    if (batch.status === 'In Stock') return batch.totalBooks;
    return Math.floor(batch.totalBooks * 0.6); // Fallback mock
  };
  
  const generateBookGrid = (item: any) => {
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

    if (item.bookChips && item.bookChips.length > 0) {
        return item.bookChips.map((num: string) => ({ number: num, status: 'Distributed', isDonorUpdated: false })); 
    }
    // Legacy fallback
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
        books.push({ number: bookNum, status: 'Distributed', isDonorUpdated: false });
    }
    
    if (expandedViewFilter !== 'All' && expandedViewFilter !== 'Distributed') return [];
    return books;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null); 

    if (name === 'batchNumber') {
      const selectedBatch = batchesList.find(b => b.batchName === value);
      if (selectedBatch) {
        const avail = getAvailableBooks(selectedBatch);
        setSelectedBatchAvailable(avail);
        setSelectedBatchDetails(selectedBatch);
      } else {
        setSelectedBatchAvailable(null);
        setSelectedBatchDetails(null);
      }
    }
  };

  const handleAddBookRange = () => {
    if (!tempSerial.start || !tempSerial.end) return;
    
    const prefixMatch = tempSerial.start.match(/^([A-Z]+)/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    const startNum = parseInt(tempSerial.start.replace(/^\D+/g, ''));
    const endNum = parseInt(tempSerial.end.replace(/^\D+/g, ''));

    if (isNaN(startNum) || isNaN(endNum) || endNum < startNum) {
        alert("Invalid serial range");
        return;
    }

    const newBooks = [];
    for (let i = startNum; i <= endNum; i++) {
        newBooks.push(`${prefix}${i}`);
    }

    setBookChips(prev => [...new Set([...prev, ...newBooks])]); 
    setTempSerial({ ...tempSerial, start: '', end: '' });
  };

  const handleAddSingleBook = () => {
    if (!tempSerial.single) return;
    setBookChips(prev => [...new Set([...prev, tempSerial.single])]);
    setTempSerial({ ...tempSerial, single: '' });
  };

  const handleRemoveBook = (bookToRemove: string) => {
    setBookChips(prev => prev.filter(b => b !== bookToRemove));
  };

  const handleEditDistribution = (item: any) => {
    setEditingDistributionId(item.id);
    setActiveTab('new_distribution');
    
    const addrParts = (item.address || '').split(',').map((s: string) => s.trim());
    let town = '', district = '', state = '';
    
    // Attempt to extract details, including handling pincode in address if necessary
    let lastPart = addrParts[addrParts.length - 1] || '';
    let extractedPincode = '';
    
    if (lastPart.includes(' - ')) {
        const parts = lastPart.split(' - ');
        state = parts[0].trim();
        extractedPincode = parts[1].trim();
    } else {
        state = lastPart;
    }

    if (addrParts.length >= 3) {
        town = addrParts[addrParts.length - 3] || ''; 
        district = addrParts[addrParts.length - 2] || ''; 
    } else {
        town = addrParts[0] || ''; district = addrParts[1] || ''; 
    }

    setLocation({ state, district, town });
    setBookChips(item.bookChips || []); 
    
    if ((!item.bookChips || item.bookChips.length === 0) && item.range) {
         const generated = generateBookGrid(item).map((b: any) => b.number);
         setBookChips(generated);
    }

    setFormData({
      date: item.date,
      recipientType: item.type,
      recipientName: item.name,
      entityName: item.entityName || '',
      phone: item.phone,
      pssmId: item.pssmId || '', 
      address: item.address || '',
      batchNumber: item.batchName || '',
      startSerial: '',
      endSerial: '',
      numberOfBooks: item.count.toString(),
      pincode: item.pincode || extractedPincode || ''
    });
    setFormError(null);
    if (item.batchName) {
       const batch = batchesList.find(b => b.batchName === item.batchName);
       if (batch) {
           setSelectedBatchAvailable(getAvailableBooks(batch));
           setSelectedBatchDetails(batch);
       }
    }
  };

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    const countToDistribute = bookChips.length;
    if (countToDistribute === 0) {
        setFormError("Please assign at least one book.");
        return;
    }

    if (!editingDistributionId && formData.batchNumber && selectedBatchAvailable !== null) {
        if (selectedBatchAvailable === 0 || countToDistribute > selectedBatchAvailable) {
            setFormError(`Insufficient books in batch (Available: ${selectedBatchAvailable})`);
            return;
        }
    }

    const finalAddress = `${location.town}, ${location.district}, ${location.state}${formData.pincode ? ' - ' + formData.pincode : ''}`;
    const sortedChips = [...bookChips].sort();
    const rangeString = sortedChips.length > 0 
        ? (sortedChips.length > 1 ? `${sortedChips[0]} - ${sortedChips[sortedChips.length-1]}` : sortedChips[0])
        : '-';

    const distributionPayload = {
        id: editingDistributionId, 
        date: formData.date,
        name: formData.recipientName,
        entityName: formData.entityName,
        phone: formData.phone,
        type: formData.recipientType,
        range: rangeString,
        count: countToDistribute,
        status: 'Distributed',
        batchName: formData.batchNumber,
        pssmId: formData.pssmId,
        address: finalAddress,
        pincode: formData.pincode,
        bookChips: bookChips,
        registeredCount: 0,
        submittedCount: 0
    };
    
    if (!editingDistributionId && formData.batchNumber) {
        const batchIndex = batchesList.findIndex(b => b.batchName === formData.batchNumber);
        if (batchIndex !== -1) {
            const batchToUpdate = { ...batchesList[batchIndex] };
            let currentRemaining = batchToUpdate.remainingBooks !== undefined ? batchToUpdate.remainingBooks : batchToUpdate.totalBooks;
            currentRemaining -= countToDistribute;
            if (currentRemaining < 0) currentRemaining = 0;
            batchToUpdate.remainingBooks = currentRemaining;
            if (currentRemaining === 0) batchToUpdate.status = 'Fully Distributed';
            else if (currentRemaining < batchToUpdate.totalBooks) batchToUpdate.status = 'Partially Distributed';
            await api.saveBatch(batchToUpdate);
        }
    }

    await api.saveDistribution(distributionPayload);
    await loadData(); 
    
    if (isModal && onSuccess) { onSuccess(); return; }

    setToastMessage(editingDistributionId ? "Distribution Updated!" : "Distribution Added Successfully!");
    setShowToast(true);
    
    if (!editingDistributionId) {
       setFormData(initialFormData);
       setBookChips([]);
       setLocation({ state: '', district: '', town: '' });
       setSelectedBatchAvailable(null);
       setSelectedBatchDetails(null);
    } else {
        setEditingDistributionId(null);
    }

    setTimeout(() => {
        setShowToast(false);
        setActiveTab('distributed_books');
    }, 1200);
  };

  const handleCancel = () => {
    if (isModal && onClose) { onClose(); return; }
    if (editingDistributionId) {
        setEditingDistributionId(null);
        setFormData(initialFormData);
        setBookChips([]);
        setLocation({ state: '', district: '', town: '' });
        setSelectedBatchAvailable(null);
        setSelectedBatchDetails(null);
    }
  };

  const handleBookClick = async (bookNumber: string) => {
      setIsPanelLoading(true);
      // Create a temporary object to show modal immediately
      setSelectedBookForPanel({ bookNumber, status: 'Loading...' }); 
      try {
          const details = await api.getBookLifecycle(bookNumber);
          setSelectedBookForPanel(details || { bookNumber, status: 'Unknown', isDonorUpdated: false });
      } catch (err) {
          console.error(err);
      } finally {
          setIsPanelLoading(false);
      }
  };

  const filteredDistributedList = distributedList.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone?.includes(searchQuery) ||
      item.range?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.entityName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterLocation.type && item.type !== filterLocation.type) return false;

    if (filterLocation.state) {
        if (!item.address) return false;
        if (!item.address.includes(filterLocation.state)) return false;
        if (filterLocation.district && !item.address.includes(filterLocation.district)) return false;
        if (filterLocation.town && !item.address.includes(filterLocation.town)) return false;
        if (filterLocation.center && !item.address.includes(filterLocation.center)) return false;
    }

    return true;
  });

  const totalItems = filteredDistributedList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDistributedList = filteredDistributedList.slice(startIndex, endIndex);

  const handleToggleExpand = (id: number) => {
    if (expandedRowId === id) { 
        setExpandedRowId(null); 
    } else { 
        setExpandedRowId(id); 
        setExpandedViewFilter('All');
    }
  };

  const handleViewDistribution = (e: React.MouseEvent, item: any) => { e.stopPropagation(); setViewModalData(item); };
  const formatDate = (dateStr: string) => { try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return dateStr; } };

  return (
    <div className={`space-y-6 relative h-full flex flex-col ${isModal ? '' : ''} pb-10`}>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-5 duration-500 ease-in-out">
          <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-lg border border-emerald-200 flex items-center gap-2">
            <CheckCircle size={18} /><span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* --- RIGHT SIDE PANEL: BOOK LIFECYCLE --- */}
      {selectedBookForPanel && (
          <div className="fixed inset-0 z-[70] flex justify-end">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBookForPanel(null)}></div>
              <div className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
                  
                  {/* Panel Header */}
                  <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-3 mb-2">
                              <BookOpen size={24} className="text-emerald-400" />
                              <h2 className="text-2xl font-bold tracking-tight font-mono">{selectedBookForPanel.bookNumber}</h2>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Status:</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  selectedBookForPanel.isDonorUpdated ? 'bg-purple-500 text-white' :
                                  selectedBookForPanel.status === 'Received' ? 'bg-emerald-500 text-white' :
                                  selectedBookForPanel.status === 'Registered' ? 'bg-blue-500 text-white' :
                                  'bg-slate-500 text-white'
                              }`}>
                                  {selectedBookForPanel.isDonorUpdated ? 'Donor Updated' : selectedBookForPanel.status}
                              </span>
                          </div>
                      </div>
                      <button onClick={() => setSelectedBookForPanel(null)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Panel Content (Timeline) */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                      {isPanelLoading ? (
                          <div className="flex items-center justify-center h-40 text-slate-400 gap-2">
                              <ArrowUpDown className="animate-spin" /> Loading...
                          </div>
                      ) : (
                          <div className="max-w-sm mx-auto space-y-2">
                              {/* 1. Distribution Phase */}
                              <TimelineItem 
                                  title="Distribution Phase" 
                                  icon={Truck} 
                                  date={selectedBookForPanel.distributionDate}
                                  statusColor="indigo"
                              >
                                  <div className="grid grid-cols-2 gap-3">
                                      <DetailRow label="Incharge Name" value={selectedBookForPanel.distributorName} icon={User} />
                                      <DetailRow label="Phone" value={selectedBookForPanel.distributorPhone} icon={Phone} />
                                      <div className="col-span-2 pt-2 border-t border-slate-100 mt-1">
                                          <DetailRow label="Address" value={selectedBookForPanel.distributionLocation} icon={MapPin} />
                                      </div>
                                  </div>
                              </TimelineItem>

                              {/* 2. Registered Phase */}
                              <TimelineItem 
                                  title="Registered Phase" 
                                  icon={User} 
                                  date={selectedBookForPanel.registrationDate}
                                  statusColor={selectedBookForPanel.status !== 'Distributed' ? 'blue' : 'slate'}
                              >
                                  {selectedBookForPanel.recipientName ? (
                                      <div className="grid grid-cols-2 gap-3">
                                          <DetailRow label="Recipient Name" value={selectedBookForPanel.recipientName} icon={User} />
                                          <DetailRow label="Phone" value={selectedBookForPanel.recipientPhone} icon={Phone} />
                                          <div className="col-span-2 pt-2 border-t border-slate-100 mt-1">
                                              <DetailRow label="Address" value={selectedBookForPanel.registrationAddress} icon={MapPin} />
                                          </div>
                                      </div>
                                  ) : <span className="text-xs text-slate-400 italic">Not yet registered</span>}
                              </TimelineItem>

                              {/* 3. Submission Phase */}
                              <TimelineItem 
                                  title="Submission Phase" 
                                  icon={FileText} 
                                  date={selectedBookForPanel.receivedDate}
                                  statusColor={(selectedBookForPanel.status === 'Received' || selectedBookForPanel.isDonorUpdated) ? 'emerald' : 'slate'}
                              >
                                  {selectedBookForPanel.receivedDate ? (
                                      <div className="space-y-3">
                                          <div className="flex justify-between items-center bg-emerald-50 p-2 rounded border border-emerald-100">
                                              <span className="text-xs font-bold text-emerald-700 uppercase">Amount</span>
                                              <span className="text-lg font-bold text-emerald-600">₹{selectedBookForPanel.totalAmount?.toLocaleString()}</span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                              <DetailRow label="Payment Mode" value={selectedBookForPanel.paymentMode || 'Offline'} icon={CreditCard} />
                                              <DetailRow label="Total Donors" value={selectedBookForPanel.filledPages?.toString()} icon={User} />
                                          </div>
                                      </div>
                                  ) : <span className="text-xs text-slate-400 italic">Book not yet submitted</span>}
                              </TimelineItem>

                              {/* 4. Donation Update Phase */}
                              <TimelineItem 
                                  title="Donation Update Phase" 
                                  icon={Heart} 
                                  date={selectedBookForPanel.donorUpdateDate}
                                  statusColor={selectedBookForPanel.isDonorUpdated ? 'purple' : 'slate'}
                                  isLast={true}
                              >
                                  <div className="flex flex-col gap-2">
                                      <div className="flex justify-between items-center">
                                          <span className="text-xs font-bold text-slate-500 uppercase">Donors Entry</span>
                                          <span className="text-xs font-bold text-slate-700">
                                              {selectedBookForPanel.pages ? selectedBookForPanel.pages.filter((p:any) => p.isFilled).length : 0} / {selectedBookForPanel.filledPages || 0}
                                          </span>
                                      </div>
                                      
                                      {/* Progress Bar */}
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                              className={`h-full ${selectedBookForPanel.isDonorUpdated ? 'bg-purple-500' : 'bg-amber-400'}`} 
                                              style={{ width: `${selectedBookForPanel.filledPages > 0 ? ((selectedBookForPanel.pages?.filter((p:any)=>p.isFilled).length || 0) / selectedBookForPanel.filledPages) * 100 : 0}%` }}
                                          ></div>
                                      </div>

                                      <div className="flex items-center gap-2 mt-2">
                                          {selectedBookForPanel.isDonorUpdated ? (
                                              <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold">
                                                  <CheckCircle size={12} className="mr-1" /> Success
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold">
                                                  <Clock size={12} className="mr-1" /> Pending
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              </TimelineItem>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

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
                    {/* Entity Name Display */}
                    <div className="border-t border-slate-100 pt-4">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {viewModalData.type === 'Center' ? 'Center Name' : viewModalData.type === 'District' ? 'District Name' : viewModalData.type === 'Autonomous' ? 'Autonomous Body' : 'Type Detail'}
                         </label>
                         <p className="text-sm font-medium text-slate-900 mt-1">{viewModalData.entityName || '-'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Truck size={12}/> Distributed</label>
                             <p className="text-sm font-bold text-indigo-600 mt-1">{viewModalData.count} Books</p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Phone size={12}/> Phone</label>
                             <p className="text-sm font-medium text-slate-700 mt-1">{viewModalData.phone}</p>
                        </div>
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

      {!isModal && (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div><h2 className="text-2xl font-bold text-slate-800">Add Distribution</h2><p className="text-slate-500 text-sm mt-1">Assign books to incharges and track dispatch.</p></div>
                <div className="w-full md:w-auto bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1 ml-1">Event Context</label>
                    <div className="relative">
                        <select value={selectedYagam} onChange={(e) => setSelectedYagam(e.target.value)} className="w-full md:w-64 appearance-none bg-white border border-indigo-200 text-indigo-700 font-bold py-2 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm">{YAGAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-600"><ArrowUpDown size={14} /></div>
                    </div>
                </div>
            </div>
            <div className="border-b border-slate-200 shrink-0">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('new_distribution')} className={`${activeTab === 'new_distribution' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center transition-colors`}><Plus className="mr-2 h-4 w-4" /> New Distribution</button>
                    <button onClick={() => setActiveTab('distributed_books')} className={`${activeTab === 'distributed_books' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center transition-colors`}><Truck className="mr-2 h-4 w-4" /> Distributed History</button>
                </nav>
            </div>
        </>
      )}

      <div className={`flex-1 relative ${!isModal ? 'mt-4' : ''}`}>
        
        {/* TAB 1: New Distribution Form */}
        {activeTab === 'new_distribution' && (
            <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${!isModal ? 'max-w-6xl mx-auto' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                   <div><h3 className="text-xl font-bold text-slate-800">{editingDistributionId ? 'Edit Distribution' : 'New Distribution'}</h3><p className="text-sm text-slate-500">Allocate stock to distribution channels.</p></div>
                   {editingDistributionId && <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>}
                </div>
                
                <form id="distribution-form" onSubmit={handleDistribute}>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT COLUMN: Recipient */}
                        <div className="flex flex-col h-full">
                           <div className="mb-4 flex items-center gap-2"><div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md"><User size={18} /></div><h4 className="font-bold text-slate-800 text-lg">Recipient Details</h4></div>
                           <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-200 flex-1">
                              <div className="grid grid-cols-2 gap-4">
                                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Date</label><input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" /></div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                                      <select name="recipientType" value={formData.recipientType} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm">
                                          <option value="Individual">Individual Person</option>
                                          <option value="Center">Center Incharge</option>
                                          <option value="District">District Incharge</option>
                                          <option value="Autonomous">Autonomous Body</option>
                                      </select>
                                  </div>
                              </div>
                              
                              {/* Conditional Entity Name Input */}
                              {formData.recipientType === 'Center' && (
                                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Center Name <span className="text-red-500">*</span></label><input type="text" name="entityName" required value={formData.entityName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Enter Center Name" /></div>
                              )}
                              {formData.recipientType === 'District' && (
                                  <div><label className="block text-sm font-bold text-slate-700 mb-1">District Name <span className="text-red-500">*</span></label><input type="text" name="entityName" required value={formData.entityName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Enter District Name" /></div>
                              )}
                              {formData.recipientType === 'Autonomous' && (
                                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Autonomous Body Name <span className="text-red-500">*</span></label><input type="text" name="entityName" required value={formData.entityName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Enter Autonomous Body Name" /></div>
                              )}

                              <div><label className="block text-sm font-bold text-slate-700 mb-1">Recipient Name <span className="text-red-500">*</span></label><input type="text" name="recipientName" required value={formData.recipientName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Full Name" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-slate-700 mb-1">Phone <span className="text-red-500">*</span></label><input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-1">PSSM ID</label><input type="text" name="pssmId" value={formData.pssmId} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Optional" /></div>
                              </div>
                              
                              <div className="space-y-4 pt-4 border-t border-slate-200 mt-2">
                                  <h5 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Truck size={12}/> Delivery Location</h5>
                                  <div className="grid grid-cols-2 gap-4">
                                      <SearchableSelect label="State" value={location.state} options={Object.keys(locationData)} onChange={(val) => setLocation({ state: val, district: '', town: '' })} placeholder="Select State" />
                                      <SearchableSelect label="District" value={location.district} options={location.state ? Object.keys(locationData[location.state] || {}) : []} onChange={(val) => setLocation(prev => ({ ...prev, district: val, town: '' }))} placeholder="Select District" disabled={!location.state} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <SearchableSelect label="Town / Mandal" value={location.town} options={location.district ? (Object.keys(locationData[location.state]?.[location.district] || {})) : []} onChange={(val) => setLocation(prev => ({ ...prev, town: val }))} placeholder="Select Town" disabled={!location.district} />
                                      <div>
                                          <label className="block text-sm font-bold text-slate-700 mb-1">Pincode</label>
                                          <input 
                                            type="text" 
                                            name="pincode" 
                                            value={formData.pincode} 
                                            onChange={handleInputChange} 
                                            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" 
                                            placeholder="6-digit PIN"
                                            maxLength={6}
                                          />
                                      </div>
                                  </div>
                              </div>
                           </div>
                        </div>

                        {/* RIGHT COLUMN: Book Assignment */}
                        <div className="flex flex-col h-full">
                           <div className="mb-4 flex items-center gap-2"><div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md"><Package size={18} /></div><h4 className="font-bold text-slate-800 text-lg">Stock Assignment</h4></div>
                           <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-5 flex-1 relative">
                              <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-1">Source Batch</label>
                                 <select name="batchNumber" value={formData.batchNumber} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white cursor-pointer">
                                    <option value="">Select Batch</option>
                                    {batchesList.map(batch => <option key={batch.id} value={batch.batchName}>{batch.batchName}</option>)}
                                 </select>
                                 {selectedBatchAvailable !== null ? (
                                     <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                         <div className="flex justify-between items-center mb-1">
                                             <span className="text-xs font-bold text-slate-500 uppercase">Availability</span>
                                             <span className={`text-lg font-bold ${selectedBatchAvailable > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                 {selectedBatchAvailable > 0 ? selectedBatchAvailable : 'Out of Stock'}
                                             </span>
                                         </div>
                                         {selectedBatchDetails && (
                                             <div className="text-xs text-slate-500 font-mono">
                                                 Range: {selectedBatchDetails.bookSerialStart} - {selectedBatchDetails.bookSerialEnd}
                                             </div>
                                         )}
                                     </div>
                                 ) : formData.batchNumber && (
                                     <div className="mt-2 text-xs text-slate-400">Select a valid batch to see stock.</div>
                                 )}
                              </div>
                              
                              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                  <h5 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1"><Archive size={12}/> Add Serial Numbers</h5>
                                  <div className="flex gap-2 items-end">
                                      <div className="flex-1"><label className="text-[10px] text-slate-500 block mb-1 font-bold">Start</label><input type="text" value={tempSerial.start} onChange={e => setTempSerial({...tempSerial, start: e.target.value})} className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded bg-white font-mono" placeholder="A001" /></div>
                                      <div className="flex-1"><label className="text-[10px] text-slate-500 block mb-1 font-bold">End</label><input type="text" value={tempSerial.end} onChange={e => setTempSerial({...tempSerial, end: e.target.value})} className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded bg-white font-mono" placeholder="A050" /></div>
                                      <button type="button" onClick={handleAddBookRange} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 shadow-sm"><Plus size={16} /></button>
                                  </div>
                                  <div className="flex gap-2 items-center">
                                      <div className="h-px bg-slate-200 flex-1"></div><span className="text-[10px] text-slate-400 uppercase">OR</span><div className="h-px bg-slate-200 flex-1"></div>
                                  </div>
                                  <div className="flex gap-2 items-end">
                                      <div className="flex-1"><label className="text-[10px] text-slate-500 block mb-1 font-bold">Single</label><input type="text" value={tempSerial.single} onChange={e => setTempSerial({...tempSerial, single: e.target.value})} className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded bg-white font-mono" placeholder="A005" /></div>
                                      <button type="button" onClick={handleAddSingleBook} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 shadow-sm"><Plus size={16} /></button>
                                  </div>
                              </div>

                              <div className="flex-1 flex flex-col min-h-[100px]">
                                  <div className="flex justify-between items-center mb-2">
                                      <p className="text-xs font-bold text-slate-500 uppercase">Assigned Books</p>
                                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{bookChips.length}</span>
                                  </div>
                                  <div className="flex-1 border border-slate-200 rounded-lg bg-slate-50 p-2 overflow-y-auto max-h-40 custom-scrollbar">
                                      {bookChips.length === 0 ? (
                                          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No books added yet</div>
                                      ) : (
                                          <div className="flex flex-wrap gap-2">
                                              {bookChips.map(book => (
                                                  <span key={book} className="inline-flex items-center px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 text-xs font-mono shadow-sm">
                                                      {book}
                                                      <button type="button" onClick={() => handleRemoveBook(book)} className="ml-1.5 text-slate-400 hover:text-red-500 transition-colors"><X size={12} /></button>
                                                  </span>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {formError && <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start"><AlertTriangle size={16} className="text-red-500 mt-0.5 mr-2 shrink-0" /><p className="text-sm text-red-700 font-medium">{formError}</p></div>}
                           </div>
                        </div>
                     </div>
                     
                     {/* Footer Actions */}
                     <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                        {editingDistributionId && <button type="button" onClick={handleCancel} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm">Cancel</button>}
                        <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-bold text-sm flex items-center">
                            <CheckCircle size={18} className="mr-2" />
                            {editingDistributionId ? 'Update Distribution' : 'Confirm Distribution'}
                        </button>
                     </div>
                  </form>
            </div>
        )}
        
        {/* TAB 2: Distributed Books Table */}
        {activeTab === 'distributed_books' && (
           <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 shrink-0 bg-white">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all" 
                            placeholder="Search Incharge or Book #..." 
                        />
                    </div>
                </div>
                
                <div className="px-4 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Filter size={16} className="text-indigo-600" />
                                <span>Filter By Location</span>
                            </div>
                            {(filterLocation.state || filterLocation.district || filterLocation.town || filterLocation.center || filterLocation.type) && (
                                <button 
                                    onClick={() => setFilterLocation({ state: '', district: '', town: '', center: '', type: '' })} 
                                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <RotateCcw size={12} /> Clear Filters
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="w-full">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Distribution Type</label>
                                <div className="relative">
                                    <select
                                        value={filterLocation.type}
                                        onChange={(e) => setFilterLocation(prev => ({ ...prev, type: e.target.value }))}
                                        className="block w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm transition-all text-slate-700 font-medium appearance-none cursor-pointer shadow-sm"
                                    >
                                        <option value="">All Types</option>
                                        {DISTRIBUTION_TYPES.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <SearchableSelect 
                                label="State" 
                                value={filterLocation.state} 
                                onChange={(val) => setFilterLocation({ ...filterLocation, state: val, district: '', town: '', center: '' })} 
                                options={Object.keys(locationData)}
                                placeholder="Select State"
                                className="w-full"
                            />

                            <SearchableSelect 
                                label="District" 
                                value={filterLocation.district} 
                                onChange={(val) => setFilterLocation(prev => ({ ...prev, district: val, town: '', center: '' }))} 
                                options={filterLocation.state ? Object.keys(locationData[filterLocation.state] || {}) : []}
                                placeholder="Select District"
                                disabled={!filterLocation.state}
                                className="w-full"
                            />

                            <SearchableSelect 
                                label="Town / Mandal" 
                                value={filterLocation.town} 
                                onChange={(val) => setFilterLocation(prev => ({ ...prev, town: val, center: '' }))} 
                                options={filterLocation.district ? (Object.keys(locationData[filterLocation.state]?.[filterLocation.district] || {})) : []}
                                placeholder="Select Town / Mandal"
                                disabled={!filterLocation.district}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-auto flex-1">
                    {isDataLoading ? <div className="p-10 text-center text-slate-400">Loading history...</div> : (
                        <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Incharge</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type Name</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Distribute</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Register</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Submit</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Updated</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {paginatedDistributedList.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">No records found matching filters.</td></tr>
                            ) : paginatedDistributedList.map((item) => (
                                <React.Fragment key={item.id}>
                                    <tr className={`hover:bg-slate-50 transition-colors ${expandedRowId === item.id ? 'bg-indigo-50/30' : ''}`}>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">{formatDate(item.date)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs font-bold text-slate-800">{item.name}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${item.type === 'Individual' ? 'bg-blue-50 text-blue-700 border-blue-200' : item.type === 'District' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                            {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                                            {item.type === 'Individual' ? '-' : (item.entityName || '-')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-xs font-bold text-indigo-600">{item.count}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-slate-800 font-bold">{item.registeredCount}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-slate-800 font-bold">{item.submittedCount}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-slate-800 font-bold">{item.donorUpdatedCount}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={(e) => handleViewDistribution(e, item)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEditDistribution(item)}
                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleExpand(item.id)}
                                                    className={`p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-all ${expandedRowId === item.id ? 'bg-slate-100 rotate-180' : ''}`}
                                                    title="Expand Books"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRowId === item.id && (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-6 bg-slate-50 shadow-inner">
                                                <div className="flex flex-col gap-4">
                                                    
                                                    {/* Inner Filter Tabs */}
                                                    <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                                                        <span className="text-xs font-bold text-slate-500 uppercase mr-2">Filter Books:</span>
                                                        {['All', 'Distributed', 'Registered', 'Submitted', 'Donor Updated'].map(filter => (
                                                            <button
                                                                key={filter}
                                                                onClick={() => setExpandedViewFilter(filter)}
                                                                className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
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
                                                                    onClick={() => handleBookClick(book.number)}
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
      </div>
    </div>
  );
};

export default AddDistribution;
