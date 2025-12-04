
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { api } from '../services/api';
import { 
  Plus, User, X, CheckCircle, 
  Printer, Package, AlertTriangle, ChevronDown, ArrowUpDown, RefreshCw
} from 'lucide-react';

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

interface AddDistributionProps {
  role: UserRole;
  isModal?: boolean;
  editData?: any;
  editType?: 'distribution' | 'batch';
  onClose?: () => void;
  onSuccess?: () => void;
}

type Tab = 'new_distribution' | 'create_batch';

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
  
  const canManageBatches = role === UserRole.SUPER_ADMIN || role === UserRole.BOOK_DISTRIBUTOR;
  
  const [activeTab, setActiveTab] = useState<Tab>(
    (isModal && editType === 'batch') || (locationState?.type === 'batch') 
      ? 'create_batch' 
      : 'new_distribution'
  );
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any>({});
  
  const [selectedBatchAvailable, setSelectedBatchAvailable] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Form States ---
  const [location, setLocation] = useState({ state: '', district: '', town: '', center: '' });
  const [bookChips, setBookChips] = useState<string[]>([]);
  const [tempSerial, setTempSerial] = useState({ start: '', end: '', single: '' });

  const initialFormData = {
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
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editingDistributionId, setEditingDistributionId] = useState<number | null>(null);

  const initialBatchFormData = {
    batchName: '',
    printedDate: new Date().toISOString().split('T')[0],
    totalBooks: '',
    startSerial: '',
    endSerial: '',
    status: 'In Stock'
  };

  const [batchFormData, setBatchFormData] = useState(initialBatchFormData);
  const [editingBatchId, setEditingBatchId] = useState<number | string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const [batchData, locData] = await Promise.all([
             api.getBatches(),
             api.getLocations()
        ]);
        setBatchesList(batchData);
        setLocationData(locData);
    } catch (e) {
        console.error("Failed to load data");
    }
  };

  // Handle passed props or location state for editing
   useEffect(() => {
    if (isModal && editData) {
        if (editType === 'distribution') {
            handleEditDistribution(editData);
        } else if (editType === 'batch') {
            handleEditBatch(editData);
        }
    } else if (locationState) {
        if (locationState.type === 'distribution' && locationState.data) {
            handleEditDistribution(locationState.data);
            setActiveTab('new_distribution');
        } else if (locationState.type === 'batch' && locationState.data) {
            handleEditBatch(locationState.data);
            setActiveTab('create_batch');
        }
    }
  }, [locationState, isModal, editData, editType, batchesList]); 

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
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm disabled:bg-slate-50 disabled:text-slate-400"
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
                            e.preventDefault(); 
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

  const getAvailableBooks = (batch: any) => {
    if (batch.remainingBooks !== undefined) return batch.remainingBooks;
    if (batch.status === 'Fully Distributed') return 0;
    if (batch.status === 'In Stock') return batch.totalBooks;
    return Math.floor(batch.totalBooks * 0.6);
  };
  
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
        books.push({ number: bookNum, status: 'Distributed' });
    }
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
      } else {
        setSelectedBatchAvailable(null);
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
  
  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBatchFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditDistribution = (item: any) => {
    setEditingDistributionId(item.id);
    
    const addrParts = (item.address || '').split(',').map((s: string) => s.trim());
    let center = '', town = '', district = '', state = '';

    if (addrParts.length >= 4) {
        center = addrParts[0]; town = addrParts[1]; district = addrParts[2]; state = addrParts[3];
    } else {
        town = addrParts[0] || ''; district = addrParts[1] || ''; state = addrParts[2] || '';
    }

    setLocation({ state, district, town, center });
    setBookChips(item.bookChips || []); 
    
    if ((!item.bookChips || item.bookChips.length === 0) && item.range) {
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
  };

  const handleEditBatch = (batch: any) => {
    setEditingBatchId(batch.id);
    setBatchFormData({ 
        batchName: batch.batchName, 
        printedDate: batch.printedDate, 
        totalBooks: batch.totalBooks.toString(), 
        startSerial: batch.startSerial, 
        endSerial: batch.endSerial, 
        status: batch.status 
    });
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
            setFormError(`The batch is Out of Books (Available: ${selectedBatchAvailable})`);
            return;
        }
    }

    const finalAddress = `${location.center ? location.center + ', ' : ''}${location.town}, ${location.district}, ${location.state}`;
    const sortedChips = [...bookChips].sort();
    const rangeString = sortedChips.length > 0 
        ? (sortedChips.length > 1 ? `${sortedChips[0]} - ${sortedChips[sortedChips.length-1]}` : sortedChips[0])
        : '-';

    const distributionPayload = {
        id: editingDistributionId, 
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
        bookChips: bookChips,
        registeredCount: 0,
        submittedCount: 0
    };
    
    // Batch Stock Update
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
    
    if (isModal && onSuccess) { onSuccess(); return; }

    setToastMessage(editingDistributionId ? "Distribution Updated!" : "Distribution Added Successfully!");
    setShowToast(true);
    
    // Reset Form for next entry
    if (!editingDistributionId) {
       setFormData(initialFormData);
       setBookChips([]);
       setLocation({ state: '', district: '', town: '', center: '' });
    }

    setTimeout(() => {
        setShowToast(false);
        // Navigate back or stay based on workflow. Let's stay to allow multiple entries easily.
    }, 3000);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...batchFormData, id: editingBatchId, totalBooks: parseInt(String(batchFormData.totalBooks)) };
    if (!editingBatchId) payload.remainingBooks = payload.totalBooks;
    await api.saveBatch(payload);
    
    if (isModal && onSuccess) { onSuccess(); return; }

    setToastMessage("Batch Saved Successfully!"); 
    setShowToast(true); 
    
    if (!editingBatchId) {
        setBatchFormData(initialBatchFormData);
    }

    setTimeout(() => {
        setShowToast(false);
    }, 3000);
  };

  const handleCancel = () => {
    if (isModal && onClose) { onClose(); return; }
    navigate('/distribution');
  };

  return (
    <div className={`space-y-6 relative h-full flex flex-col ${isModal ? '' : ''}`}>
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

      {!isModal && (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div><h2 className="text-2xl font-bold text-slate-800">Add Distribution</h2><p className="text-slate-500 text-sm mt-1">Create new distributions or print batches.</p></div>
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
                    <button onClick={() => setActiveTab('new_distribution')} className={`${activeTab === 'new_distribution' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}><Plus className="mr-2 h-4 w-4" /> New Distribution</button>
                    {canManageBatches && <button onClick={() => setActiveTab('create_batch')} className={`${activeTab === 'create_batch' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}><Printer className="mr-2 h-4 w-4" /> Create Print Batch</button>}
                </nav>
            </div>
        </>
      )}

      <div className={`flex-1 relative ${!isModal ? 'mt-4' : ''}`}>
        {activeTab === 'new_distribution' && (
            <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${!isModal ? 'max-w-5xl mx-auto' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                   <div><h3 className="text-xl font-bold text-slate-800">{editingDistributionId ? 'Edit Distribution' : 'New Distribution'}</h3><p className="text-sm text-slate-500">Assign books to an individual or center.</p></div>
                   <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                <form id="distribution-form" onSubmit={handleDistribute}>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full relative">
                           <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 rounded-t-xl"><div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md"><User size={18} /></div><h4 className="font-semibold text-slate-800">Recipient Details</h4></div>
                           <div className="p-5 space-y-4 flex-1 relative z-20">
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Distribution Date</label><input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm" /></div>
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Incharge Type</label><select name="recipientType" value={formData.recipientType} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"><option value="Individual">Individual Person</option><option value="Center">Center Incharge</option><option value="District">District Incharge</option><option value="Autonomous">Autonomous Body</option></select></div>
                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label><input type="text" name="recipientName" required value={formData.recipientName} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Recipient Name" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-red-500">*</span></label><input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">PSSM ID</label><input type="text" name="pssmId" value={formData.pssmId} onChange={handleInputChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Optional" /></div>
                              </div>
                              
                              <div className="space-y-3 pt-2 border-t border-slate-100 mt-2">
                                  <h5 className="text-xs font-bold text-slate-500 uppercase">Location</h5>
                                  <SearchableSelect label="State" value={location.state} options={Object.keys(locationData)} onChange={(val) => setLocation({ state: val, district: '', town: '', center: '' })} placeholder="Select State" />
                                  <SearchableSelect label="District" value={location.district} options={location.state ? Object.keys(locationData[location.state] || {}) : []} onChange={(val) => setLocation(prev => ({ ...prev, district: val, town: '', center: '' }))} placeholder="Select District" disabled={!location.state} />
                                  <SearchableSelect label="Town / Mandal" value={location.town} options={location.district ? (Object.keys(locationData[location.state]?.[location.district] || {})) : []} onChange={(val) => setLocation(prev => ({ ...prev, town: val, center: '' }))} placeholder="Select Town" disabled={!location.district} />
                                  <SearchableSelect label="Center" value={location.center} options={location.town ? (locationData[location.state]?.[location.district]?.[location.town] || []) : []} onChange={(val) => setLocation(prev => ({ ...prev, center: val }))} placeholder="Select Center" disabled={!location.town} />
                              </div>
                           </div>
                        </div>

                        {/* Book Assignment Card */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full relative z-10">
                           <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 rounded-t-xl"><div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md"><Package size={18} /></div><h4 className="font-semibold text-slate-800">Book Assignment</h4></div>
                           <div className="p-5 space-y-4 flex-1">
                              <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                                 <select name="batchNumber" value={formData.batchNumber} onChange={handleInputChange} className="block w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white">
                                    <option value="">Select Batch</option>
                                    {batchesList.map(batch => <option key={batch.id} value={batch.batchName}>{batch.batchName} ({getAvailableBooks(batch)} Avail)</option>)}
                                 </select>
                                 {selectedBatchAvailable !== null && <p className="text-xs text-emerald-600 mt-1 font-medium">Available Books: {selectedBatchAvailable}</p>}
                              </div>
                              
                              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <h5 className="text-xs font-bold text-slate-700 uppercase">Add Books</h5>
                                  <div className="flex gap-2 items-end">
                                      <div className="flex-1"><label className="text-[10px] text-slate-500 block mb-1">Start Serial</label><input type="text" value={tempSerial.start} onChange={e => setTempSerial({...tempSerial, start: e.target.value})} className="w-full text-xs p-1.5 border rounded font-mono" /></div>
                                      <div className="flex-1"><label className="text-[10px] text-slate-500 block mb-1">End Serial</label><input type="text" value={tempSerial.end} onChange={e => setTempSerial({...tempSerial, end: e.target.value})} className="w-full text-xs p-1.5 border rounded font-mono" /></div>
                                      <button type="button" onClick={handleAddBookRange} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700"><Plus size={16} /></button>
                                  </div>
                                  <div className="flex gap-2 items-end border-t border-slate-200 pt-2">
                                      <div className="flex-1"><label className="text-[10px] text-slate-500 block mb-1">Single Book #</label><input type="text" value={tempSerial.single} onChange={e => setTempSerial({...tempSerial, single: e.target.value})} className="w-full text-xs p-1.5 border rounded font-mono" /></div>
                                      <button type="button" onClick={handleAddSingleBook} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700"><Plus size={16} /></button>
                                  </div>
                              </div>

                              <div className="min-h-[60px] p-2 border border-slate-200 rounded-lg bg-slate-50">
                                  <p className="text-xs text-slate-500 mb-2">Selected Books ({bookChips.length})</p>
                                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                      {bookChips.length === 0 && <span className="text-xs text-slate-400 italic">No books added</span>}
                                      {bookChips.map(book => (<span key={book} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border border-slate-300 text-slate-700 shadow-sm font-mono">{book}<button type="button" onClick={() => handleRemoveBook(book)} className="ml-1 text-slate-400 hover:text-red-500"><X size={12} /></button></span>))}
                                  </div>
                              </div>

                              <div><label className="block text-sm font-medium text-slate-700 mb-1">Total Count</label><input type="text" readOnly value={bookChips.length} className="block w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-500 font-bold" /></div>
                              {formError && <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start"><AlertTriangle size={16} className="text-red-500 mt-0.5 mr-2 shrink-0" /><p className="text-sm text-red-700 font-medium">{formError}</p></div>}
                           </div>
                        </div>
                     </div>
                     <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-xl shrink-0 flex justify-end gap-3 mt-4">
                        <button type="button" onClick={handleCancel} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors font-medium text-sm">{editingDistributionId ? 'Update Distribution' : 'Add Distribution'}</button>
                     </div>
                  </form>
            </div>
        )}
        
        {activeTab === 'create_batch' && (
            <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${!isModal ? 'max-w-2xl mx-auto' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">{editingBatchId ? 'Edit Print Batch' : 'Create Print Batch'}</h3>
                    <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
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
                   <div className="pt-4 flex justify-end gap-3">
                       <button type="button" onClick={handleCancel} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">Cancel</button>
                       <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{editingBatchId ? 'Update Batch' : 'Add Batch'}</button>
                   </div>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

export default AddDistribution;
