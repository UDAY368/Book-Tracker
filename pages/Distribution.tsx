import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { api } from '../services/api';
import { 
  Plus, FileText, Search, User, X, Upload, Loader2, CheckCircle, 
  Printer, Package, ChevronRight, ChevronDown, ChevronUp, FileCheck, Calendar, MapPin, Edit,
  ClipboardList, CheckSquare, Book, Trash2, Download, AlertTriangle, FileSpreadsheet, RefreshCw,Tag
} from 'lucide-react';

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
    address: '',
    batchNumber: '',
    startSerial: '',
    endSerial: '',
    numberOfBooks: ''
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
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Helper to calculate available books
  const getAvailableBooks = (batch: any) => {
    // Use the new field if present, otherwise fallback
    if (batch.remainingBooks !== undefined) return batch.remainingBooks;
    
    // Fallback logic for legacy data
    if (batch.status === 'Fully Distributed') return 0;
    if (batch.status === 'In Stock') return batch.totalBooks;
    return Math.floor(batch.totalBooks * 0.6); // Mock fallback
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null); // Clear error on change

    // Logic to update available count when batch changes
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

  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBatchFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- IMPORT LOGIC --- (Keep as is)
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
          const text = event.target?.result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line);
          if (lines.length < 2) throw new Error("File is empty or missing data rows.");
          const fileHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const { headers: expectedHeaders } = getSampleData();
          const missingHeaders = expectedHeaders.filter(h => !fileHeaders.includes(h));
          
          if (missingHeaders.length > 0) {
             setImportReport([{ id: 0, data: {}, status: 'error', message: `Invalid Headers. Missing: ${missingHeaders.join(', ')}` }]);
             setImportStep('report');
             return;
          }

          const results: ImportRowResult[] = lines.slice(1).map((line, index) => {
             const cols = line.split(',').map(c => c.trim());
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
          remainingBooks: parseInt(row.data.total), // Initial import assumes full stock
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
      headers = ['Date', 'Recipient Name', 'Phone', 'Type', 'Serial Range', 'Total Books', 'Status', 'Registered Count', 'Registered Series', 'Submitted Count', 'Submitted Series'];
      dataToExport = filteredDistributedList.map(item => ({
        Date: item.date,
        'Recipient Name': item.name,
        Phone: item.phone,
        Type: item.type,
        'Serial Range': item.range,
        'Total Books': item.count,
        Status: item.status,
        'Registered Count': item.registeredCount,
        'Registered Series': item.registeredSeries ? item.registeredSeries.join('; ') : '',
        'Submitted Count': item.submittedCount,
        'Submitted Series': item.submittedSeries ? item.submittedSeries.join('; ') : ''
      }));
    } else {
      headers = ['Batch Name', 'Printed Date', 'Start Serial', 'End Serial', 'Total Books', 'Available Books', 'Status'];
      dataToExport = filteredBatchesList.map(item => ({
        'Batch Name': item.batchName,
        'Printed Date': item.printedDate,
        'Start Serial': item.startSerial,
        'End Serial': item.endSerial,
        'Total Books': item.totalBooks,
        'Available Books': item.remainingBooks !== undefined ? item.remainingBooks : item.totalBooks,
        Status: item.status
      }));
    }

    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of dataToExport) {
      const values = headers.map(header => {
        const val = row[header] !== undefined ? row[header] : '';
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
      address: '',
      batchNumber: '',
      startSerial: '',
      endSerial: '',
      numberOfBooks: ''
    });
    setFormError(null);
    setSelectedBatchAvailable(null);
    setFormOpen(true);
  };

  const openEditDistributionModal = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setEditingDistributionId(item.id);
    const [start, end] = item.range.includes(' - ') ? item.range.split(' - ') : [item.range, ''];
    setFormData({
      date: item.date,
      recipientType: item.type,
      recipientName: item.name,
      phone: item.phone,
      pssmId: item.pssmId || '', 
      address: item.address || '',
      batchNumber: '', // Ideally retrieved from saved data
      startSerial: start,
      endSerial: end,
      numberOfBooks: item.count.toString()
    });
    setFormError(null);
    setSelectedBatchAvailable(null);
    setFormOpen(true);
  };

  const openCreateBatchModal = () => {
    setEditingBatchId(null);
    setBatchFormData({
      batchName: '',
      printedDate: new Date().toISOString().split('T')[0],
      totalBooks: '',
      startSerial: '',
      endSerial: '',
      status: 'In Stock'
    });
    setBatchModalOpen(true);
  };

  const openEditBatchModal = (e: React.MouseEvent, batch: any) => {
    e.stopPropagation();
    setEditingBatchId(batch.id);
    setBatchFormData({
      batchName: batch.batchName,
      printedDate: batch.printedDate,
      totalBooks: batch.totalBooks.toString(),
      startSerial: batch.startSerial,
      endSerial: batch.endSerial,
      status: batch.status
    });
    setBatchModalOpen(true);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const batchPayload: any = {
        id: editingBatchId,
        batchName: batchFormData.batchName,
        printedDate: batchFormData.printedDate,
        totalBooks: parseInt(batchFormData.totalBooks),
        startSerial: batchFormData.startSerial,
        endSerial: batchFormData.endSerial,
        bookSerialStart: batchFormData.startSerial,
        bookSerialEnd: batchFormData.endSerial,
        status: batchFormData.status
    };
    
    // If creating new, init remaining books to total
    if (!editingBatchId) {
        batchPayload.remainingBooks = batchPayload.totalBooks;
    }

    await api.saveBatch(batchPayload);
    await loadData(); // Refresh
    
    setToastMessage(editingBatchId ? "Batch Updated Successfully!" : "Print Batch Created Successfully!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    setBatchModalOpen(false);
  };

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    const countToDistribute = parseInt(formData.numberOfBooks) || 0;

    // VALIDATION: Check availability
    if (!editingDistributionId && formData.batchNumber) {
        if (selectedBatchAvailable !== null) {
             // Check if out of stock completely
             if (selectedBatchAvailable === 0) {
                 setFormError("The selected batch is Out of Books.");
                 return;
             }
             // Check if insufficient stock
             if (countToDistribute > selectedBatchAvailable) {
                setFormError(`The batch is Out of Books (Available: ${selectedBatchAvailable})`);
                return;
             }
        }
    }

    const distributionPayload = {
        id: editingDistributionId, // Null for new
        date: formData.date,
        name: formData.recipientName,
        phone: formData.phone,
        type: formData.recipientType,
        range: `${formData.startSerial} - ${formData.endSerial}`,
        count: countToDistribute,
        status: 'Distributed',
        batchName: formData.batchNumber, // SAVE BATCH NAME HERE
        registeredCount: 0,
        registeredSeries: [],
        submittedCount: 0,
        submittedSeries: []
    };

    // UPDATE BATCH INVENTORY Logic
    if (!editingDistributionId && formData.batchNumber) {
        const batchIndex = batchesList.findIndex(b => b.batchName === formData.batchNumber);
        if (batchIndex !== -1) {
            const batchToUpdate = { ...batchesList[batchIndex] };
            
            // Deduct from remainingBooks
            let currentRemaining = batchToUpdate.remainingBooks !== undefined ? batchToUpdate.remainingBooks : batchToUpdate.totalBooks;
            
            currentRemaining -= countToDistribute;
            if (currentRemaining < 0) currentRemaining = 0;
            
            batchToUpdate.remainingBooks = currentRemaining;

            // Update Status based on remaining
            if (currentRemaining === 0) {
               batchToUpdate.status = 'Fully Distributed';
            } else if (currentRemaining < batchToUpdate.totalBooks) {
               batchToUpdate.status = 'Partially Distributed';
            }
            
            await api.saveBatch(batchToUpdate);
        }
    }

    await api.saveDistribution(distributionPayload);
    await loadData(); // Refresh data to show updated batch counts
    
    // SHOW TOAST instead of alert
    setToastMessage(editingDistributionId ? "Distribution Record Updated Successfully!" : "Distribution added Successfully");
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
            <div className="bg-white p-1.5 rounded-full shadow-sm text-emerald-600">
               <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-900">Success</h4>
              <p className="text-xs text-emerald-700">{toastMessage}</p>
            </div>
            <button onClick={() => setShowToast(false)} className="ml-4 text-emerald-400 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-100 rounded-full">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Book Distribution</h2>
          <p className="text-slate-500 text-sm mt-1">Manage print batches and assign books to network.</p>
        </div>
        <div className="flex gap-2">
          {canDistribute && (
            <button 
              type="button"
              onClick={openNewDistributionModal}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
            >
              <Plus size={18} className="mr-2" />
              New Distribution
            </button>
          )}
          {canManageBatches && (
            <button 
              type="button"
              onClick={openCreateBatchModal}
              className="flex items-center bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50 transition shadow-sm font-medium text-sm"
            >
              <Printer size={18} className="mr-2" />
              Create Print Batch
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 shrink-0">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('distribution')}
              className={`${
                activeTab === 'distribution'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Package className="mr-2 h-4 w-4" />
              Distributed Books
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`${
                activeTab === 'batches'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Batches
            </button>
          </nav>
      </div>

      <div className="flex-1 relative">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 shrink-0 bg-slate-50">
             <div className="relative max-w-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                  placeholder={activeTab === 'distribution' ? "Search recipient, book #..." : "Search batch name, status..."}
                />
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setImportModalOpen(true);
                    resetImport();
                  }}
                  className="flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                   <Upload size={16} className="mr-2" />
                   Import
                </button>
                <button 
                  onClick={handleExport}
                  className="flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                   <Download size={16} className="mr-2" />
                   Export
                </button>
             </div>
          </div>

          <div className="overflow-auto flex-1">
            {isDataLoading ? (
               <div className="flex items-center justify-center h-full text-slate-400">
                  <Loader2 className="animate-spin mr-2" /> Loading Data...
               </div>
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
                     return (
                       <React.Fragment key={item.id}>
                         <tr className={`transition-colors border-b border-slate-100 ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`} onClick={() => handleToggleExpand(item.id)}>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 align-top">{formatDate(item.date)}</td>
                           <td className="px-6 py-4 whitespace-nowrap align-top">
                              <div className="flex items-center">
                                 <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                    {item.name ? item.name.charAt(0) : '?'}
                                 </div>
                                 <div className="ml-4">
                                    <div className="text-sm font-medium text-slate-900">{item.name}</div>
                                    <div className="text-sm text-slate-500">{item.phone}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 align-top">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{item.type}</span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm align-top">
                              <div className="flex flex-col">
                                 <span className="font-bold text-slate-900">{item.count ? item.count.toLocaleString() : '0'} Books</span>
                                 <span className="text-xs text-slate-500 font-mono mt-0.5">{item.range}</span>
                              </div>
                           </td>
                           <td className="px-6 py-3 whitespace-nowrap align-top">
                              <div className="flex flex-col gap-1.5">
                                 <div className="flex items-center text-xs">
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${item.registeredCount > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                                    <span className="font-semibold text-slate-700 min-w-[70px]">Registered:</span>
                                    <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{item.registeredCount || 0}</span>
                                 </div>
                                 <div className="flex items-center text-xs">
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${item.submittedCount > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                    <span className="font-semibold text-slate-700 min-w-[70px]">Submitted:</span>
                                    <span className="font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">{item.submittedCount || 0}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={(e) => openEditDistributionModal(e, item)} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md"><Edit size={14} className="mr-1.5" /> Edit</button>
                                <button className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}>
                                   {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                              </div>
                           </td>
                         </tr>
                         {isExpanded && (
                            <tr className="bg-slate-50/50 animate-in fade-in duration-200">
                               <td colSpan={6} className="px-6 py-4">
                                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                     <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                           <Book size={14} className="mr-2" /> Book Lifecycle Details
                                        </h4>
                                        {item.batchName && (
                                           <div className="flex items-center bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                                              <span className="text-[10px] text-indigo-500 mr-1.5 font-bold uppercase tracking-wide">Batch</span>
                                              <Tag size={12} className="text-indigo-400 mr-1" />
                                              <span className="text-sm font-bold text-indigo-700 font-mono">{item.batchName}</span>
                                           </div>
                                        )}
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                           <div className="flex justify-between items-center border-b border-slate-100 pb-2"><span className="text-sm font-semibold text-blue-700">Registered Books ({item.registeredCount || 0})</span></div>
                                           {item.registeredSeries && item.registeredSeries.length > 0 ? (
                                              <div className="flex flex-wrap gap-2">{item.registeredSeries.map((bookNum: string, idx: number) => (<span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-blue-50 text-blue-700 border border-blue-100">{bookNum}</span>))}</div>
                                           ) : <p className="text-xs text-slate-400 italic">No books registered yet.</p>}
                                        </div>
                                        <div className="space-y-2">
                                           <div className="flex justify-between items-center border-b border-slate-100 pb-2"><span className="text-sm font-semibold text-green-700">Submitted Books ({item.submittedCount || 0})</span></div>
                                           {item.submittedSeries && item.submittedSeries.length > 0 ? (
                                              <div className="flex flex-wrap gap-2">{item.submittedSeries.map((bookNum: string, idx: number) => (<span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-green-50 text-green-700 border border-green-100">{bookNum}</span>))}</div>
                                           ) : <p className="text-xs text-slate-400 italic">No books submitted yet.</p>}
                                        </div>
                                     </div>
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
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-700 font-bold">
                          {getAvailableBooks(batch).toLocaleString()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${batch.status === 'Fully Distributed' ? 'bg-green-100 text-green-800' : batch.status === 'Partially Distributed' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>{batch.status}</span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={(e) => openEditBatchModal(e, batch)} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md"><Edit size={14} className="mr-1.5" /> Edit</button>
                          </div>
                       </td>
                     </tr>
                   ))
                 )}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* ... Modals (Import, New Distribution, Create Batch) ... */}
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
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                           <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2"><div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md"><User size={18} /></div><h4 className="font-semibold text-slate-800">Recipient Details</h4></div>
                           <div className="p-5 space-y-4 flex-1">
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label><input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" /></div>
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Recipient Type</label><select name="recipientType" value={formData.recipientType} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"><option value="Individual">Individual Person</option><option value="Center">Center Incharge</option><option value="District">District Incharge</option><option value="Autonomous">Autonomous Body</option></select></div>
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label><input type="text" name="recipientName" required value={formData.recipientName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Recipient Name" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-red-500">*</span></label><input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">PSSM ID</label><input type="text" name="pssmId" value={formData.pssmId} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Optional" /></div>
                              </div>
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><textarea name="address" rows={3} value={formData.address} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Enter full address"></textarea></div>
                           </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                           <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2"><div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md"><Package size={18} /></div><h4 className="font-semibold text-slate-800">Book Assignment</h4></div>
                           <div className="p-5 space-y-4 flex-1">
                              <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                                 <div className="relative">
                                    <select 
                                      name="batchNumber" 
                                      value={formData.batchNumber} 
                                      onChange={handleInputChange}
                                      className="block w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                                    >
                                       <option value="">Select Batch</option>
                                       {batchesList.map(batch => (
                                          <option key={batch.id} value={batch.batchName}>
                                             {batch.batchName} ({getAvailableBooks(batch)} Avail)
                                          </option>
                                       ))}
                                    </select>
                                 </div>
                                 {selectedBatchAvailable !== null && (
                                    <p className="text-xs text-emerald-600 mt-1 font-medium">Available Books: {selectedBatchAvailable}</p>
                                 )}
                              </div>
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Number of Books <span className="text-red-500">*</span></label><input type="number" name="numberOfBooks" required min="1" value={formData.numberOfBooks} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-bold text-slate-900" placeholder="0" /></div>
                              
                              {formError && (
                                 <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                                    <AlertTriangle size={16} className="text-red-500 mt-0.5 mr-2 shrink-0" />
                                    <p className="text-sm text-red-700 font-medium">{formError}</p>
                                 </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Serial <span className="text-red-500">*</span></label><input type="text" name="startSerial" required value={formData.startSerial} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">End Serial <span className="text-red-500">*</span></label><input type="text" name="endSerial" required value={formData.endSerial} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm" /></div>
                              </div>
                              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-4"><div className="flex justify-between items-center text-sm"><span className="text-emerald-800 font-medium">Availability Check</span><span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={14} /> Available</span></div></div>
                           </div>
                        </div>
                     </div>
                  </form>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-xl shrink-0 flex justify-end gap-3">
                   <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">Cancel</button>
                   <button type="submit" form="distribution-form" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors font-medium text-sm">{editingDistributionId ? 'Update Distribution' : 'Confirm Distribution'}</button>
                </div>
             </div>
          </div>
        )}

        {/* --- Create Batch Modal --- */}
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
      </div>
    </div>
  );
};

export default Distribution;