
import { KPI, RegionStat, TreeData, PendingUser, UserRole, DistributorStats, PrintBatch, InchargeStats, ReceiverBook, BookPage } from '../types';

export const getMockKPIs = (): KPI[] => [
  { label: 'Total Books Printed', value: '10,000', trend: 'neutral', color: 'blue' },
  { label: 'Books Distributed', value: '8,450', change: '+540', trend: 'up', color: 'indigo' },
  { label: 'Total Donations', value: '₹42.5L', change: '+12%', trend: 'up', color: 'emerald' },
  { label: 'Active Volunteers', value: '1,240', change: '+5', trend: 'up', color: 'orange' },
];

export const getSuperAdminKPIs = (): KPI[] => [
  { label: 'Total Books Printed', value: '25,000', trend: 'neutral', color: 'slate' },
  { label: 'Total Distributed', value: '18,500', change: '+12%', trend: 'up', color: 'indigo' },
  { label: 'Total Registered', value: '15,200', change: '+8%', trend: 'up', color: 'blue' },
  { label: 'Total Received', value: '14,800', change: '+5%', trend: 'up', color: 'emerald' },
  { label: 'Amount Collected', value: '₹1.2Cr', change: '+15%', trend: 'up', color: 'green' },
];

export const getDistributorStats = (): DistributorStats => ({
  totalPrinted: 25000,
  totalDistributed: 18500,
  totalRegistered: 15200,
  totalReceived: 14800,
  printedNotDistributed: 6500, // Printed - Distributed
  distributedNotRegistered: 3300, // Distributed - Registered
  registeredNotReceived: 400, // Registered - Received
});

export const getInchargeStats = (): InchargeStats => ({
  totalAssigned: 500,
  distributed: 350,
  pendingDetails: 150, // Assigned - Distributed
  amountCollected: 175000
});

export const mockBatches: PrintBatch[] = [
  { id: 'b1', batchName: 'HYD-OCT-23', totalBooks: 5000, bookSerialStart: 'A00001', bookSerialEnd: 'A05000', printedDate: '2023-10-01', status: 'Partially Distributed' },
  { id: 'b2', batchName: 'BLR-NOV-23', totalBooks: 3000, bookSerialStart: 'B00001', bookSerialEnd: 'B03000', printedDate: '2023-11-15', status: 'In Stock' },
  { id: 'b3', batchName: 'VIZ-SEP-23', totalBooks: 2000, bookSerialStart: 'C00001', bookSerialEnd: 'C02000', printedDate: '2023-09-10', status: 'Fully Distributed' },
];

export const getRegionStats = (): RegionStat[] => [
  { name: 'Hyderabad', booksDistributed: 2400, amountCollected: 1200000, printed: 3000, registered: 2100, received: 2000 },
  { name: 'Bangalore', booksDistributed: 1800, amountCollected: 950000, printed: 2500, registered: 1600, received: 1550 },
  { name: 'Vijayawada', booksDistributed: 1200, amountCollected: 600000, printed: 1500, registered: 1100, received: 1050 },
  { name: 'Vizag', booksDistributed: 900, amountCollected: 450000, printed: 1200, registered: 800, received: 780 },
  { name: 'Tirupati', booksDistributed: 600, amountCollected: 300000, printed: 800, registered: 550, received: 500 },
];

export const getBookStatusData = () => [
  { name: 'Printed', value: 1550, fill: '#94a3b8' }, 
  { name: 'Distributed', value: 3000, fill: '#6366f1' }, 
  { name: 'Registered', value: 2500, fill: '#3b82f6' }, 
  { name: 'Received', value: 2900, fill: '#10b981' }, 
  { name: 'Missing', value: 50, fill: '#ef4444' }, 
];

export const getMonthlyDonations = () => [
  { name: 'Jan', amount: 400000 },
  { name: 'Feb', amount: 300000 },
  { name: 'Mar', amount: 600000 },
  { name: 'Apr', amount: 800000 },
  { name: 'May', amount: 500000 },
  { name: 'Jun', amount: 950000 },
  { name: 'Jul', amount: 1100000 },
  { name: 'Aug', amount: 1250000 },
];

export const getPendingUsersMock = (): PendingUser[] => [
  { id: 'p1', name: 'Suresh Rao', role: UserRole.BOOK_DISTRIBUTOR, email: 'suresh@example.com', region: 'Telangana', isApproved: false, appliedDate: '2023-10-25' },
  { id: 'p2', name: 'Lakshmi Devi', role: UserRole.INCHARGE, email: 'lakshmi@example.com', region: 'Andhra Pradesh', isApproved: false, appliedDate: '2023-10-26' },
  { id: 'p3', name: 'Rajesh Kumar', role: UserRole.VOLUNTEER, email: 'rajesh@example.com', region: 'Karnataka', isApproved: false, appliedDate: '2023-10-27' },
];

export const getDistributionTreeData = (): TreeData[] => [
  {
    id: 'r1', name: 'Telangana Region', type: 'Region', booksCount: 5000, amount: 2500000,
    children: [
      {
        id: 'd1', name: 'Hyderabad District', type: 'District', booksCount: 3000, amount: 1500000,
        children: [
           { id: 'c1', name: 'Banjara Hills Center', type: 'Center', booksCount: 1000, amount: 500000 },
           { id: 'c2', name: 'Kukatpally Center', type: 'Center', booksCount: 2000, amount: 1000000 }
        ]
      },
      {
        id: 'd2', name: 'Warangal District', type: 'District', booksCount: 2000, amount: 1000000,
        children: []
      }
    ]
  },
  {
    id: 'r2', name: 'Andhra Pradesh Region', type: 'Region', booksCount: 4000, amount: 2000000,
    children: [
      { id: 'd3', name: 'Vizag District', type: 'District', booksCount: 2500, amount: 1250000 },
      { id: 'd4', name: 'Vijayawada District', type: 'District', booksCount: 1500, amount: 750000 }
    ]
  }
];

export const getInchargeBooks = () => [
  { id: 'bk1', name: 'Anjali Gupta', phone: '9848012345', books: 5, serials: 'B100-B105', status: 'Registered' },
  { id: 'bk2', name: 'Ramesh V', phone: '9848054321', books: 2, serials: 'B106-B107', status: 'Registered' },
  { id: 'bk3', name: 'Unassigned', phone: '-', books: 43, serials: 'B108-B150', status: 'Pending' },
];

export const leaderboardData = [
  { rank: 1, name: 'Hyderabad Central', type: 'Center', amount: 1250000 },
  { rank: 2, name: 'Ravi Sharma', type: 'Individual', amount: 540000 },
  { rank: 3, name: 'Bangalore District', type: 'District', amount: 420000 },
  { rank: 4, name: 'Anita Desai', type: 'Volunteer', amount: 150000 },
  { rank: 5, name: 'Chennai Zone', type: 'Autonomous', amount: 120000 },
];

// Receiver Mock Data
export const getReceiverBooks = (): ReceiverBook[] => [
  { 
    id: 'rb1', bookNumber: 'B-10045', batchName: 'HYD-OCT-23', status: 'Registered', 
    assignedToName: 'Ravi Kumar', assignedToPhone: '9848011111', pssmId: 'PSSM-555',
    totalPages: 20, filledPages: 8, totalAmount: 4000, assignedDate: '2023-10-15' 
  },
  { 
    id: 'rb2', bookNumber: 'B-10046', batchName: 'HYD-OCT-23', status: 'Registered', 
    assignedToName: 'Sita Sharma', assignedToPhone: '9848022222', pssmId: 'PSSM-556',
    totalPages: 20, filledPages: 20, totalAmount: 10000, assignedDate: '2023-10-15' 
  },
  { 
    id: 'rb3', bookNumber: 'B-09012', batchName: 'HYD-SEP-23', status: 'Received', 
    assignedToName: 'Anjali Gupta', assignedToPhone: '9848033333', pssmId: 'PSSM-120',
    totalPages: 20, filledPages: 20, totalAmount: 10000, assignedDate: '2023-09-01', receivedDate: '2023-10-01'
  },
  { 
    id: 'rb4', bookNumber: 'B-10099', batchName: 'HYD-OCT-23', status: 'Distributed', 
    assignedToName: 'Manoj Reddy', assignedToPhone: '9848044444', pssmId: 'PSSM-789',
    totalPages: 20, filledPages: 0, totalAmount: 0, assignedDate: '2023-10-28' 
  },
  { 
    id: 'rb5', bookNumber: 'B-10100', batchName: 'HYD-OCT-23', status: 'Registered', 
    assignedToName: 'Kavitha R', assignedToPhone: '9848055555', pssmId: 'PSSM-999',
    totalPages: 20, filledPages: 5, totalAmount: 2500, assignedDate: '2023-10-20' 
  },
];

export const getReceiverBookDetails = (bookId: string): BookPage[] => {
  // Generate 20 pages (Updated from 100)
  const pages: BookPage[] = [];
  for (let i = 1; i <= 20; i++) {
    // Fill first 8 pages randomly for "In Progress" simulation
    const isFilled = i <= 8; 
    pages.push({
      pageNumber: i,
      receiptNumber: isFilled ? `RCP-${1000 + i}` : undefined,
      receiverName: isFilled ? 'Anita Desai' : undefined,
      isFilled: isFilled,
      donorName: isFilled ? `Donor ${i}` : undefined,
      donorPhone: isFilled ? `98480${10000 + i}` : undefined,
      amount: isFilled ? 500 : undefined,
      donorAddress: isFilled ? 'Hyderabad, Telangana' : undefined,
      date: isFilled ? '2023-10-20' : undefined
    });
  }
  return pages;
};
