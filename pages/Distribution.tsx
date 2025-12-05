
import React, { useState, useEffect } from 'react';
import { 
  Plus, Printer, Search, Edit, Trash2, X, CheckCircle, 
  AlertCircle, FileText, Save, Loader2, RefreshCw, ChevronLeft, ChevronRight, Layers, Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { PrintBatch, UserRole } from '../types';

const Distribution: React.FC<{ role: UserRole }> = ({ role }) => {
  const [batches, setBatches] = useState<PrintBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const initialFormState = {
    batchName: '',
    totalBooks: '',
    startSerial: '',
    endSerial: '',
    printedDate: new Date().toISOString().split('T')[0],
    status: 'In Stock' as 'In Stock' | 'Partial Distributed' | 'Out of Stock'
  };
  const [batchFormData, setBatchFormData] = useState(initialFormState);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await api.getBatches();
      setBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBatchFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (batch?: PrintBatch) => {
    if (batch) {
      setEditingBatchId(batch.id);
      setBatchFormData({
        batchName: batch.batchName,
        totalBooks: batch.totalBooks.toString(),
        startSerial: batch.bookSerialStart,
        endSerial: batch.bookSerialEnd,
        printedDate: batch.printedDate,
        status: batch.status || 'In Stock'
      });
    } else {
      setEditingBatchId(null);
      setBatchFormData({
          ...initialFormState,
          printedDate: new Date().toISOString().split('T')[0] // Ensure today's date
      });
    }
    setIsModalOpen(true);
  };

  const handleCancelBatch = () => {
    setIsModalOpen(false);
    setEditingBatchId(null);
    setBatchFormData(initialFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.saveBatch({
        id: editingBatchId,
        batchName: batchFormData.batchName,
        totalBooks: parseInt(batchFormData.totalBooks),
        bookSerialStart: batchFormData.startSerial,
        bookSerialEnd: batchFormData.endSerial,
        printedDate: batchFormData.printedDate,
        status: batchFormData.status
      });
      
      setToastMessage(editingBatchId ? 'Batch Updated Successfully' : 'Batch Created Successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      await loadBatches();
      handleCancelBatch();
    } catch (error) {
      console.error(error);
      alert('Failed to save batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering & Pagination
  const filteredBatches = batches.filter(b => 
    b.batchName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-lg border border-emerald-200 flex items-center gap-2">
            <CheckCircle size={18} /><span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Print Batches</h2>
          <p className="text-slate-500 text-sm mt-1">Manage book printing inventory and serial numbers.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-md shadow-indigo-200 transition-all"
        >
          <Plus size={18} /> Add New Batch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Layers size={24} /></div>
           <div><p className="text-xs font-bold text-slate-500 uppercase">Total Batches</p><h3 className="text-2xl font-bold text-slate-900">{batches.length}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Printer size={24} /></div>
           <div><p className="text-xs font-bold text-slate-500 uppercase">Total Books</p><h3 className="text-2xl font-bold text-slate-900">{batches.reduce((acc, b) => acc + b.totalBooks, 0).toLocaleString()}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle size={24} /></div>
           <div><p className="text-xs font-bold text-slate-500 uppercase">In Stock</p><h3 className="text-2xl font-bold text-slate-900">{batches.reduce((acc, b) => acc + (b.remainingBooks ?? b.totalBooks), 0).toLocaleString()}</h3></div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
         <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <div className="relative w-full max-w-md">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
               <input 
                  type="text" 
                  placeholder="Search Batch Name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
               />
            </div>
            <button onClick={loadBatches} className="p-2 text-slate-500 hover:text-indigo-600 border rounded-lg hover:bg-slate-50"><RefreshCw size={18}/></button>
         </div>

         <div className="flex-1 overflow-auto">
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : (
                <table className="min-w-full divide-y divide-slate-200">
                   <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Batch Name</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Printed Date</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Serial Range</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Total / Remaining</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                         <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                      </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-slate-100">
                      {paginatedBatches.length === 0 ? (
                          <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No batches found.</td></tr>
                      ) : (
                          paginatedBatches.map(batch => (
                              <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">{batch.batchName}</td>
                                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(batch.printedDate).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{batch.bookSerialStart} - {batch.bookSerialEnd}</td>
                                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                      {batch.totalBooks} <span className="text-slate-400">/</span> <span className="text-emerald-600">{batch.remainingBooks ?? batch.totalBooks}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                          batch.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          batch.status === 'Out of Stock' ? 'bg-red-50 text-red-700 border-red-200' :
                                          'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}>
                                          {batch.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button onClick={() => openModal(batch)} className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded transition-colors"><Edit size={16} /></button>
                                  </td>
                              </tr>
                          ))
                      )}
                   </tbody>
                </table>
            )}
         </div>

         {/* Pagination */}
         {filteredBatches.length > itemsPerPage && (
             <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                 <div className="text-xs text-slate-500">Page {currentPage} of {totalPages}</div>
                 <div className="flex gap-2">
                     <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronLeft size={16}/></button>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="p-2 border rounded bg-white disabled:opacity-50"><ChevronRight size={16}/></button>
                 </div>
             </div>
         )}
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCancelBatch}></div>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
                  <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center shrink-0 text-white">
                      <h3 className="font-bold text-lg">{editingBatchId ? 'Edit Batch' : 'Add New Print Batch'}</h3>
                      <button onClick={handleCancelBatch} className="text-indigo-200 hover:text-white p-1 rounded-full hover:bg-indigo-700"><X size={20} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      <form onSubmit={handleSubmit} className="space-y-5">
                          
                          {/* 1. Printed Date (Default Today) */}
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Printed Date <span className="text-red-500">*</span></label>
                              <div className="relative">
                                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                  <input 
                                    type="date" 
                                    name="printedDate" 
                                    required 
                                    value={batchFormData.printedDate} 
                                    onChange={handleBatchInputChange} 
                                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-700" 
                                  />
                              </div>
                          </div>

                          {/* 2. Batch Name & 3. Total Books */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Batch Name <span className="text-red-500">*</span></label>
                                  <input 
                                    type="text" 
                                    name="batchName" 
                                    required 
                                    value={batchFormData.batchName} 
                                    onChange={handleBatchInputChange} 
                                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium" 
                                    placeholder="e.g. Batch A - Oct 2023" 
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Total Books <span className="text-red-500">*</span></label>
                                  <input 
                                    type="number" 
                                    name="totalBooks" 
                                    required 
                                    min="1" 
                                    value={batchFormData.totalBooks} 
                                    onChange={handleBatchInputChange} 
                                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium" 
                                    placeholder="e.g. 5000" 
                                  />
                              </div>
                          </div>

                          {/* 4. Batch Status */}
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Batch Status</label>
                              <select 
                                name="status" 
                                value={batchFormData.status} 
                                onChange={handleBatchInputChange} 
                                className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white font-medium text-slate-700"
                              >
                                  <option value="In Stock">In Stock</option>
                                  <option value="Partial Distributed">Partial Distributed</option>
                                  <option value="Out of Stock">Out of Stock</option>
                              </select>
                          </div>

                          {/* 5. Book Serial Range */}
                          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                              <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                                  <div className="p-1 bg-white rounded border border-slate-200 shadow-sm"><FileText size={14} className="text-indigo-600"/></div>
                                  Book Serial Range
                              </h4>
                              <div className="grid grid-cols-2 gap-5">
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Start Serial <span className="text-red-500">*</span></label>
                                      <input 
                                        type="text" 
                                        name="startSerial" 
                                        required 
                                        value={batchFormData.startSerial} 
                                        onChange={handleBatchInputChange} 
                                        className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono font-bold text-slate-800 tracking-wide bg-white" 
                                        placeholder="e.g. A0001" 
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">End Serial <span className="text-red-500">*</span></label>
                                      <input 
                                        type="text" 
                                        name="endSerial" 
                                        required 
                                        value={batchFormData.endSerial} 
                                        onChange={handleBatchInputChange} 
                                        className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono font-bold text-slate-800 tracking-wide bg-white" 
                                        placeholder="e.g. A5000" 
                                      />
                                  </div>
                              </div>
                          </div>

                          {/* 6. Existing Serial Ranges (Latest 5) */}
                          <div className="mt-2">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5 pl-1">
                                  <Layers size={12}/> Recent 5 Batches
                              </h4>
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                  {batches.length > 0 ? (
                                      [...batches]
                                      .sort((a, b) => new Date(b.printedDate).getTime() - new Date(a.printedDate).getTime())
                                      .slice(0, 5)
                                      .map((b, idx, arr) => (
                                          <div key={b.id} className={`flex justify-between items-center px-4 py-3 ${idx !== arr.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-colors`}>
                                              <div className="flex flex-col">
                                                  <span className="text-xs font-bold text-slate-700">{b.batchName}</span>
                                                  <span className="text-[10px] text-slate-400 font-medium">{new Date(b.printedDate).toLocaleDateString()}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                      {b.bookSerialStart} - {b.bookSerialEnd}
                                                  </span>
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <div className="px-4 py-6 text-center text-xs text-slate-400 italic">No existing batches found.</div>
                                  )}
                              </div>
                          </div>

                          <div className="flex justify-end pt-6 border-t border-slate-100 gap-3">
                              <button type="button" onClick={handleCancelBatch} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors">Cancel</button>
                              
                              <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold text-sm transition-all flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="animate-spin mr-2" size={18} />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      {editingBatchId ? <Save className="mr-2" size={18} /> : <CheckCircle className="mr-2" size={18} />}
                                      {editingBatchId ? 'Update Batch' : 'Confirm Batch'}
                                    </>
                                  )}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Distribution;
