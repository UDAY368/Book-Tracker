

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  BOOK_DISTRIBUTOR = 'Book Distributor',
  INCHARGE = 'Incharge', // Center, District, Autonomous
  BOOK_RECEIVER = 'Book Receiver',
  STAFF = 'Staff',
  VOLUNTEER = 'Volunteer'
}

export enum BookStatus {
  PRINTED = 'Printed',
  DISTRIBUTED = 'Distributed',
  REGISTERED = 'Registered',
  RECEIVED = 'Received',
  MISSING = 'Missing'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  pssmId?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  isApproved: boolean;
  token?: string; // JWT Token
}

export interface PendingUser extends User {
  appliedDate: string;
  region: string;
}

export interface PrintBatch {
  id: string;
  batchName: string;
  totalBooks: number;
  remainingBooks?: number; // Track available stock separately from total printed
  bookSerialStart: string;
  bookSerialEnd: string;
  printedDate: string;
  printerName?: string;
  status: 'In Stock' | 'Partially Distributed' | 'Fully Distributed';
}

export interface Book {
  id: string;
  bookNumber: string;
  batchNumber: string;
  status: BookStatus;
  distributedTo?: string; // ID of Incharge or Individual
  assignedToName?: string;
  donorName?: string;
  donorPhone?: string;
  amountCollected?: number;
}

export interface BookPage {
  pageNumber: number;
  receiptNumber?: string;
  donorName?: string;
  donorPhone?: string;
  donorAddress?: string;
  receiverName?: string;
  amount?: number;
  date?: string;
  isFilled: boolean;
  // New fields for Donor Submit
  state?: string;
  district?: string;
  town?: string;
  paymentMode?: 'Online' | 'Offline';
  transactionId?: string;
  profession?: string; // Added profession
}

export interface ReceiverBook {
  id: string;
  bookNumber: string;
  batchName: string;
  status: 'Distributed' | 'Registered' | 'Received';
  assignedToName: string;   // The person returning the book
  assignedToPhone: string;  // Their phone number
  pssmId?: string;          // Their PSSM ID
  distributorName?: string; // Added to track who distributed it
  totalPages: number;       // Defaults to 20
  filledPages: number;
  totalAmount: number;
  assignedDate: string;
  receivedDate?: string;
  paymentMode?: 'Online' | 'Offline'; // New field for payment tracking
  pages?: BookPage[];       // Loaded on demand
  // Enriched location data for filtering
  state?: string;
  district?: string;
  town?: string;
  center?: string;
}

export interface KPI {
  label: string;
  value: string | number;
  change?: string; // e.g. "+12%"
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export interface DistributorStats {
  totalPrinted: number;
  totalDistributed: number;
  totalRegistered: number;
  totalReceived: number;
  printedNotDistributed: number;
  distributedNotRegistered: number;
  registeredNotReceived: number;
}

export interface InchargeStats {
  totalAssigned: number;
  distributed: number;
  pendingDetails: number;
  amountCollected: number;
}

export interface RegionStat {
  name: string;
  booksDistributed: number;
  amountCollected: number;
  printed?: number;
  registered?: number;
  received?: number;
}

export interface TreeData {
  id: string;
  name: string;
  type: 'Region' | 'District' | 'Center' | 'Individual';
  booksCount: number;
  amount: number;
  children?: TreeData[];
}

export interface BulkImportResult {
  row: number;
  status: 'success' | 'error';
  message: string;
  data: any;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  code?: number;
}