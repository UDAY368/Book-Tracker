import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { api } from '../services/api';
import { 
  Plus, FileText, Search, User, X, Upload, Loader2, CheckCircle, 
  Printer, Package, ChevronRight, ChevronDown, ChevronUp, FileCheck, Calendar, MapPin, Edit,
  ClipboardList, CheckSquare, Book, Trash2, Download, AlertTriangle, FileSpreadsheet, RefreshCw,
  Tag, Truck, Clock, List, Phone
} from 'lucide-react';

// --- Mock Location Data ---
const LOCATION_DATA: Record<string, Record<string, string[]>> = {
  "Andhra Pradesh": {
    "Visakhapatnam": ["MVP Colony", "Gajuwaka", "Bheemunipatnam", "Pendurthi"],
    "Vijayawada (NTR District)": ["Vijayawada North", "Vijayawada Central", "Vijayawada South", "Gollapudi"],
    "Guntur": ["Guntur East", "Guntur West", "Mangalagiri", "Tenali"],
    "Tirupati": ["Tirupati Urban", "Tirupati Rural", "Renigunta", "Srikalahasti"]
  },
  "Telangana": {
    "Hyderabad": ["Kukatpally", "Hitech City", "Secunderabad", "Charminar"],
    "Ranga Reddy": ["Gachibowli", "Shamshabad", "LB Nagar", "Ibrahimpatnam"],
    "Warangal": ["Warangal Urban", "Hanamkonda", "Kazipet", "Narsampet"],
    "Nizamabad": ["Nizamabad Rural", "Bodhan", "Armoor", "Dichpally"]
  },
  "Karnataka": {
    "Bengaluru Urban": ["Whitefield", "Indiranagar", "Koramangala", "Jayanagar"],
    "Mysuru": ["Mysuru North", "Mysuru South", "Nanjangud", "T. Narasipura"],
    "Mangaluru (Dakshina Kannada)": ["Mangaluru City", "Ullal", "Moodbidri", "Bantwal"],
    "Hubballi-Dharwad": ["Hubballi", "Dharwad", "Navanagar", "Kalghatgi"]
  }
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

const Distribution: React.FC<DistributionProps> = ({ role }) => {
  const canManageBatches = role === UserRole.SUPER_ADMIN || role === UserRole.BOOK_DISTRIBUTOR;
  const canDistribute = role === UserRole.SUPER_ADMIN || role === UserRole.BOOK_DISTRIBUTOR || role === UserRole.INCHARGE;

  const [activeTab, setActiveTab] = useState<Tab>('distribution');
  const [formOpen, setFormOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
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
  const [detailFilter, setDetailFilter] = useState<'All' | 'Distributed' | 'Registered' | 'Submitted'>('All');
  
  // Right Sidebar State for Book Details
  const [selectedBookDetail, setSelectedBookDetail] = useState<any | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Editing State for Distribution
  const [editingDistributionId, setEditingDistributionId] = useState<number | null>(null);

  // Data State - Initialized empty, loaded via API
  const [distributedList, setDistributedList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);

  // Selected Batch Availability State for Form
  const [selectedBatchAvailable, setSelectedBatchAvailable] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // --- NEW STATES FOR REQUIREMENTS ---
  const [location, setLocation] = useState({ state: '', district: '', town: '' });
  const [bookChips, setBookChips] = useState<string[]>([]);
  const [tempSerial, setTempSerial] = useState({ start: '', end: '', single: '' });


  // Load Data on Mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsDataLoading(true);
    try {
        const [distData, batchData] = await Promise.all([
            api.getDistributions(),
            api.getBatches()
        ]);
        setDistributedList(distData);
        setBatchesList(batchData);
    } catch (e) {
        console.error("Failed to load distribution data");
    } finally {
        setIsDataLoading(false);
    }
  };

  // Form States
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    recipientType: 'Individual',
    recipientName: '',
    phone: '',
    pssmId: '',
    // Address is now constructed from location state on submit
    batchNumber: '',
    // startSerial and endSerial are used for range generation
  });

  const [batchFormData, setBatchFormData] = useState({
    batchName: '',
    printedDate: '',
    totalBooks: '',
    startSerial: '',
    endSerial: '',
    status: 'In Stock'
  });
  
  const [editingBatchId, setEditingBatchId] = useState<number | string | null>(null);

  // --- Helper Component: Searchable Select ---
  const SearchableSelect = ({ 
    label, 
    value, 
    options, 
    onChange, 
    placeholder,
    disabled = false
  }: { label: string, value: string, options: string[], onChange: (val: string) => void, placeholder: string, disabled?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('');
    
    useEffect(() => {
        if (!isOpen) setFilter('');
    }, [isOpen]);

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="relative">
            <input
                type="text"
                value={value}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onChange={(e) => {
                    onChange(e.target.value);
                    setFilter(e.target.value);
                    setIsOpen(true);
                }}
                disabled={disabled}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                placeholder={placeholder}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            />
            {!disabled && (
                <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
            )}
        </div>
        {isOpen && filteredOptions.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-48 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none custom-scrollbar">
                {filteredOptions.map((opt) => (
                    <li 
                        key={opt}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-slate-900"
                        onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            onChange(opt);
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


  // --- Search Logic ---
  const filteredDistributedList = distributedList.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.phone?.includes(searchQuery) ||
    item.range?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setSelectedBookDetail({
        bookNumber: bookNum,
        status: status,
        recipientName: parentItem.name,
        phone: parentItem.phone,
        date: parentItem.date,
        regDate: status !== 'Distributed' ? '2023-10-25' : 'N/A',
        pssmId: parentItem.pssmId || 'PSSM-1234',
        address: parentItem.address || 'Hyderabad, Telangana'
    });
  };

  // Helper to generate book list for the grid based on range
  const generateBookGrid = (item: any) => {
    // If item has stored detailed list (from new edit logic), use that, else mock it
    if (item.bookChips && item.bookChips.length > 0) {
        return item.bookChips.map((num: string) => ({ number: num, status: 'Distributed' })); // Default status for now
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
        if (i < (item.submittedCount || 0)) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null); 

    if (name === 'batchNumber') {
      const selectedBatch = batchesList.find(b => b.batchName === value);
      if (selectedBatch) {
        const avail = getAvailableBooks(selectedBatch);
        setSelectedBatchAvailable(avail);
      } else {
        setSelectedBatchAvailable(null);
      }
    }
  };

  // --- Book Assignment Handlers ---
  const handleAddBookRange = () => {
    if (!tempSerial.start || !tempSerial.end) return;
    
    // Simple alpha-numeric generator
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
        // Match padding length of input if possible, else simple string
        newBooks.push(`${prefix}${i}`);
    }

    setBookChips(prev => [...new Set([...prev, ...newBooks])]); // Avoid duplicates
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


  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBatchFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- EXPORT & IMPORT LOGIC ---
  const getSampleData = () => {
    if (activeTab === 'distribution') {
      return {
        headers: ['Date (YYYY-MM-DD)', 'Recipient Name', 'Phone', 'Type', 'Start Serial', 'End Serial', 'Number of Books'],
        row: ['2023-10-01', 'John Doe', '9876543210', 'Individual', 'A001', 'A010', '10']
      };
    } else {
      return {
        headers: ['Batch Name', 'Printed Date (YYYY-MM-DD)', 'Start Serial', 'End Serial', 'Total Books', 'Status'],
        row: ['HYD-BATCH-01', '2023-09-15', 'A1000', 'A1999', '1000', 'In Stock']
      };
    }
  };

  const downloadTemplate = () => {
    const { headers, row } = getSampleData();
    const csvContent = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab === 'distribution' ? 'distribution' : 'batch'}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportStep('fileSelected');
      setImportReport([]);
    }
  };

  const validateFile = () => {
    if (!selectedFile) return;
    setImportStep('validating');
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => { 
        try {
          let text = event.target?.result as string;
          text = text.replace(/^\uFEFF/, '');
          const lines = text.split(/\r\n|\n|\r/).map(line => line.trim()).filter(line => line);
          
          if (lines.length < 2) {
            throw new Error("File is empty or missing data rows.");
          }

          const fileHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const { headers: expectedHeaders } = getSampleData();

          const missingHeaders = expectedHeaders.filter(h => !fileHeaders.includes(h));
          
          if (missingHeaders.length > 0) {
             setImportReport([{ id: 0, data: {}, status: 'error', message: `Invalid Headers. Missing: ${missingHeaders.join(', ')}` }]);
             setImportStep('report');
             return;
          }

          const results: ImportRowResult[] = lines.slice(1).map((line, index) => {
             const cols = line.split(',').map(c => c.trim().replace(/"/g, '')); 
             let dataObject: any = {};

             if (activeTab === 'distribution') {
                dataObject = { date: cols[0], name: cols[1], phone: cols[2], type: cols[3], start: cols[4], end: cols[5], count: cols[6] };
                if (!dataObject.name || !dataObject.phone) return { id: index + 1, data: dataObject, status: 'error', message: 'Name or Phone missing' };
                if (isNaN(parseInt(dataObject.count))) return { id: index + 1, data: dataObject, status: 'error', message: 'Invalid Book Count' };
             } else {
                dataObject = { batchName: cols[0], date: cols[1], start: cols[2], end: cols[3], total: cols[4], status: cols[5] };
                if (!dataObject.batchName) return { id: index + 1, data: dataObject, status: 'error', message: 'Missing Batch Name' };
             }
             return { id: index + 1, data: dataObject, status: 'valid', message: 'Valid' };
          });
          setImportReport(results);
          setImportStep('report');
        } catch (err: any) {
          setImportReport([{ id: 0, data: {}, status: 'error', message: err.message || "Failed to parse file" }]);
          setImportStep('report');
        }
      }, 1000);
    };
    reader.readAsText(selectedFile);
  };

  const finalizeImport = async () => {
    const validRows = importReport.filter(r => r.status === 'valid');
    if (validRows.length === 0) return;
    
    if (activeTab === 'distribution') {
       const newItems = validRows.map((row, idx) => ({
          id: Date.now() + idx,
          date: row.data.date,
          name: row.data.name,
          phone: row.data.phone,
          type: row.data.type,
          range: `${row.data.start} - ${row.data.end}`,
          count: parseInt(row.data.count),
          status: 'Distributed',
          registeredCount: 0,
          registeredSeries: [],
          submittedCount: 0,
          submittedSeries: []
       }));
       await api.saveDistributionsBulk(newItems);
    } else {
       const newBatches = validRows.map((row, idx) => ({
          id: Date.now() + idx,
          batchName: row.data.batchName,
          printedDate: row.data.date,
          startSerial: row.data.start,
          endSerial: row.data.end,
          totalBooks: parseInt(row.data.total),
          remainingBooks: parseInt(row.data.total), 
          status: row.data.status || 'In Stock'
       }));
       await api.saveBatchesBulk(newBatches);
    }
    await loadData();
    setImportModalOpen(false);
    resetImport();
    
    setToastMessage(`Successfully imported ${validRows.length} records`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const resetImport = () => {
    setImportStep('idle');
    setSelectedFile(null);
    setImportReport([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Export Handler ---
  const handleExport = () => {
    const isDistributionTab = activeTab === 'distribution';
    const filename = isDistributionTab ? 'distributed_books' : 'print_batches';
    const dateStr = new Date().toISOString().split('T')[0];
    let headers: string[] = [];
    let dataToExport: any[] = [];

    if (isDistributionTab) {
      if (filteredDistributedList.length === 0) {
        alert("No distribution records to export.");
        return;
      }
      headers = ['Date', 'Recipient Name', 'Phone', 'Type', 'Serial Range', 'Total Books', 'Batch Name', 'Status', 'Registered Count', 'Submitted Count'];
      dataToExport = filteredDistributedList.map(item => ({
        Date: item.date,
        'Recipient Name': item.name,
        Phone: item.phone,
        Type: item.type,
        'Serial Range': item.range,
        'Total Books': item.count,
        'Batch Name': item.batchName || '',
        Status: item.status,
        'Registered Count': item.registeredCount || 0,
        'Submitted Count': item.submittedCount || 0
      }));
    } else {
      if (filteredBatchesList.length === 0) {
        alert("No print batches to export.");
        return;
      }
      headers = ['Batch Name', 'Printed Date', 'Start Serial', 'End Serial', 'Total Books', 'Available Books', 'Status'];
      dataToExport = filteredBatchesList.map(item => ({
        'Batch Name': item.batchName,
        'Printed Date': item.printedDate,
        'Start Serial': item.startSerial,
        'End Serial': item.endSerial,
        'Total Books': item.totalBooks,
        'Available Books': getAvailableBooks(item),
        Status: item.status
      }));
    }

    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of dataToExport) {
      const values = headers.map(header => {
        const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Modal & Form Handlers ---

  const openNewDistributionModal = () => {
    setEditingDistributionId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      recipientType: 'Individual',
      recipientName: '',
      phone: '',
      pssmId: '',
      address: '', // Legacy field logic
      batchNumber: '',
      startSerial: '',
      endSerial: '',
      numberOfBooks: ''
    });
    setLocation({ state: '', district: '', town: '' });
    setBookChips([]);
    setTempSerial({ start: '', end: '', single: '' });
    setFormError(null);
    setSelectedBatchAvailable(null);
    setFormOpen(true);
  };

  const openEditDistributionModal = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setEditingDistributionId(item.id);
    
    // Try to parse address into location state
    const addrParts = (item.address || '').split(',').map((s: string) => s.trim());
    // Assuming format: Town, District, State
    const town = addrParts[0] || '';
    const district = addrParts[1] || '';
    const state = addrParts[2] || '';

    setLocation({ state, district, town });
    setBookChips(item.bookChips || []); 
    
    // If no chips but range exists, populate chips from range for editing
    if ((!item.bookChips || item.bookChips.length === 0) && item.range) {
         // Simple mock regeneration
         const generated = generateBookGrid(item).map((b: any) => b.number);
         setBookChips(generated);
    }

    setFormData({
      date: item.date,
      recipientType: item.type,
      recipientName: item.name,
      phone: item.phone,
      pssmId: item.pssmId || '', 
      address: item.address || '',
      batchNumber: item.batchName || '',
      startSerial: '',
      endSerial: '',
      numberOfBooks: item.count.toString()
    });
    setFormError(null);
    if (item.batchName) {
       const batch = batchesList.find(b => b.batchName === item.batchName);
       if (batch) setSelectedBatchAvailable(getAvailableBooks(batch));
    }
    setFormOpen(true);
  };

  // ... [Keep Batch Modal Functions] ...
  const openCreateBatchModal = () => {
    setEditingBatchId(null);
    setBatchFormData({ batchName: '', printedDate: new Date().toISOString().split('T')[0], totalBooks: '', startSerial: '', endSerial: '', status: 'In Stock' });
    setBatchModalOpen(true);
  };
  const openEditBatchModal = (e: React.MouseEvent, batch: any) => {
    e.stopPropagation();
    setEditingBatchId(batch.id);
    setBatchFormData({ batchName: batch.batchName, printedDate: batch.printedDate, totalBooks: batch.totalBooks.toString(), startSerial: batch.startSerial, endSerial: batch.endSerial, status: batch.status });
    setBatchModalOpen(true);
  };
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...batchFormData, id: editingBatchId, totalBooks: parseInt(String(batchFormData.totalBooks)) };
    if (!editingBatchId) payload.remainingBooks = payload.totalBooks;
    await api.saveBatch(payload);
    await loadData();
    setBatchModalOpen(false);
    setToastMessage("Batch Saved!"); setShowToast(true); setTimeout(()=>setShowToast(false), 3000);
  };
  const handleDeleteBatch = async (e: React.MouseEvent, id: any) => {
      e.stopPropagation();
      if(confirm("Delete?")) { await api.deleteBatch(id); loadData(); }
  };

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    const countToDistribute = bookChips.length;

    if (countToDistribute === 0) {
        setFormError("Please assign at least one book.");
        return;
    }

    // VALIDATION
    if (!editingDistributionId && formData.batchNumber) {
        if (selectedBatchAvailable !== null) {
             if (selectedBatchAvailable === 0) {
                 setFormError("The selected batch is Out of Books.");
                 return;
             }
             if (countToDistribute > selectedBatchAvailable) {
                setFormError(`The batch is Out of Books (Available: ${selectedBatchAvailable})`);
                return;
             }
        }
    }

    // Construct Address
    const finalAddress = `${location.town}, ${location.district}, ${location.state}`;
    
    // Calculate Range String
    const sortedChips = [...bookChips].sort();
    const rangeString = sortedChips.length > 0 
        ? (sortedChips.length > 1 ? `${sortedChips[0]} - ${sortedChips[sortedChips.length-1]}` : sortedChips[0])
        : '-';

    const distributionPayload = {
        id: editingDistributionId, // Null for new
        date: formData.date,
        name: formData.recipientName,
        phone: formData.phone,
        type: formData.recipientType,
        range: rangeString,
        count: countToDistribute,
        status: 'Distributed',
        batchName: formData.batchNumber,
        pssmId: formData.pssmId,
        address: finalAddress,
        bookChips: bookChips, // Persist chips
        registeredCount: 0,
        submittedCount: 0
    };

    // UPDATE BATCH INVENTORY Logic
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
    
    setToastMessage(editingDistributionId ? "Distribution Updated!" : "Distribution Added!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    setFormOpen(false);
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
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedBookDetail(null)}></div>
            <div className="w-96 bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
               <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
                  <div>
                     <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Book className="text-indigo-400" size={24} />
                        {selectedBookDetail.bookNumber}
                     </h3>
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-3 border ${
                        selectedBookDetail.status === 'Submitted' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' :
                        selectedBookDetail.status === 'Registered' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' :
                        'bg-slate-700 text-slate-300 border-slate-600'
                     }`}>
                        {selectedBookDetail.status}
                     </span>
                  </div>
                  <button onClick={() => setSelectedBookDetail(null)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  
                  {/* Recipient Info */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                           {selectedBookDetail.recipientName.charAt(0)}
                        </div>
                        <div>
                           <p className="text-sm font-medium text-slate-900">{selectedBookDetail.recipientName}</p>
                           <p className="text-xs text-slate-500">{selectedBookDetail.phone}</p>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 pt-2">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PSSM ID</p><p className="text-sm font-mono text-slate-700">{selectedBookDetail.pssmId}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distribution Date</p><p className="text-sm text-slate-700">{formatDate(selectedBookDetail.date)}</p></div>
                     </div>
                     
                     <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                            <MapPin size={14} className="text-indigo-500" /> Location Details
                        </h4>
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                             <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                                 <span className="text-xs text-slate-500 font-medium">Town / Mandal</span>
                                 <span className="text-sm text-slate-900 font-semibold">
                                     {selectedBookDetail.address.split(',')[0]?.trim() || '-'}
                                 </span>
                             </div>
                             <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                 <span className="text-xs text-slate-500 font-medium">District</span>
                                 <span className="text-sm text-slate-900 font-semibold">
                                     {selectedBookDetail.address.split(',')[1]?.trim() || '-'}
                                 </span>
                             </div>
                             <div className="p-3 flex justify-between items-center">
                                 <span className="text-xs text-slate-500 font-medium">State</span>
                                 <span className="text-sm text-slate-900 font-semibold">
                                     {selectedBookDetail.address.split(',')[2]?.trim() || '-'}
                                 </span>
                             </div>
                        </div>
                     </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><Clock size={14} className="mr-2 text-indigo-500" /> Timeline</h4>
                      <div className="relative pl-4 space-y-6">
                          <div className="absolute left-[23px] top-2 bottom-4 w-0.5 bg-slate-100"></div>
                          <div className="relative flex gap-4 items-start">
                             <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${selectedBookDetail.status === 'Distributed' || selectedBookDetail.status === 'Registered' || selectedBookDetail.status === 'Submitted' ? 'bg-indigo-100 text-indigo-600 ring-4 ring-white' : 'bg-slate-100 text-slate-400'}`}><Truck size={10} /></div>
                             <div><p className="text-xs font-bold text-slate-700">Distributed</p><p className="text-[10px] text-slate-500">{formatDate(selectedBookDetail.date)}</p></div>
                          </div>
                          <div className="relative flex gap-4 items-start">
                             <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${selectedBookDetail.status === 'Registered' || selectedBookDetail.status === 'Submitted' ? 'bg-blue-100 text-blue-600 ring-4 ring-white' : 'bg-slate-100 text-slate-400 ring-4 ring-white'}`}><User size={10} /></div>
                             <div><p className={`text-xs font-bold ${selectedBookDetail.status === 'Registered' || selectedBookDetail.status === 'Submitted' ? 'text-slate-700' : 'text-slate-400'}`}>Registered</p><p className="text-[10px] text-slate-500">{selectedBookDetail.regDate}</p></div>
                          </div>
                          <div className="relative flex gap-4 items-start">
                             <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${selectedBookDetail.status === 'Submitted' ? 'bg-green-100 text-green-600 ring-4 ring-white' : 'bg-slate-100 text-slate-400 ring-4 ring-white'}`}><CheckCircle size={10} /></div>
                             <div><p className={`text-xs font-bold ${selectedBookDetail.status === 'Submitted' ? 'text-slate-700' : 'text-slate-400'}`}>Submitted</p><p className="text-[10px] text-slate-500">{selectedBookDetail.status === 'Submitted' ? 'Completed' : 'Pending'}</p></div>
                          </div>
                      </div>
                  </div>
               </div>
               <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 text-center"><button onClick={() => setSelectedBookDetail(null)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Close Panel</button></div>
            </div>
         </div>
      )}

      {/* Header & Tabs ... */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div><h2 className="text-2xl font-bold text-slate-800">Book Distribution</h2><p className="text-slate-500 text-sm mt-1">Manage print batches and assign books to network.</p></div>
        <div className="flex gap-2">
          {canDistribute && (<button type="button" onClick={openNewDistributionModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition shadow-sm font-medium text-sm"><Plus size={18} className="mr-2" /> New Distribution</button>)}
          {canManageBatches && (<button type="button" onClick={openCreateBatchModal} className="flex items-center bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50 transition shadow-sm font-medium text-sm"><Printer size={18} className="mr-2" /> Create Print Batch</button>)}
        </div>
      </div>
      <div className="border-b border-slate-200 shrink-0">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('distribution')} className={`${activeTab === 'distribution' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}><Package className="mr-2 h-4 w-4" /> Distributed Books</button>
            <button onClick={() => setActiveTab('batches')} className={`${activeTab === 'batches' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}><Printer className="mr-2 h-4 w-4" /> Print Batches</button>
          </nav>
      </div>

      {/* Main Content Table ... */}
      <div className="flex-1 relative">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 shrink-0 bg-slate-50">
             <div className="relative max-w-sm w-full"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow" placeholder={activeTab === 'distribution' ? "Search recipient, book #..." : "Search batch name, status..."} /></div>
             <div className="flex gap-2"><button onClick={() => { setImportModalOpen(true); resetImport(); }} className="flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"><Upload size={16} className="mr-2" /> Import</button><button onClick={handleExport} className="flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"><Download size={16} className="mr-2" /> Export</button></div>
          </div>

          <div className="overflow-auto flex-1">
            {isDataLoading ? (
               <div className="flex items-center justify-center h-full text-slate-400"><Loader2 className="animate-spin mr-2" /> Loading Data...</div>
            ) : (
                <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  {activeTab === 'distribution' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Distribution Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lifecycle Status</th>
                      <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Printed Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Serial Range</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Books</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Available Books</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                 {activeTab === 'distribution' && (
                   filteredDistributedList.map((item) => {
                     const isExpanded = expandedRowId === item.id;
                     const totalDistributed = item.count || 0;
                     const pendingRegistered = Math.max(0, totalDistributed - (item.registeredCount || 0));
                     const pendingSubmitted = Math.max(0, totalDistributed - (item.submittedCount || 0));
                     
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
                              <div className="flex flex-col gap-2 w-48">
                                 <div className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded border border-slate-100"><span className="text-slate-600 font-medium">Distributed</span><span className="font-bold text-slate-900">{totalDistributed}</span></div>
                                 <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Registered</span><div className="flex items-center gap-1.5"><span className="font-bold text-blue-600">{item.registeredCount || 0}</span><span className="text-slate-300">|</span><span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${pendingRegistered > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{pendingRegistered}</span></div></div>
                                 <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Submitted</span><div className="flex items-center gap-1.5"><span className="font-bold text-green-600">{item.submittedCount || 0}</span><span className="text-slate-300">|</span><span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${pendingSubmitted > 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{pendingSubmitted}</span></div></div>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={(e) => openEditDistributionModal(e, item)} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md"><Edit size={14} className="mr-1.5" /> Edit</button>
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
                                        <div className="flex gap-1 bg-slate-100 p-1 rounded-md">
                                           {(['All', 'Distributed', 'Registered', 'Submitted'] as const).map(filter => (
                                              <button key={filter} onClick={(e) => { e.stopPropagation(); setDetailFilter(filter); }} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${detailFilter === filter ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{filter}</button>
                                           ))}
                                        </div>
                                     </div>
                                     <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-60 overflow-y-auto p-1">
                                         {filteredBookList.map((book: any) => (
                                             <button key={book.number} onClick={(e) => handleBookGridClick(e, book.number, book.status, item)} className={`flex flex-col items-center justify-center py-2 rounded border text-[10px] font-mono transition-all hover:shadow-md active:scale-95 ${book.status === 'Submitted' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : book.status === 'Registered' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`} title={`${book.number} - ${book.status}`}>
                                                <span className="font-bold">{book.number}</span>
                                                <span className="text-[8px] uppercase mt-0.5 opacity-80">{book.status}</span>
                                             </button>
                                         ))}
                                     </div>
                                     {filteredBookList.length === 0 && <div className="text-center py-8 text-slate-400 text-xs italic">No books found for filter "{detailFilter}"</div>}
                                  </div>
                               </td>
                            </tr>
                         )}
                       </React.Fragment>
                     );
                   })
                 )}
                 {activeTab === 'batches' && (
                   filteredBatchesList.map((batch) => (
                     <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{batch.batchName}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{batch.printedDate ? new Date(batch.printedDate).toLocaleDateString() : '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{batch.startSerial} - {batch.endSerial}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{batch.totalBooks ? batch.totalBooks.toLocaleString() : '0'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-700 font-bold">{getAvailableBooks(batch).toLocaleString()}</td>
                       <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${batch.status === 'Fully Distributed' ? 'bg-green-100 text-green-800' : batch.status === 'Partially Distributed' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>{batch.status}</span></td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-end gap-2"><button onClick={(e) => openEditBatchModal(e, batch)} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md"><Edit size={14} className="mr-1.5" /> Edit</button></div></td>
                     </tr>
                   ))
                 )}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* ... Modals ... */}
        {/* --- New/Edit Distribution Modal --- */}
        {formOpen && activeTab === 'distribution' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setFormOpen(false)}></div>
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white rounded-t-xl shrink-0">
                   <div><h3 className="text-xl font-bold text-slate-800">{editingDistributionId ? 'Edit Distribution' : 'New Distribution'}</h3><p className="text-sm text-slate-500">Assign books to an individual or center.</p></div>
                   <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="overflow-y-auto p-6 bg-slate-50/50">
                  <form id="distribution-form" onSubmit={handleDistribute}>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full relative"> {/* Removed overflow-hidden for dropdowns */}
                           <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 rounded-t-xl"><div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md"><User size={18} /></div><h4 className="font-semibold text-slate-800">Recipient Details</h4></div>
                           <div className="p-5 space-y-4 flex-1 relative z-20"> {/* Added relative z-20 */}
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label><input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" /></div>
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Recipient Type</label><select name="recipientType" value={formData.recipientType} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"><option value="Individual">Individual Person</option><option value="Center">Center Incharge</option><option value="District">District Incharge</option><option value="Autonomous">Autonomous Body</option></select></div>
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label><input type="text" name="recipientName" required value={formData.recipientName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Recipient Name" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-red-500">*</span></label><input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">PSSM ID</label><input type="text" name="pssmId" value={formData.pssmId} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Optional" /></div>
                              </div>
                              
                              {/* Location Cascading Dropdowns */}
                              <div className="space-y-3 pt-2 border-t border-slate-100 mt-2">
                                  <h5 className="text-xs font-bold text-slate-500 uppercase">Location</h5>
                                  <SearchableSelect 
                                      label="State"
                                      value={location.state}
                                      options={Object.keys(LOCATION_DATA)}
                                      onChange={(val) => setLocation({ state: val, district: '', town: '' })}
                                      placeholder="Select State"
                                  />
                                  <SearchableSelect 
                                      label="District"
                                      value={location.district}
                                      options={location.state ? Object.keys(LOCATION_DATA[location.state] || {}) : []}
                                      onChange={(val) => setLocation(prev => ({ ...prev, district: val, town: '' }))}
                                      placeholder="Select District"
                                      disabled={!location.state}
                                  />
                                  <SearchableSelect 
                                      label="Town / Mandal"
                                      value={location.town}
                                      options={location.district ? (LOCATION_DATA[location.state]?.[location.district] || []) : []}
                                      onChange={(val) => setLocation(prev => ({ ...prev, town: val }))}
                                      placeholder="Select Town"
                                      disabled={!location.district}
                                  />
                              </div>
                           </div>
                        </div>

                        {/* Book Assignment Card */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full relative z-10"> {/* Removed overflow-hidden */}
                           <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 rounded-t-xl"><div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md"><Package size={18} /></div><h4 className="font-semibold text-slate-800">Book Assignment</h4></div>
                           <div className="p-5 space-y-4 flex-1">
                              <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                                 <div className="relative">
                                    <select name="batchNumber" value={formData.batchNumber} onChange={handleInputChange} className="block w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white">
                                       <option value="">Select Batch</option>
                                       {batchesList.map(batch => <option key={batch.id} value={batch.batchName}>{batch.batchName} ({getAvailableBooks(batch)} Avail)</option>)}
                                    </select>
                                 </div>
                                 {selectedBatchAvailable !== null && <p className="text-xs text-emerald-600 mt-1 font-medium">Available Books: {selectedBatchAvailable}</p>}
                              </div>
                              
                              {/* New Book Series Builder */}
                              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <h5 className="text-xs font-bold text-slate-700 uppercase">Add Books</h5>
                                  <div className="flex gap-2 items-end">
                                      <div className="flex-1">
                                          <label className="text-[10px] text-slate-500 block mb-1">Start Serial</label>
                                          <input type="text" value={tempSerial.start} onChange={e => setTempSerial({...tempSerial, start: e.target.value})} className="w-full text-xs p-1.5 border rounded font-mono" />
                                      </div>
                                      <div className="flex-1">
                                          <label className="text-[10px] text-slate-500 block mb-1">End Serial</label>
                                          <input type="text" value={tempSerial.end} onChange={e => setTempSerial({...tempSerial, end: e.target.value})} className="w-full text-xs p-1.5 border rounded font-mono" />
                                      </div>
                                      <button type="button" onClick={handleAddBookRange} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700"><Plus size={16} /></button>
                                  </div>
                                  <div className="flex gap-2 items-end border-t border-slate-200 pt-2">
                                      <div className="flex-1">
                                          <label className="text-[10px] text-slate-500 block mb-1">Single Book #</label>
                                          <input type="text" value={tempSerial.single} onChange={e => setTempSerial({...tempSerial, single: e.target.value})} className="w-full text-xs p-1.5 border rounded font-mono" />
                                      </div>
                                      <button type="button" onClick={handleAddSingleBook} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700"><Plus size={16} /></button>
                                  </div>
                              </div>

                              {/* Chips Display */}
                              <div className="min-h-[60px] p-2 border border-slate-200 rounded-lg bg-slate-50">
                                  <p className="text-xs text-slate-500 mb-2">Selected Books ({bookChips.length})</p>
                                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                      {bookChips.length === 0 && <span className="text-xs text-slate-400 italic">No books added</span>}
                                      {bookChips.map(book => (
                                          <span key={book} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border border-slate-300 text-slate-700 shadow-sm font-mono">
                                              {book}
                                              <button type="button" onClick={() => handleRemoveBook(book)} className="ml-1 text-slate-400 hover:text-red-500"><X size={12} /></button>
                                          </span>
                                      ))}
                                  </div>
                              </div>

                              {/* Total Count Display (ReadOnly) */}
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Count</label>
                                  <input type="text" readOnly value={bookChips.length} className="block w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-500 font-bold" />
                              </div>

                              {formError && <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start"><AlertTriangle size={16} className="text-red-500 mt-0.5 mr-2 shrink-0" /><p className="text-sm text-red-700 font-medium">{formError}</p></div>}
                           </div>
                        </div>
                     </div>
                     <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-xl shrink-0 flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors font-medium text-sm">{editingDistributionId ? 'Update Distribution' : 'Confirm Distribution'}</button>
                     </div>
                  </form>
                </div>
             </div>
          </div>
        )}

        {/* ... (Keep other modals: Import, Create Batch) ... */}
        {/* ... REVISED IMPORT MODAL WITH STEPS (Keep as is) ... */}
        {batchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBatchModalOpen(false)}></div>
             <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 z-10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-900">{editingBatchId ? 'Edit Print Batch' : 'Create Print Batch'}</h3><button onClick={() => setBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
                <form onSubmit={handleBatchSubmit} className="space-y-4">
                   <div><label className="block text-sm font-medium text-slate-700">Batch Name</label><input type="text" name="batchName" required value={batchFormData.batchName} onChange={handleBatchInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., HYD-NOV-2023" /></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-slate-700">Printed Date</label><input type="date" name="printedDate" required value={batchFormData.printedDate} onChange={handleBatchInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" /></div>
                      <div><label className="block text-sm font-medium text-slate-700">Total Books</label><input type="number" name="totalBooks" required value={batchFormData.totalBooks} onChange={handleBatchInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" /></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-slate-700">Start Serial</label><input type="text" name="startSerial" required value={batchFormData.startSerial} onChange={handleBatchInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" /></div>
                      <div><label className="block text-sm font-medium text-slate-700">End Serial</label><input type="text" name="endSerial" required value={batchFormData.endSerial} onChange={handleBatchInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" /></div>
                   </div>
                   <div><label className="block text-sm font-medium text-slate-700">Status</label><select name="status" value={batchFormData.status} onChange={handleBatchInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"><option value="In Stock">In Stock</option><option value="Partially Distributed">Partially Distributed</option><option value="Fully Distributed">Fully Distributed</option></select></div>
                   <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setBatchModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{editingBatchId ? 'Update Batch' : 'Create Batch'}</button></div>
                </form>
             </div>
          </div>
        )}

        {/* ... REVISED IMPORT MODAL WITH STEPS (Keep as is) ... */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setImportModalOpen(false)}></div>
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white rounded-t-xl shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Import {activeTab === 'distribution' ? 'Distribution' : 'Batches'}
                    </h3>
                    <p className="text-sm text-slate-500">Add multiple records via CSV upload.</p>
                  </div>
                  <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                  {importStep === 'idle' && (
                    <div className="space-y-6">
                       <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                             <FileSpreadsheet size={16} className="text-emerald-600" /> Required Format
                          </h4>
                          <div className="overflow-x-auto">
                             <table className="min-w-full text-xs text-left">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                   <tr>
                                      {getSampleData().headers.map((h, i) => (
                                         <th key={i} className="px-3 py-2 font-medium text-slate-600 whitespace-nowrap">{h}</th>
                                      ))}
                                   </tr>
                                </thead>
                                <tbody>
                                   <tr className="bg-white">
                                      {getSampleData().row.map((d, i) => (
                                         <td key={i} className="px-3 py-2 text-slate-500 border-b border-slate-100 whitespace-nowrap">{d}</td>
                                      ))}
                                   </tr>
                                </tbody>
                             </table>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 italic">* Ensure headers match exactly as shown above.</p>
                       </div>

                       <div className="flex justify-center">
                          <button onClick={downloadTemplate} className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">
                             <Download size={14} className="mr-1" /> Download Empty Template
                          </button>
                       </div>

                       <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                          <input ref={fileInputRef} type="file" accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileSelect} />
                          <div className="flex flex-col items-center">
                             <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full mb-3"><Upload size={24} /></div>
                             <p className="text-sm font-medium text-slate-900">Click to upload CSV file</p>
                             <p className="text-xs text-slate-500 mt-1">Maximum size 5MB</p>
                          </div>
                       </div>
                    </div>
                  )}

                  {importStep === 'fileSelected' && (
                     <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="p-4 bg-indigo-50 rounded-full text-indigo-600"><FileText size={48} /></div>
                        <div className="text-center">
                           <p className="text-lg font-medium text-slate-900">{selectedFile?.name}</p>
                           <p className="text-sm text-slate-500">{(selectedFile?.size || 0) / 1000} KB</p>
                        </div>
                        <div className="flex gap-3 mt-4">
                           <button onClick={resetImport} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium">Remove</button>
                           <button onClick={validateFile} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm">Validate File</button>
                        </div>
                     </div>
                  )}

                  {importStep === 'validating' && (
                     <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                        <p className="text-slate-600 font-medium">Validating data structure...</p>
                     </div>
                  )}

                  {importStep === 'report' && (
                     <div className="space-y-4 h-full flex flex-col">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                           <div className="flex gap-4">
                              <span className="flex items-center text-sm font-medium text-emerald-700"><CheckCircle size={16} className="mr-1.5" /> {importReport.filter(r => r.status === 'valid').length} Valid</span>
                              <span className="flex items-center text-sm font-medium text-red-700"><AlertTriangle size={16} className="mr-1.5" /> {importReport.filter(r => r.status === 'error').length} Errors</span>
                           </div>
                           {importReport.some(r => r.status === 'error') && (
                              <button onClick={() => { setImportStep('idle'); setSelectedFile(null); }} className="text-xs text-slate-500 hover:text-indigo-600 flex items-center"><RefreshCw size={12} className="mr-1" /> Re-upload</button>
                           )}
                        </div>
                        <div className="flex-1 overflow-auto border border-slate-200 rounded-lg max-h-[300px]">
                           <table className="min-w-full divide-y divide-slate-200 text-sm">
                              <thead className="bg-slate-50 sticky top-0">
                                 <tr>
                                    <th className="px-4 py-2 text-left font-medium text-slate-500">Row</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-500">Message</th>
                                 </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-100">
                                 {importReport.map((row) => (
                                    <tr key={row.id} className={row.status === 'error' ? 'bg-red-50' : ''}>
                                       <td className="px-4 py-2 text-slate-500">#{row.id}</td>
                                       <td className="px-4 py-2">{row.status === 'valid' ? <span className="text-emerald-600 font-medium">Valid</span> : <span className="text-red-600 font-medium">Error</span>}</td>
                                       <td className="px-4 py-2 text-slate-600">{row.message}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-xl shrink-0 flex justify-end gap-3">
                   <button onClick={() => setImportModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm">Cancel</button>
                   {importStep === 'report' && importReport.some(r => r.status === 'valid') && (
                      <button onClick={finalizeImport} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm">Import {importReport.filter(r => r.status === 'valid').length} Valid Rows</button>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Distribution;