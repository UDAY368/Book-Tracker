import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, CheckCircle, Loader2, X, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

const BookRegister: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'bulk' | 'books'>('inventory');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);

  // Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  
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
    inchargeName: '', 
    inchargePhone: '',
    batchName: '',
    totalBooks: '',
    registeredBooks: '',
    pendingBooks: ''
  });
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [parsedBulkData, setParsedBulkData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setTimeout(() => {
          setAssignments([]); // Start with empty state
      }, 500);
    };
    loadData();
  }, []);

  const handleToggleExpand = (id: number) => {
    setExpandedAssignmentId(expandedAssignmentId === id ? null : id);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterStatus('saving');
    await api.registerRecipient(formData);
    
    setRegisterStatus('success');
    setToastMessage("Register Successful");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    setTimeout(() => {
       setRegisterModalOpen(false);
       setRegisterStatus('idle');
       setFormData({ name: '', phone: '', address: '', booksCount: 1, startSerial: '', pssmId: '' });
    }, 2000);
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

          const parsedData = lines.slice(1).map((line, idx) => {
            const cols = line.split(',');
            return {
              date: cols[0],
              serial: cols[1],
              name: cols[2],
              phone: cols[3],
              pssmId: cols[4],
              address: cols[5],
              status: cols[6]?.trim() 
            };
          });

          setParsedBulkData(parsedData);
          
          const total = parsedData.length;
          const reg = parsedData.filter(d => d.status === 'Registered').length;
          
          setBulkFormData(prev => ({
            ...prev,
            totalBooks: total.toString(),
            registeredBooks: reg.toString(),
            pendingBooks: (total - reg).toString()
          }));

          setUploadStatus('done');

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
     if (!bulkFormData.inchargeName) {
       alert("Please enter Incharge Name");
       return;
     }

     const newAssignment = {
        id: Date.now(),
        date: bulkFormData.date,
        inchargeName: bulkFormData.inchargeName,
        phone: bulkFormData.inchargePhone,
        totalBooks: parseInt(bulkFormData.totalBooks) || 0,
        batchName: bulkFormData.batchName || ('BULK-IMPORT-' + new Date().getMonth()),
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

     setAssignments(prev => [newAssignment, ...prev]);
     
     setToastMessage("File import Successfully");
     setShowToast(true);
     setTimeout(() => setShowToast(false), 3000);

     setUploadStatus('idle');
     setParsedBulkData([]);
     setBulkFormData({ 
        date: new Date().toISOString().split('T')[0], 
        inchargeName: '',
        inchargePhone: '',
        batchName: '',
        totalBooks: '', 
        registeredBooks: '', 
        pendingBooks: '' 
     });
     if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[110] animate-in slide-in-from-right duration-300">
          <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-3 border border-emerald-200 ring-1 ring-emerald-100">
            <div className="bg-white p-1.5 rounded-full shadow-sm text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
            <div><h4 className="font-bold text-sm text-emerald-900">Success</h4><p className="text-xs text-emerald-700">{toastMessage}</p></div>
            <button onClick={() => setShowToast(false)} className="ml-4 text-emerald-400 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-100 rounded-full"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Tabs & Content */}
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-slate-800">Book Registration</h2><p className="text-slate-500 text-sm">Manage incoming stock and register outgoing books.</p></div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
         <div className="border-b border-slate-200">
           <nav className="flex -mb-px">
             <button onClick={() => setActiveTab('inventory')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Inward Stock & Register</button>
             <button onClick={() => setActiveTab('bulk')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'bulk' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Bulk Upload</button>
             <button onClick={() => setActiveTab('books')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'books' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Registration History</button>
           </nav>
         </div>

         <div className="p-6">
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Recent Books Assigned</h3>
                    <button onClick={() => setRegisterModalOpen(true)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"><Plus size={16} className="mr-1" /> Manual Register</button>
                 </div>
                 <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                       <thead className="bg-slate-50">
                          <tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Incharge</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Registered</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pending</th><th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th></tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-slate-200">
                          {assignments.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No new stock assignments.</td></tr>}
                          {assignments.map((assign) => (
                             <tr key={assign.id}><td className="px-6 py-4">{assign.date}</td><td className="px-6 py-4">{assign.inchargeName}</td><td className="px-6 py-4">{assign.phone}</td><td className="px-6 py-4">{assign.totalBooks}</td><td className="px-6 py-4">{assign.books.filter((b:any)=>b.status==='Registered').length}</td><td className="px-6 py-4">{assign.totalBooks - assign.books.filter((b:any)=>b.status==='Registered').length}</td><td className="px-6 py-4 text-right"><button onClick={() => handleToggleExpand(assign.id)} className="text-indigo-600">Details</button></td></tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}
            {activeTab === 'bulk' && (
              <div className="max-w-5xl mx-auto">
                 <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Assignment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                       <input type="text" placeholder="Incharge Name" value={bulkFormData.inchargeName} onChange={e => setBulkFormData({...bulkFormData, inchargeName: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                       <input type="tel" placeholder="Incharge Phone" value={bulkFormData.inchargePhone} onChange={e => setBulkFormData({...bulkFormData, inchargePhone: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                       <input type="text" placeholder="Batch Name" value={bulkFormData.batchName} onChange={e => setBulkFormData({...bulkFormData, batchName: e.target.value})} className="block w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </div>
                    {uploadStatus === 'idle' && (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center relative">
                           <input type="file" accept=".csv" onChange={handleBulkFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" ref={fileInputRef} />
                           <p className="text-slate-500">Click to Upload CSV</p>
                        </div>
                    )}
                    {uploadStatus === 'done' && (
                       <div className="space-y-4">
                          <p>Total: {bulkFormData.totalBooks}</p>
                          <button onClick={handleBulkProcess} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Process Import</button>
                       </div>
                    )}
                 </div>
              </div>
            )}
            {activeTab === 'books' && (
               <div className="text-center py-10 text-slate-400">No history available.</div>
            )}
         </div>
      </div>

      {/* Manual Register Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRegisterModalOpen(false)}></div>
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-800">Register Recipient</h3>
                 <button onClick={() => setRegisterModalOpen(false)}><X size={20} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                 <input type="text" name="name" placeholder="Name" required value={formData.name} onChange={handleInputChange} className="w-full border p-2 rounded" />
                 <input type="tel" name="phone" placeholder="Phone" required value={formData.phone} onChange={handleInputChange} className="w-full border p-2 rounded" />
                 <textarea name="address" placeholder="Address" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border p-2 rounded" />
                 <input type="text" name="startSerial" placeholder="Book Number" required value={formData.startSerial} onChange={handleInputChange} className="w-full border p-2 rounded" />
                 <input type="text" name="pssmId" placeholder="PSSM ID (Optional)" value={formData.pssmId} onChange={handleInputChange} className="w-full border p-2 rounded" />
                 <button type="submit" disabled={registerStatus === 'saving'} className="w-full bg-indigo-600 text-white py-2 rounded flex justify-center">
                    {registerStatus === 'saving' ? <Loader2 className="animate-spin" /> : 'Register'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default BookRegister;