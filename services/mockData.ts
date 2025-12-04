

import { KPI, RegionStat, TreeData, PendingUser, DistributorStats, PrintBatch, InchargeStats, ReceiverBook, BookPage } from '../types';

export const getMockKPIs = (): KPI[] => [
  { label: 'Total Books Printed', value: '0', trend: 'neutral', color: 'blue' },
  { label: 'Books Distributed', value: '0', change: '0', trend: 'neutral', color: 'indigo' },
  { label: 'Total Donations', value: '₹0', change: '0%', trend: 'neutral', color: 'emerald' },
  { label: 'Active Volunteers', value: '0', change: '0', trend: 'neutral', color: 'orange' },
];

export const getSuperAdminKPIs = (): KPI[] => [
  { label: 'Total Books Printed', value: '0', trend: 'neutral', color: 'slate' },
  { label: 'Total Distributed', value: '0', change: '0%', trend: 'neutral', color: 'indigo' },
  { label: 'Total Registered', value: '0', change: '0%', trend: 'neutral', color: 'blue' },
  { label: 'Total Received', value: '0', change: '0%', trend: 'neutral', color: 'emerald' },
  { label: 'Amount Collected', value: '₹0', change: '0%', trend: 'neutral', color: 'green' },
];

export const getDistributorStats = (): DistributorStats => ({
  totalPrinted: 0,
  totalDistributed: 0,
  totalRegistered: 0,
  totalReceived: 0,
  printedNotDistributed: 0,
  distributedNotRegistered: 0,
  registeredNotReceived: 0,
  donorUpdated: 0
});

export const getInchargeStats = (): InchargeStats => ({
  totalAssigned: 0,
  distributed: 0,
  pendingDetails: 0,
  amountCollected: 0
});

export const mockBatches: PrintBatch[] = [];

export const getRegionStats = (): RegionStat[] => [];

export const getBookStatusData = () => [
  { name: 'Printed', value: 0, fill: '#94a3b8' }, 
  { name: 'Distributed', value: 0, fill: '#6366f1' }, 
  { name: 'Registered', value: 0, fill: '#3b82f6' }, 
  { name: 'Received', value: 0, fill: '#10b981' }, 
  { name: 'Missing', value: 0, fill: '#ef4444' }, 
];

export const getMonthlyDonations = () => [];

export const getPendingUsersMock = (): PendingUser[] => [];

export const getDistributionTreeData = (): TreeData[] => [];

export const getInchargeBooks = () => [];

export const leaderboardData = [];

// Receiver Mock Data
export const getReceiverBooks = (): ReceiverBook[] => [];

export const getReceiverBookDetails = (bookId: string): BookPage[] => {
  // Return empty pages structure ready for input
  const pages: BookPage[] = [];
  for (let i = 1; i <= 20; i++) {
    pages.push({
      pageNumber: i,
      isFilled: false,
    });
  }
  return pages;
};
