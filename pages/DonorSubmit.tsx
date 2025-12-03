
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, ChevronRight, ArrowLeft, 
  Loader2, IndianRupee, Printer, User,
  ChevronDown, ChevronUp, CheckCircle, Book, Save, Upload, Download, X,
  CreditCard, MapPin, AlertTriangle, ChevronLeft, ArrowUpDown, RefreshCw, Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import { ReceiverBook, BookPage } from '../types';

const LOCATION_DATA: Record<string, Record<string, string[]>> = {};

const YAGAM_OPTIONS = [
  "Dhyana Maha Yagam - 1", 
  "Dhyana Maha Yagam - 2", 
  "Dhyana Maha Yagam - 3", 
  "Dhyana Maha Yagam - 4"
];

const PROFESSIONS = ["Agriculture", "Business", "Technology", "State Govt", "Central Govt", "Student", "House Wife", "Others"];

const getCentersForTown = (town: string) => [];

const DonorSubmit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submitted' | 'info'>('submitted');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [books, setBooks] = useState<ReceiverBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<ReceiverBook | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [filterLocation, setFilterLocation] = useState({ state: '', district: '', town: '', center: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activePage, setActivePage] = useState<BookPage | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [donorDetailsCache, setDonorDetailsCache] = useState<Record<string, BookPage[]>>({});

  useEffect(() => {
    loadBooks();
  }, [selectedYagam]);

  const loadBooks = async () => {
    setLoading(true);
    const data = await api.getReceiverBooks();
    const submittedBooks = data.filter(b => b.status === 'Received');
    setBooks(submittedBooks);
    setLoading(false);
  };

  const filteredBooks = books.filter(b => b.bookNumber.toLowerCase().includes(searchQuery.toLowerCase()));
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleBookProcess = async (book: ReceiverBook) => {
    setSelectedBook(book);
    setView('detail');
    const pagesData = await api.getReceiverBookDetails(book.id);
    setPages(pagesData);
    setActivePage(pagesData[0]);
  };

  const handleBackToList = () => { setView('list'); setSelectedBook(null); };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !activePage) return;
    await api.saveBookPage(selectedBook.id, { ...activePage, isFilled: true, amount: Number(activePage.amount) || 0 });
    alert(`Page saved!`);
  };

  const handleToggleExpand = async (bookId: string) => {
      if (expandedBookId === bookId) { setExpandedBookId(null); return; }
      setExpandedBookId(bookId);
      if (!donorDetailsCache[bookId]) {
          const details = await api.getReceiverBookDetails(bookId);
          setDonorDetailsCache(prev => ({ ...prev, [bookId]: details }));
      }
  };

  if (view === 'detail') {
      return (
        <div className="space-y-4">
            <button onClick={handleBackToList} className="flex items-center text-slate-600"><ArrowLeft size={20} /> Back</button>
            <h2 className="text-xl font-bold">{selectedBook?.bookNumber}</h2>
            <div className="flex gap-4">
                <div className="w-1/3 bg-white p-4 border rounded">
                    <h3 className="font-bold mb-2">Pages</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {pages.map(page => (
                            <button key={page.pageNumber} onClick={() => setActivePage(page)} className={`p-2 border rounded ${activePage?.pageNumber === page.pageNumber ? 'bg-indigo-100' : ''}`}>{page.pageNumber}</button>
                        ))}
                    </div>
                </div>
                <div className="w-2/3 bg-white p-4 border rounded">
                    <h3 className="font-bold mb-2">Details for Page {activePage?.pageNumber}</h3>
                    {activePage && (
                        <form onSubmit={handleSavePage} className="space-y-3">
                            <input type="text" placeholder="Donor Name" value={activePage.donorName || ''} onChange={e => setActivePage({...activePage, donorName: e.target.value})} className="w-full border p-2 rounded" />
                            <input type="number" placeholder="Amount" value={activePage.amount || ''} onChange={e => setActivePage({...activePage, amount: Number(e.target.value)})} className="w-full border p-2 rounded" />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
       <div className="flex justify-between items-center gap-4 bg-white p-6 rounded-xl border border-slate-200">
         <h2 className="text-2xl font-bold text-slate-800">Donor Submission</h2>
       </div>

       <div className="bg-white rounded-lg border border-slate-200">
            <div className="flex border-b">
                <button onClick={() => setActiveTab('submitted')} className={`flex-1 py-4 font-bold ${activeTab==='submitted' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Submitted Books</button>
                <button onClick={() => setActiveTab('info')} className={`flex-1 py-4 font-bold ${activeTab==='info' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Donor Info</button>
            </div>
            <div className="p-6">
                {loading ? <div className="text-center"><Loader2 className="animate-spin inline"/></div> : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 font-bold text-slate-500">
                            <tr>
                                {activeTab === 'info' && <th className="p-3"></th>}
                                <th className="p-3">Book Number</th>
                                <th className="p-3">Recipient</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedBooks.map(book => (
                                <React.Fragment key={book.id}>
                                    <tr className="border-t hover:bg-slate-50">
                                        {activeTab === 'info' && (
                                            <td className="p-3"><button onClick={() => handleToggleExpand(book.id)}>{expandedBookId === book.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button></td>
                                        )}
                                        <td className="p-3 font-mono font-bold text-indigo-600">{book.bookNumber}</td>
                                        <td className="p-3">{book.assignedToName}</td>
                                        <td className="p-3 font-bold text-emerald-600">{book.totalAmount}</td>
                                        <td className="p-3 text-right">
                                            {activeTab === 'submitted' && <button onClick={() => handleBookProcess(book)} className="text-indigo-600 hover:underline">Submit Donors</button>}
                                        </td>
                                    </tr>
                                    {activeTab === 'info' && expandedBookId === book.id && (
                                        <tr><td colSpan={5} className="p-4 bg-slate-50">
                                            <div className="text-xs text-slate-500 italic">No donor details cached.</div>
                                        </td></tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
       </div>
    </div>
  );
};

export default DonorSubmit;
