
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Plus, Trash2, Search, Map, 
  Building2, Home, Layout, ChevronRight,
  Loader2, AlertCircle, X, Upload, FileJson, Edit2, Download
} from 'lucide-react';
import { api } from '../services/api';

const AddLocation: React.FC = () => {
  const [locations, setLocations] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedTown, setSelectedTown] = useState<string | null>(null);
  
  // Modal State (Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'Add' | 'Edit'>('Add');
  const [modalType, setModalType] = useState<'State' | 'District' | 'Town' | 'Center' | null>(null);
  const [modalItemName, setModalItemName] = useState('');
  const [originalItemName, setOriginalItemName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Lists
  const states = Object.keys(locations).sort();
  const districts = selectedState && locations[selectedState] ? Object.keys(locations[selectedState]).sort() : [];
  const towns = selectedState && selectedDistrict && locations[selectedState][selectedDistrict] 
    ? Object.keys(locations[selectedState][selectedDistrict]).sort() 
    : [];
  const centers = selectedState && selectedDistrict && selectedTown && locations[selectedState][selectedDistrict][selectedTown]
    ? locations[selectedState][selectedDistrict][selectedTown].sort()
    : [];

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    const data = await api.getLocations();
    setLocations(data);
    setLoading(false);
  };

  // --- Add / Edit Handlers ---

  const handleAddItem = (type: 'State' | 'District' | 'Town' | 'Center') => {
    setModalMode('Add');
    setModalType(type);
    setModalItemName('');
    setIsModalOpen(true);
  };

  const handleEditItem = (type: 'State' | 'District' | 'Town' | 'Center', name: string) => {
    setModalMode('Edit');
    setModalType(type);
    setModalItemName(name);
    setOriginalItemName(name);
    setIsModalOpen(true);
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItemName.trim() || !modalType) return;

    setIsSaving(true);
    try {
      if (modalMode === 'Add') {
          const payload: any = { type: modalType, state: selectedState || '' };
          
          if (modalType === 'State') {
            payload.state = modalItemName;
          } else if (modalType === 'District') {
            payload.district = modalItemName;
          } else if (modalType === 'Town') {
            payload.district = selectedDistrict;
            payload.town = modalItemName;
          } else if (modalType === 'Center') {
            payload.district = selectedDistrict;
            payload.town = selectedTown;
            payload.center = modalItemName;
          }

          await api.addLocation(payload);
          
          // Auto-select newly added item
          if (modalType === 'State') setSelectedState(modalItemName);
          else if (modalType === 'District') setSelectedDistrict(modalItemName);
          else if (modalType === 'Town') setSelectedTown(modalItemName);

      } else {
          // Edit Mode
          await api.updateLocation({
              type: modalType,
              oldName: originalItemName,
              newName: modalItemName,
              state: selectedState || '',
              district: selectedDistrict || '',
              town: selectedTown || ''
          });

          // Update Selection if the currently selected item was renamed
          if (modalType === 'State' && selectedState === originalItemName) setSelectedState(modalItemName);
          if (modalType === 'District' && selectedDistrict === originalItemName) setSelectedDistrict(modalItemName);
          if (modalType === 'Town' && selectedTown === originalItemName) setSelectedTown(modalItemName);
      }

      await loadLocations(); 
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save location", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (type: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${type} "${name}"? All sub-locations will also be deleted.`)) return;
    
    const payload: any = { type, state: selectedState || '' };
    
    if (type === 'State') {
        payload.state = name;
    } else if (type === 'District') {
        payload.state = selectedState;
        payload.district = name;
    } else if (type === 'Town') {
        payload.state = selectedState;
        payload.district = selectedDistrict;
        payload.town = name;
    } else if (type === 'Center') {
        payload.state = selectedState;
        payload.district = selectedDistrict;
        payload.town = selectedTown;
        payload.center = name;
    }

    await api.deleteLocation(payload);
    await loadLocations();

    if (type === 'State' && selectedState === name) { setSelectedState(null); setSelectedDistrict(null); setSelectedTown(null); }
    if (type === 'District' && selectedDistrict === name) { setSelectedDistrict(null); setSelectedTown(null); }
    if (type === 'Town' && selectedTown === name) { setSelectedTown(null); }
  };

  // --- Import Handlers ---

  const handleDownloadTemplate = () => {
      const template = {
          "States": {
              "Andhra_Pradesh": {
                  "Districts": [
                      {
                          "District_Name": "Alluri Sitharama Raju",
                          "Mandals": ["Paderu", "Araku Valley", "Ananthagiri"]
                      },
                      {
                          "District_Name": "Anakapalli",
                          "Mandals": ["Anakapalle", "Atchutapuram", "Butchayyapeta"]
                      }
                  ]
              }
          }
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "location_template.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setImportFile(e.target.files[0]);
          setImportStatus('idle');
      }
  };

  const handleImport = async () => {
      if (!importFile) return;
      setImportStatus('processing');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              await api.importLocations(json);
              await loadLocations();
              setImportStatus('success');
              setTimeout(() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportStatus('idle');
              }, 1500);
          } catch (error) {
              console.error("Import Error", error);
              setImportStatus('error');
          }
      };
      reader.readAsText(importFile);
  };

  // --- Column Render Component ---
  const LocationColumn = ({ 
    title, 
    type,
    items, 
    selectedItem, 
    onSelect, 
    onAdd, 
    onEdit,
    onDelete, 
    icon: Icon,
    isDisabled,
    emptyMessage
  }: { 
    title: string,
    type: 'State' | 'District' | 'Town' | 'Center', 
    items: string[], 
    selectedItem: string | null, 
    onSelect: (item: string) => void, 
    onAdd: () => void, 
    onEdit: (name: string) => void,
    onDelete: (item: string) => void, 
    icon: any,
    isDisabled: boolean,
    emptyMessage: string
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredItems = items.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className={`flex flex-col h-[600px] border-r border-slate-200 bg-white min-w-[280px] flex-1 last:border-r-0 ${isDisabled ? 'bg-slate-50/50' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Icon size={18} className="text-slate-400" />
            <span>{title}</span>
            <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{items.length}</span>
          </div>
          {!isDisabled && (
            <button 
              onClick={onAdd}
              className="p-1.5 rounded-md hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"
              title={`Add ${title}`}
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {/* Search */}
        {!isDisabled && items.length > 5 && (
            <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={`Search ${title}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>
        )}

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
          {isDisabled ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-4 text-slate-400">
                <AlertCircle size={24} className="mb-2 opacity-30" />
                <p className="text-sm">{emptyMessage}</p>
             </div>
          ) : filteredItems.length === 0 ? (
             <div className="text-center p-8 text-slate-400 text-sm italic">
                {searchTerm ? 'No matches found.' : 'No items added yet.'}
             </div>
          ) : (
             filteredItems.map(item => (
                <div 
                   key={item}
                   onClick={() => onSelect(item)}
                   className={`
                      group flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-all border
                      ${selectedItem === item 
                         ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium shadow-sm' 
                         : 'hover:bg-slate-50 border-transparent text-slate-600'
                      }
                   `}
                >
                   <span className="truncate flex-1">{item}</span>
                   <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <button 
                         onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                         className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded"
                         title="Edit Name"
                      >
                         <Edit2 size={14} />
                      </button>
                      <button 
                         onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                         className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                         title="Delete"
                      >
                         <Trash2 size={14} />
                      </button>
                      <ChevronRight size={14} className={`text-slate-300 ${selectedItem === item ? 'text-indigo-400' : ''}`} />
                   </div>
                </div>
             ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-full pb-20 animate-in fade-in duration-500 relative">
      
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Location Management</h2>
           <p className="text-slate-500 text-sm mt-1">Configure hierarchy: State &gt; District &gt; Town &gt; Center.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors text-sm font-bold"
            >
                <Upload size={16} /> Import JSON
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <span className="flex items-center font-medium"><Map size={14} className="mr-1.5"/> Hierarchy View</span>
            </div>
        </div>
      </div>

      {/* Columns Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row h-[650px]">
         
         {/* Column 1: State */}
         <LocationColumn 
            title="States" 
            type="State"
            items={states} 
            selectedItem={selectedState} 
            onSelect={(item) => { setSelectedState(item); setSelectedDistrict(null); setSelectedTown(null); }}
            onAdd={() => handleAddItem('State')}
            onEdit={(name) => handleEditItem('State', name)}
            onDelete={(item) => handleDeleteItem('State', item)}
            icon={Map}
            isDisabled={false}
            emptyMessage=""
         />

         {/* Column 2: District */}
         <LocationColumn 
            title="Districts"
            type="District" 
            items={districts} 
            selectedItem={selectedDistrict} 
            onSelect={(item) => { setSelectedDistrict(item); setSelectedTown(null); }}
            onAdd={() => handleAddItem('District')}
            onEdit={(name) => handleEditItem('District', name)}
            onDelete={(item) => handleDeleteItem('District', item)}
            icon={Layout}
            isDisabled={!selectedState}
            emptyMessage="Select a State to view Districts"
         />

         {/* Column 3: Town */}
         <LocationColumn 
            title="Towns / Mandals" 
            type="Town"
            items={towns} 
            selectedItem={selectedTown} 
            onSelect={(item) => setSelectedTown(item)}
            onAdd={() => handleAddItem('Town')}
            onEdit={(name) => handleEditItem('Town', name)}
            onDelete={(item) => handleDeleteItem('Town', item)}
            icon={Building2}
            isDisabled={!selectedDistrict}
            emptyMessage="Select a District to view Towns"
         />

         {/* Column 4: Center */}
         <LocationColumn 
            title="Centers" 
            type="Center"
            items={centers} 
            selectedItem={null} 
            onSelect={() => {}} // Center is leaf node
            onAdd={() => handleAddItem('Center')}
            onEdit={(name) => handleEditItem('Center', name)}
            onDelete={(item) => handleDeleteItem('Center', item)}
            icon={MapPin}
            isDisabled={!selectedTown}
            emptyMessage="Select a Town to view Centers"
         />
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{modalMode} {modalType}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                    <X size={20} />
                  </button>
               </div>
               
               <form onSubmit={handleConfirmSave}>
                  <div className="mb-6">
                     <label className="block text-sm font-medium text-slate-700 mb-2">
                        {modalType} Name
                     </label>
                     <input 
                        type="text" 
                        autoFocus
                        value={modalItemName}
                        onChange={(e) => setModalItemName(e.target.value)}
                        placeholder={`Enter ${modalType} Name`}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                     />
                     {modalType !== 'State' && modalMode === 'Add' && (
                        <p className="mt-2 text-xs text-slate-500 flex items-center">
                           <AlertCircle size={12} className="mr-1" />
                           Adding to: <span className="font-bold ml-1">{modalType === 'District' ? selectedState : modalType === 'Town' ? selectedDistrict : selectedTown}</span>
                        </p>
                     )}
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                     <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit" 
                        disabled={!modalItemName.trim() || isSaving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                     >
                        {isSaving && <Loader2 size={16} className="animate-spin mr-2" />}
                        {modalMode === 'Add' ? 'Add Item' : 'Update Name'}
                     </button>
                  </div>
               </form>
           </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)}></div>
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                      <h3 className="font-bold text-lg flex items-center gap-2"><FileJson size={20}/> Import Locations</h3>
                      <button onClick={() => setIsImportModalOpen(false)} className="text-indigo-200 hover:text-white p-1 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-6">
                      
                      {/* Step 1: Download Template */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Step 1: Get Template</h4>
                          <p className="text-xs text-slate-500 mb-3">Download the JSON format to ensure your data structure is correct.</p>
                          <button onClick={handleDownloadTemplate} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white border border-indigo-200 px-3 py-2 rounded-md shadow-sm hover:bg-indigo-50 transition-colors">
                              <Download size={14}/> Download JSON Template
                          </button>
                      </div>

                      {/* Step 2: Upload */}
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Step 2: Upload File</h4>
                          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${importFile ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                              <input 
                                  type="file" 
                                  accept=".json"
                                  className="hidden" 
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                              />
                              {importFile ? (
                                  <div className="flex flex-col items-center">
                                      <FileJson size={32} className="text-indigo-600 mb-2"/>
                                      <p className="text-sm font-bold text-slate-800">{importFile.name}</p>
                                      <p className="text-xs text-slate-500">{(importFile.size / 1024).toFixed(2)} KB</p>
                                      <button 
                                          onClick={() => { setImportFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                          className="text-xs text-red-500 font-bold mt-2 hover:underline"
                                      >
                                          Remove
                                      </button>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                      <Upload size={32} className="text-slate-400 mb-2"/>
                                      <p className="text-sm text-slate-600 font-medium">Click to browse JSON file</p>
                                  </div>
                              )}
                          </div>
                      </div>

                      {importStatus === 'error' && (
                          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                              <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                              <span>Invalid JSON format. Please check the template.</span>
                          </div>
                      )}
                      {importStatus === 'success' && (
                          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm flex items-center gap-2">
                              <AlertCircle size={16}/>
                              <span>Locations imported successfully!</span>
                          </div>
                      )}
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50">Cancel</button>
                      <button 
                          onClick={handleImport}
                          disabled={!importFile || importStatus === 'processing'}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                          {importStatus === 'processing' ? <Loader2 className="animate-spin mr-2" size={16}/> : <Upload className="mr-2" size={16}/>}
                          Import Data
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AddLocation;
