import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, AlertCircle, Upload, Plus, Search, 
  CheckCircle, Download, FileText, Edit2, Phone, MapPin, Loader2, X 
} from 'lucide-react';
import { api } from '../../services/api';
import { getInchargeBooks } from '../../services/mockData';
import { InchargeStats, BulkImportResult } from '../../types';

const InchargeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'bulk' | 'books'>('overview');
  const [stats, setStats] = useState<InchargeStats | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Bulk Upload State
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [importResults, setImportResults] = useState<BulkImportResult[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const s = await api.getInchargeStats();
      setStats(s);
      setBooks(getInchargeBooks());
      setLoading(false);
    };
    loadData();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterStatus('saving');
    await api.registerRecipient(formData);
    setRegisterStatus('success');
    
    // Reset after delay
    setTimeout(() => {
       setRegisterStatus('idle');
       setFormData({ name: '', phone: '', address: '', booksCount: 1, startSerial: '', pssmId: '' });
    }, 3000);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus('uploading');
      try {
        const results = await api.inchargeBulkImport(file);
        setImportResults(results);
        setUploadStatus('done');
      } catch (err) {
        alert("Upload failed");
        setUploadStatus('idle');
      }
    }
  };

  if (loading || !stats) return <div className="p-8 text-center text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Stats - Removed Collected Amount Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-indigo-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">My Inventory</p>
            <div className="flex justify-between items-end mt-2">
               <h3 className="text-2xl font-bold text-slate-900">{stats.totalAssigned}</h3>
               <BookOpen className="text-indigo-200" size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">Registred Books</p>
            <div className="flex justify-between items-end mt-2">
               <h3 className="text-2xl font-bold text-slate-900">{stats.distributed}</h3>
               <Users className="text-emerald-200" size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">Registration Pending</p>
            <div className="flex justify-between items-end mt-2">
               <h3 className="text-2xl font-bold text-slate-900">{stats.pendingDetails}</h3>
               <AlertCircle className="text-amber-200" size={24} />
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
         <div className="border-b border-slate-200">
           <nav className="flex -mb-px">
             <button onClick={() => setActiveTab('overview')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
               Quick Register
             </button>
             <button onClick={() => setActiveTab('bulk')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'bulk' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
               Bulk Upload
             </button>
             <button onClick={() => setActiveTab('books')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'books' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
               My Books List
             </button>
           </nav>
         </div>

         <div className="p-6">
            
            {/* --- Single Registration Tab --- */}
            {activeTab === 'overview' && (
              <div className="max-w-3xl mx-auto"> 
                 <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                       <Plus size={20} className="mr-2 text-indigo-600" /> Register Recipient
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">
                       Log details of the person who received books from you. This will update the central tracking system.
                    </p>
                    
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700">Recipient Name</label>
                             <input 
                               type="text" required 
                               value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                               className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                             />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-slate-700">Phone Number</label>
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
                             <label className="block text-sm font-medium text-slate-700">No. of Books</label>
                             <input 
                               type="number" min="1" required 
                               value={formData.booksCount} onChange={e => setFormData({...formData, booksCount: parseInt(e.target.value)})}
                               className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                             />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-slate-700">Start Serial #</label>
                             <input 
                               type="text" required 
                               value={formData.startSerial} onChange={e => setFormData({...formData, startSerial: e.target.value})}
                               className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                             />
                          </div>
                          <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700">Address</label>
                             <textarea 
                               rows={2} required 
                               value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                               className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                             ></textarea>
                          </div>
                       </div>
                       
                       <div className="pt-2">
                          {registerStatus === 'success' ? (
                             <div className="flex items-center p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                                <CheckCircle size={20} className="mr-3" />
                                <div>
                                   <p className="font-bold">Notification Sent!</p>
                                   <p className="text-sm">Recipient details have been successfully saved.</p>
                                </div>
                             </div>
                          ) : (
                             <button 
                               type="submit" 
                               disabled={registerStatus === 'saving'}
                               className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition flex justify-center items-center"
                             >
                                {registerStatus === 'saving' ? <Loader2 className="animate-spin" /> : 'Save Recipient Details'}
                             </button>
                          )}
                       </div>
                    </form>
                 </div>
                 {/* Removed Spread the Wisdom Section */}
              </div>
            )}

            {/* --- Bulk Upload Tab --- */}
            {activeTab === 'bulk' && (
              <div className="max-w-4xl mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-slate-800">Bulk Import Recipients</h3>
                       <p className="text-sm text-slate-500">Upload an Excel file to register multiple donors at once.</p>
                    </div>
                    <button className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium border border-indigo-200 px-3 py-2 rounded-md hover:bg-indigo-50">
                       <Download size={16} className="mr-2" /> Download Template
                    </button>
                 </div>

                 {uploadStatus === 'idle' && (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors relative">
                       <input 
                          type="file" 
                          accept=".xlsx, .csv" 
                          onChange={handleBulkUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                       />
                       <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload size={32} />
                       </div>
                       <h4 className="font-semibold text-slate-800 text-lg">Click to Upload Excel File</h4>
                       <p className="text-slate-500 text-sm mt-1">or drag and drop here</p>
                    </div>
                 )}

                 {uploadStatus === 'uploading' && (
                    <div className="py-20 text-center">
                       <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
                       <h3 className="text-lg font-medium text-slate-800">Processing File...</h3>
                       <p className="text-slate-500">Validating phone numbers and serial ranges.</p>
                    </div>
                 )}

                 {uploadStatus === 'done' && (
                    <div className="space-y-6">
                       <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                             <h4 className="font-bold text-slate-700">Validation Report</h4>
                             <div className="text-sm">
                                <span className="text-green-600 font-medium mr-4">{importResults.filter(r => r.status === 'success').length} Success</span>
                                <span className="text-red-600 font-medium">{importResults.filter(r => r.status === 'error').length} Errors</span>
                             </div>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                             <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                   <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Row</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Data</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Message</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                   {importResults.map((res, idx) => (
                                      <tr key={idx} className={res.status === 'error' ? 'bg-red-50/50' : ''}>
                                         <td className="px-6 py-3 text-sm text-slate-500">#{res.row}</td>
                                         <td className="px-6 py-3 text-sm">
                                            {res.status === 'success' ? (
                                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                  Success
                                               </span>
                                            ) : (
                                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                  Error
                                               </span>
                                            )}
                                         </td>
                                         <td className="px-6 py-3 text-sm text-slate-700 font-mono text-xs">
                                            {JSON.stringify(res.data)}
                                         </td>
                                         <td className={`px-6 py-3 text-sm ${res.status === 'error' ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                            {res.message}
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                       
                       <div className="flex justify-end gap-4">
                          <button onClick={() => setUploadStatus('idle')} className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50">
                             Cancel
                          </button>
                          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm">
                             Confirm & Import Valid Rows
                          </button>
                       </div>
                    </div>
                 )}
              </div>
            )}

            {/* --- My Books Tab --- */}
            {activeTab === 'books' && (
               <div>
                  <div className="flex justify-between mb-4">
                     <h3 className="text-lg font-bold text-slate-800">My Books & Recipients</h3>
                     <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                     </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Books</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Serial Range</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                           {books.map(book => (
                              <tr key={book.id} className="hover:bg-slate-50">
                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{book.name}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{book.phone}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{book.books}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{book.serials}</td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${book.status === 'Registered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                       {book.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-indigo-600 hover:text-indigo-900"><Edit2 size={16}/></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

         </div>
      </div>
    </div>
  );
};

export default InchargeDashboard;