
import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Search, MapPin, User, ArrowUpDown, Building2, Globe, Phone } from 'lucide-react';

const YAGAM_OPTIONS = ["Dhyana Maha Yagam - 1", "Dhyana Maha Yagam - 2", "Dhyana Maha Yagam - 3", "Dhyana Maha Yagam - 4"];
const LOCATION_DATA: Record<string, string[]> = {};

const Leaderboard: React.FC = () => {
  const [selectedYagam, setSelectedYagam] = useState("Dhyana Maha Yagam - 4");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
        setData([]); // Empty
        setLoading(false);
    }, 300);
  }, [selectedYagam]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Trophy className="text-yellow-500" size={28} /> Donation Leaderboard</h2>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center min-h-[400px] flex items-center justify-center text-slate-400">
         {loading ? "Loading..." : "No data available."}
      </div>
    </div>
  );
};

export default Leaderboard;
