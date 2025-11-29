import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, BookOpen, AlertCircle, Upload, Plus, Search, 
  CheckCircle, Download, FileText, Edit2, Loader2, Phone, MapPin,
  ChevronDown, ChevronUp, Calendar, Package, X, User, Edit, FileSpreadsheet, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { getInchargeBooks } from '../services/mockData';
import { BulkImportResult } from '../types';

// Mock Data Generator for Assignments
const generateMockAssignments = () => {
  return [
    {
      id: 1,
      date: '2023-10-28',
      distributorName: 'Suresh Rao',
      phone: '+91 98765 43210',
      totalBooks: 50,
      batchName: 'HYD-NOV-23',
      books: Array.from({ length: 50 }, (_, i) => {
        const isRegistered = i % 3 === 0;
        const serial = `A${1000 + i}`;
        return {
            serial: serial,
            status: isRegistered ? 'Registered' : 'Pending',
            // Add details for pre-registered mock data
            details: isRegistered ? {
                bookNumber: serial,
                recipientName: `Existing User ${i}`,
                phone: '+91 98765 43210',
                pssmId: `PSSM-${1000+i}`,
                date: '2023-10-28',
                address: 'Hyderabad, Telangana',
                registeredBy: 'Distributor'
            } : null
        };
      })
    },
    {
      id: 2,
      date: '2023-10-25',
      distributorName: 'Ramesh Gupta',
      phone: '+91 98765 11111',
      totalBooks: 30,
      batchName: 'BLR-OCT-23',
      books: Array.from({ length: 30 }, (_, i) => {
        const isRegistered = i < 10;
        const serial = `B${2000 + i}`;
        return {
            serial: serial,
            status: isRegistered ? 'Registered' : 'Pending',
            details: isRegistered ? {
                bookNumber: serial,
                recipientName: `Existing User ${i}`,
                phone: '+91 98765 11111',
                pssmId: `PSSM-${2000+i}`,
                date: '2023-10-25',
                address: 'Bangalore, Karnataka',
                registeredBy: 'Distributor'
            } : null
        };
      })
    }
  ];
};

const BookRegister: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'bulk' | 'books'>('inventory');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);

  // Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editingBookSerial, setEditingBookSerial] = useState<string | null>(null);
  
  // Details Modal State
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [selectedBookDetails, setSelectedBookDetails] = useState<any>(null);

  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    booksCount: 1,
    startSerial: '',
    pssmId: ''
  });
  const [registerStatus, setRegisterStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Bulk Upload States
  const [bulkFormData, setBulkFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distributorName: '',
    distributorPhone: '',
    batchName: '', // Added Batch Name
    totalBooks: '',
    registeredBooks: '',
    pendingBooks: ''
  });
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [importResults, setImportResults] = useState<BulkImportResult[]>([]);
  const [parsedBulkData, setParsedBulkData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      // Simulate loading books
      setTimeout(() => {
          setBooks(getInchargeBooks());
          setAssignments(generateMockAssignments());
          setLoading(false);
      }, 500);
    };
    loadData();
  }, []);

  const handleToggleExpand = (id: number) => {
    setExpandedAssignmentId(expandedAssignmentId === id ? null : id);
  };

  const handleBookClick = (book: any) => {
    if (book.status === 'Registered') {
        if (book.details) {
            setSelectedBookDetails(book.details);
            setViewDetailsModalOpen(true);
        }
        return;
    }
    
    // Open Modal for New Registration
    setFormData({ 
        name: '',
        phone: '',
        address: '',
        booksCount: 1,
        startSerial: book.serial,
        pssmId: ''
    });
    setEditingBookSerial(null);
    setRegisterModalOpen(true);
    setRegisterStatus('idle');
  };

  const handleEditClick = (details: any) => {
     setFormData({
        name: details.recipientName,
        phone: details.phone,
        address: details.address,
        booksCount: 1,
        startSerial: details.bookNumber,
        pssmId: details.pssmId === 'N/A' ? '' : details.pssmId
     });
     setEditingBookSerial(details.bookNumber);
     setRegisterModalOpen(true);
     setRegisterStatus('idle');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterStatus('saving');
    await api.registerRecipient(formData);
    
    const currentDate = new Date().toLocaleDateString();
    
    setAssignments(prev => prev.map(assign => ({
        ...assign,
        books: assign.books.map((b: any) => 
            b.serial === formData.startSerial ? { 
                ...b, 
                status: 'Registered',
                details: {
                    bookNumber: formData.startSerial,
                    recipientName: formData.name,
                    phone: formData.phone,
                    pssmId: formData.pssmId || 'N/A',
                    date: b.details?.date || currentDate, // Keep original date if editing
                    address: formData.address,
                    registeredBy: b.details?.registeredBy || 'You'
                }
            } : b
        )
    })));

    setRegisterStatus('success');

    // Show Toast
    setToastMessage("Register Successful");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Close after delay
    setTimeout(() => {
       setRegisterModalOpen(false);
       setRegisterStatus('idle');
       setFormData({ name: '', phone: '', address: '', booksCount: 1, startSerial: '', pssmId: '' });
       setEditingBookSerial(null);
    }, 2000);
  };

  // --- BULK UPLOAD LOGIC ---

  const downloadBulkTemplate = () => {
    const headers = ['Registration Date', 'Book Number', 'Recipent Name', 'Phone Number', 'PSSm ID', 'Address', 'Book Status'];
    const sampleRow = ['2023-10-30', 'A5001', 'Rajesh Kumar', '9876543210', 'PSSM-123', 'Hyderabad', 'Registered'];
    
    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inward_stock_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('analyzing');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      setTimeout(() => {
        try {
          const text = event.target?.result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line);
          
          if (lines.length < 2) throw new Error("File is empty");

          const headers = lines[0].split(',').map(h => h.trim());
          const requiredHeaders = ['Registration Date', 'Book Number', 'Recipent Name', 'Phone Number', 'PSSm ID', 'Address', 'Book Status'];
          
          // Validate Headers
          const missing = requiredHeaders.filter(h => !headers.includes(h));
          if (missing.length > 0) {
            alert(`Invalid Template. Missing: ${missing.join(', ')}`);
            setUploadStatus('idle');
            return;
          }

          // Parse Data
          const parsedData = lines.slice(1).map((line, idx) => {
            const cols = line.split(',');
            return {
              date: cols[0],
              serial: cols[1],
              name: cols[2],
              phone: cols[3],
              pssmId: cols[4],
              address: cols[5],
              status: cols[6]?.trim() // Expected 'Registered' or 'Pending'
            };
          });

          setParsedBulkData(parsedData);
          
          // Auto-calc stats for form
          const total = parsedData.length;
          const reg = parsedData.filter(d => d.status === 'Registered').length;
          
          setBulkFormData(prev => ({
            ...prev,
            totalBooks: total.toString(),
            registeredBooks: reg.toString(),
            pendingBooks: (total - reg).toString()
          }));

          setUploadStatus('done'); // Ready to submit

        } catch (err) {
          console.error(err);
          alert("Error parsing file");
          setUploadStatus('idle');
        }
      }, 1000);
    };
    
    reader.readAsText(file);
  };

  const handleBulkProcess = () => {
     if (!bulkFormData.distributorName) {
       alert("Please enter Distributor Name");
       return;
     }

     // Create new assignment object matching existing structure
     const newAssignment = {
        id: Date.now(),
        date: bulkFormData.date,
        distributorName: bulkFormData.distributorName,
        phone: bulkFormData.distributorPhone,
        totalBooks: parseInt(bulkFormData.totalBooks) || 0,
        batchName: bulkFormData.batchName || ('BULK-IMPORT-' + new Date().getMonth()), // Use input or fallback
        books: parsedBulkData.map(item => ({
            serial: item.serial,
            status: item.status === 'Registered' ? 'Registered' : 'Pending',
            details: item.status === 'Registered' ? {
               bookNumber: item.serial,
               recipientName: item.name,
               phone: item.phone,
               pssmId: item.pssmId,
               date: item.date,
               address: item.address,
               registeredBy: 'Bulk Upload'
            } : null
        }))
     };

     // Add to State (Updates both Inward Stock & History views)
     setAssignments(prev => [newAssignment, ...prev]);
     
     setToastMessage("File import Successfully");
     setShowToast(true);
     setTimeout(() => setShowToast(false), 3000);

     // Reset but Stay on page
     setUploadStatus('idle');
     setParsedBulkData([]);
     setBulkFormData({ 
        date: new Date().toISOString().split('T')[0], 
        distributorName: '', 
        distributorPhone: '', 
        batchName: '',
        totalBooks: '', 
        registeredBooks: '', 
        pendingBooks: '' 
     });
     if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) return <div className="p-8 text-center text-slate-400 flex flex-col items-center"><Loader2 className="animate-spin mb-2" />Loading Register...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[110] animate-in slide-in-from-right duration-300">
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

      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Book Registration</h2>
            <p className="text-slate-500 text-sm">Manage incoming stock and register outgoing books.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
         <div className="border-b border-slate-200">
           <nav className="flex -mb-px">
             <button onClick={() => setActiveTab('inventory')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
               Inward Stock & Register
             </button>
             <button onClick={() => setActiveTab('bulk')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'bulk' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
               Bulk Upload
             </button>
             <button onClick={() => setActiveTab('books')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'books' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
               Registration History
             </button>
           </nav>
         </div>

         <div className="p-6">
            
            {/* --- Inventory Tab with Accordion --- */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Recent Books Assigned By Distributor</h3>
                    <button 
                       onClick={() => { setFormData({ name: '', phone: '', address: '', booksCount: 1, startSerial: '', pssmId: '' }); setEditingBookSerial(null); setRegisterModalOpen(true); }}
                       className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    >
                       <Plus size={16} className="mr-1" /> Manual Register
                    </button>
                 </div>
                 
                 <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                       <thead className="bg-slate-50">
                          <tr>
                             <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Distributor Name</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone Number</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Books</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Registered Books</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pending Books</th>
                             <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                          </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-slate-200">
                          {assignments.map((assign) => {
                             const isExpanded = expandedAssignmentId === assign.id;
                             const registeredCount = assign.books.filter((b: any) => b.status === 'Registered').length;
                             const pendingCount = assign.totalBooks - registeredCount;
                             return (
                                <React.Fragment key={assign.id}>
                                   <tr className={`transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`} onClick={() => handleToggleExpand(assign.id)}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 flex items-center gap-2">
                                         <Calendar size={14} className="text-slate-400" />
                                         {new Date(assign.date).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                         {assign.distributorName}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                         {assign.phone}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">
                                         {assign.totalBooks}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                                         {registeredCount}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">
                                         {pendingCount}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right">
                                         <button className="text-slate-400 hover:text-indigo-600">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                         </button>
                                      </td>
                                   </tr>
                                   
                                   {isExpanded && (
                                      <tr>
                                         <td colSpan={7} className="px-6 py-6 bg-slate-50 border-t border-slate-200">
                                            <div className="flex justify-between items-center mb-4">
                                               <h4 className="text-sm font-bold text-slate-700 flex items-center">
                                                  <Package size={16} className="mr-2 text-indigo-500" /> Select Book to Register
                                               </h4>
                                               <div className="flex items-center gap-3">
                                                  <div className="flex items-center text-xs text-slate-500">
                                                     <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-1"></div> Registered
                                                  </div>
                                                  <div className="flex items-center text-xs text-slate-500">
                                                     <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded mr-1"></div> Pending
                                                  </div>
                                                  <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600 ml-4">
                                                     Batch: <span className="font-bold text-indigo-600">{assign.batchName}</span>
                                                  </span>
                                               </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                               {assign.books.map((book: any) => (
                                                  <button
                                                     key={book.serial}
                                                     onClick={(e) => { e.stopPropagation(); handleBookClick(book); }}
                                                     className={`
                                                        text-xs font-mono py-2 rounded border transition-all shadow-sm flex flex-col items-center justify-center
                                                        ${book.status === 'Registered' 
                                                           ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:border-green-300 hover:shadow-md cursor-pointer' 
                                                           : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300 hover:shadow-md active:scale-95 cursor-pointer'
                                                        }
                                                     `}
                                                     title={book.status === 'Registered' ? 'View Details' : 'Register Book'}
                                                  >
                                                     {book.serial}
                                                  </button>
                                               ))}
                                            </div>
                                         </td>
                                      </tr>
                                   )}
                                </React.Fragment>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}

            {/* --- Bulk Upload Tab (Enhanced) --- */}
            {activeTab === 'bulk' && (
              <div className="max-w-5xl mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-slate-800">Bulk Import Recipients</h3>
                       <p className="text-sm text-slate-500">Register new inward stock and update recipient details.</p>
                    </div>
                    <button onClick={downloadBulkTemplate} className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium border border-indigo-200 px-3 py-2 rounded-md hover:bg-indigo-50">
                       <Download size={16} className="mr-2" /> Download Template
                    </button>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    {/* Form Section */}
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Assignment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                          <input 
                             type="date" 
                             value={bulkFormData.date} 
                             onChange={e => setBulkFormData({...bulkFormData, date: e.target.value})}
                             className="block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Distributor Name</label>
                          <input 
                             type="text" 
                             placeholder="Enter Name"
                             value={bulkFormData.distributorName} 
                             onChange={e => setBulkFormData({...bulkFormData, distributorName: e.target.value})}
                             className="block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                          <input 
                             type="tel" 
                             placeholder="Enter Phone"
                             value={bulkFormData.distributorPhone} 
                             onChange={e => setBulkFormData({...bulkFormData, distributorPhone: e.target.value})}
                             className="block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Batch Name</label>
                          <input 
                             type="text" 
                             placeholder="Enter Batch Name"
                             value={bulkFormData.batchName} 
                             onChange={e => setBulkFormData({...bulkFormData, batchName: e.target.value})}
                             className="block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          />
                       </div>
                    </div>

                    {/* Upload Section */}
                    {uploadStatus === 'idle' || uploadStatus === 'uploading' ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors relative">
                           {uploadStatus === 'uploading' ? (
                              <div className="flex flex-col items-center">
                                 <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mb-2" />
                                 <p className="text-slate-500">Processing File...</p>
                              </div>
                           ) : (
                              <>
                                 <input 
                                    type="file" 
                                    accept=".xlsx, .csv" 
                                    onChange={handleBulkFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    ref={fileInputRef}
                                 />
                                 <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Upload size={28} />
                                 </div>
                                 <h4 className="font-semibold text-slate-800">Click to Upload CSV/Excel</h4>
                                 <p className="text-slate-500 text-sm mt-1">Must match the template format.</p>
                              </>
                           )}
                        </div>
                    ) : null}

                    {/* Preview / Done Section */}
                    {uploadStatus === 'done' && (
                       <div className="space-y-4 animate-in fade-in">
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap gap-4 justify-between items-center">
                             <div className="flex gap-6">
                                <div>
                                   <p className="text-xs text-slate-500 uppercase">Total Books</p>
                                   <p className="font-bold text-xl text-slate-900">{bulkFormData.totalBooks}</p>
                                </div>
                                <div>
                                   <p className="text-xs text-slate-500 uppercase">Registered</p>
                                   <p className="font-bold text-xl text-emerald-600">{bulkFormData.registeredBooks}</p>
                                </div>
                                <div>
                                   <p className="text-xs text-slate-500 uppercase">Pending</p>
                                   <p className="font-bold text-xl text-amber-600">{bulkFormData.pendingBooks}</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                   onClick={() => { setUploadStatus('idle'); setParsedBulkData([]); }}
                                   className="px-4 py-2 text-sm text-red-600 bg-white border border-slate-300 rounded-md hover:bg-red-50"
                                >
                                   Discard
                                </button>
                                <button 
                                   onClick={handleBulkProcess}
                                   className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm"
                                >
                                   Confirm & Process Import
                                </button>
                             </div>
                          </div>
                          <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                             <p className="text-sm text-blue-700">
                                <strong className="font-semibold">Note:</strong> This will create a new assignment entry in your "Inward Stock" and "History" tabs with {bulkFormData.totalBooks} books.
                             </p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
            )}

            {/* --- Registration History Tab (Revised) --- */}
            {activeTab === 'books' && (
               <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-slate-800">Book Registration History</h3>
                     <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input type="text" placeholder="Search history..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                     </div>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Distributor Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone Number</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Books</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Registered Books</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pending Books</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                           {assignments.map((assign) => {
                              const isExpanded = expandedAssignmentId === assign.id;
                              const registeredCount = assign.books.filter((b: any) => b.status === 'Registered').length;
                              const pendingCount = assign.totalBooks - registeredCount;
                              
                              return (
                                 <React.Fragment key={assign.id}>
                                    <tr className={`transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`} onClick={() => handleToggleExpand(assign.id)}>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 flex items-center gap-2">
                                          <Calendar size={14} className="text-slate-400" />
                                          {new Date(assign.date).toLocaleDateString()}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                          {assign.distributorName}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                          {assign.phone}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">
                                          {assign.totalBooks}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                                          {registeredCount}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">
                                          {pendingCount}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-right">
                                          <button className="text-slate-400 hover:text-indigo-600">
                                             {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                          </button>
                                       </td>
                                    </tr>
                                    
                                    {isExpanded && (
                                       <tr className="bg-slate-50/50">
                                          <td colSpan={7} className="px-6 py-6 border-t border-slate-200">
                                             <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                                   <h4 className="font-bold text-slate-700 text-sm flex items-center">
                                                      <CheckCircle size={16} className="mr-2 text-emerald-500" /> 
                                                      Registered Books Details
                                                   </h4>
                                                   <span className="text-xs text-slate-500">Batch: {assign.batchName}</span>
                                                </div>
                                                <div className="max-h-80 overflow-y-auto">
                                                   <table className="min-w-full divide-y divide-slate-100">
                                                      <thead className="bg-slate-50">
                                                         <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Register Date</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Book Number</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Recipient Name</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Phone Number</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Place</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                                                         </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-100">
                                                         {assign.books.filter((b: any) => b.status === 'Registered').length === 0 ? (
                                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No registered books in this batch yet.</td></tr>
                                                         ) : (
                                                            assign.books.filter((b: any) => b.status === 'Registered').map((book: any) => (
                                                               <tr key={book.serial} className="hover:bg-slate-50">
                                                                  <td className="px-4 py-2 text-sm text-slate-600">{book.details?.date}</td>
                                                                  <td className="px-4 py-2 text-sm font-mono font-semibold text-indigo-700">{book.serial}</td>
                                                                  <td className="px-4 py-2 text-sm text-slate-900 font-medium">{book.details?.recipientName}</td>
                                                                  <td className="px-4 py-2 text-sm text-slate-500">{book.details?.phone}</td>
                                                                  <td className="px-4 py-2 text-sm text-slate-500 truncate max-w-[150px]" title={book.details?.address}>{book.details?.address}</td>
                                                                  <td className="px-4 py-2 text-right">
                                                                     <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(book.details); }}
                                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                                                        title="Edit Details"
                                                                     >
                                                                        <Edit size={14} />
                                                                     </button>
                                                                  </td>
                                                               </tr>
                                                            ))
                                                         )}
                                                      </tbody>
                                                   </table>
                                                </div>
                                             </div>
                                          </td>
                                       </tr>
                                    )}
                                 </React.Fragment>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

         </div>
      </div>

      {/* --- Register / Edit Modal --- */}
      {registerModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRegisterModalOpen(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
               
               <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{editingBookSerial ? 'Update Registration' : 'Quick Register'}</h3>
                    <p className="text-sm text-slate-500">
                        {editingBookSerial ? 'Update details for book ' : 'Assign book '}
                        <span className="font-mono font-bold text-indigo-600">{formData.startSerial}</span>
                    </p>
                  </div>
                  <button onClick={() => setRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                     <X size={20} />
                  </button>
               </div>

               <div className="p-6 overflow-y-auto">
                  <form id="register-form" onSubmit={handleRegisterSubmit} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700">Recipient Name <span className="text-red-500">*</span></label>
                             <input 
                               type="text" required 
                               value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                               className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                               placeholder="Enter full name"
                             />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-slate-700">Phone Number <span className="text-red-500">*</span></label>
                             <input 
                               type="tel" required 
                               value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                               className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                             />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-slate-700">PSSM ID (Optional)</label>
                             <input 
                               type="text" 
                               value={formData.pssmId} onChange={e => setFormData({...formData, pssmId: e.target.value})}
                               className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                             />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-slate-700">Book Number</label>
                             <input 
                               type="text" readOnly
                               value={formData.startSerial}
                               className="mt-1 block w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-slate-500 font-mono" 
                             />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-slate-700">Quantity</label>
                             <input 
                               type="number" readOnly
                               value="1"
                               className="mt-1 block w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-md text-slate-500" 
                             />
                          </div>
                          <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700">Address</label>
                             <textarea 
                               rows={2} required 
                               value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                               className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                               placeholder="Full address"
                             ></textarea>
                          </div>
                       </div>
                  </form>
               </div>

               <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl shrink-0 flex justify-end gap-3">
                   <button 
                     type="button" 
                     onClick={() => setRegisterModalOpen(false)} 
                     className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     form="register-form"
                     disabled={registerStatus === 'saving'}
                     className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors font-medium text-sm flex items-center"
                   >
                     {registerStatus === 'saving' ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                     {editingBookSerial ? 'Update Details' : 'Confirm & Register'}
                   </button>
               </div>
            </div>
         </div>
      )}

      {/* --- View Details Modal (Keeping for Read-Only view if needed, but Edit replaces its primary use here) --- */}
      {viewDetailsModalOpen && selectedBookDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewDetailsModalOpen(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="bg-emerald-600 p-6 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm inline-flex"><BookOpen size={24} className="text-white" /></div>
                             <button onClick={() => setViewDetailsModalOpen(false)} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <h3 className="text-2xl font-bold mt-4">{selectedBookDetails.bookNumber}</h3>
                        <p className="text-emerald-100 text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Registered Successfully</p>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                         <div><p className="text-xs text-slate-500 uppercase font-semibold">Recipient</p><p className="text-slate-900 font-medium">{selectedBookDetails.recipientName}</p></div>
                         <div><p className="text-xs text-slate-500 uppercase font-semibold">Phone</p><p className="text-slate-900 font-medium">{selectedBookDetails.phone}</p></div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Registration Date</span><span className="text-sm font-semibold text-slate-900">{selectedBookDetails.date}</span></div>
                        <div className="flex justify-between items-center"><span className="text-sm text-slate-600">PSSM ID</span><span className="text-sm font-semibold text-slate-900">{selectedBookDetails.pssmId || 'N/A'}</span></div>
                    </div>
                    <div><p className="text-xs text-slate-500 uppercase font-semibold mb-1">Address</p><p className="text-sm text-slate-700 leading-relaxed">{selectedBookDetails.address}</p></div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button onClick={() => setViewDetailsModalOpen(false)} className="text-sm font-medium text-slate-600 hover:text-slate-900">Close Details</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default BookRegister;