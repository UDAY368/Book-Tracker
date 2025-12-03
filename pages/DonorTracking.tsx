
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, User, MapPin, 
  ArrowUpDown, Briefcase, IndianRupee, RefreshCw,
  Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, X, Loader2
} from 'lucide-react';

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

const PROFESSIONS = ["Agriculture", "Business", "Technology", "State Govt", "Central Govt", "Student", "Housewife", "Others"];
const LOCATION_DATA: Record<string, Record<string, string[]>> = {};

interface Donor {
  id: string;
  name: string;
  phone: string;
  profession: string;
  address: string;
  state: string;
  district: string;
  town: string;
  center: string;
  amount: number;
  yagam: string;
}

const DonorTracking: React.FC = () => {
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Donor; direction: 'asc' | 'desc' }>({ key: 'amount', direction: 'desc' });
  const [isLoading, setIsLoading] = useState(true);
  const [donors, setDonors] = useState<Donor[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
        setDonors([]); // Empty State
        setIsLoading(false);
    }, 300);
  }, []);

  const handleResetFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedTown('');
    setSelectedCenter('');
    setSelectedProfession('');
    setSearchQuery('');
  };

  const filteredDonors = useMemo(() => {
    return donors.filter(donor => {
        if (donor.yagam !== selectedYagam) return false;
        if (selectedState && donor.state !== selectedState) return false;
        if (selectedProfession && donor.profession !== selectedProfession) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return donor.name.toLowerCase().includes(q);
        }
        return true;
    });
  }, [donors, selectedYagam, selectedState, selectedProfession, searchQuery]);

  const sortedDonors = useMemo(() => {
      return [...filteredDonors].sort((a, b) => {
          // simple sort logic if needed
          return 0;
      });
  }, [filteredDonors, sortConfig]);

  const paginatedDonors = sortedDonors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Donor Tracking</h2>
        <div className="w-64">
            <select value={selectedYagam} onChange={(e) => setSelectedYagam(e.target.value)} className="w-full border p-2 rounded">
                {YAGAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex justify-between mb-4">
              <div className="font-bold text-sm uppercase">Filters</div>
              <button onClick={handleResetFilters} className="text-xs text-red-600 font-bold uppercase">Reset Filter</button>
          </div>
          <div className="grid grid-cols-5 gap-4">
              <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="text-sm p-2 border rounded">
                  <option value="">All States</option>
                  {Object.keys(LOCATION_DATA).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {/* Other filters disabled or empty since LOCATION_DATA is empty */}
          </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[400px]">
          <div className="p-4 border-b flex justify-between items-center">
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border p-2 rounded w-64" />
          </div>
          <div className="p-4">
              {isLoading ? <div className="text-center">Loading...</div> : (
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 font-bold text-slate-500">
                          <tr>
                              <th className="p-3">Name</th>
                              <th className="p-3">Phone</th>
                              <th className="p-3">Profession</th>
                              <th className="p-3">Address</th>
                              <th className="p-3 text-right">Amount</th>
                          </tr>
                      </thead>
                      <tbody>
                          {paginatedDonors.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-slate-400">No donors found.</td></tr> : (
                              paginatedDonors.map(d => (
                                  <tr key={d.id} className="border-t">
                                      <td className="p-3">{d.name}</td>
                                      <td className="p-3">{d.phone}</td>
                                      <td className="p-3">{d.profession}</td>
                                      <td className="p-3">{d.address}</td>
                                      <td className="p-3 text-right">{d.amount}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              )}
          </div>
      </div>
    </div>
  );
};

export default DonorTracking;
