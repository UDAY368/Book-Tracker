import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { leaderboardData } from '../services/mockData';

const Leaderboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg text-white mb-8">
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
           <Trophy className="text-yellow-400" size={32} />
           Global Donation Leaderboard
        </h2>
        <p className="opacity-90">Recognizing the top contributors to the mission</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contributor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount Raised</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {leaderboardData.map((entry, index) => {
               let RankIcon = null;
               if (index === 0) RankIcon = <Medal className="text-yellow-500" />;
               if (index === 1) RankIcon = <Medal className="text-slate-400" />;
               if (index === 2) RankIcon = <Medal className="text-amber-700" />;

               return (
                <tr key={index} className={index < 3 ? 'bg-yellow-50/30' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <span className={`text-sm font-bold ${index < 3 ? 'text-slate-900' : 'text-slate-500'}`}>#{entry.rank}</span>
                       {RankIcon}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{entry.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{entry.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                    ₹{entry.amount.toLocaleString()}
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;