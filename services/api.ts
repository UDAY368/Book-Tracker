import { User, UserRole, AuthResponse, ApiError, PendingUser, DistributorStats, PrintBatch, InchargeStats, BulkImportResult, ReceiverBook, BookPage } from '../types';
import { getPendingUsersMock, getDistributorStats, mockBatches, getInchargeStats, getReceiverBooks, getReceiverBookDetails } from './mockData';

const API_DELAY = 600; // Simulate network latency
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Mock database for demo purposes
let MOCK_USER_BASE: Partial<User> = {
  id: 'u1',
  name: 'Demo User',
  isApproved: true,
  avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=0D9488&color=fff'
};

// --- In-Memory Storage for Persistence ---
// These variables persist as long as the app is loaded (spa session)

// Initialize batches with intelligent defaults for remainingBooks if missing
let memoryBatches: PrintBatch[] = mockBatches.map(b => ({
  ...b,
  remainingBooks: b.remainingBooks !== undefined ? b.remainingBooks : (
      b.status === 'Fully Distributed' ? 0 : 
      b.status === 'Partially Distributed' ? Math.floor(b.totalBooks * 0.6) : 
      b.totalBooks
  )
}));

let memoryDistributions: any[] = [
    { 
      id: 1, 
      date: '2023-10-12', 
      name: 'Ravi Kumar', 
      phone: '+91 98765 43210', 
      type: 'Individual', 
      range: 'B001 - B010', 
      count: 10, 
      status: 'Distributed',
      batchName: 'HYD-OCT-23', // Added Batch Name
      registeredCount: 6,
      registeredSeries: ['B001', 'B002', 'B003', 'B004', 'B005', 'B006'],
      submittedCount: 2,
      submittedSeries: ['B001', 'B002']
    },
    { 
      id: 2, 
      date: '2023-10-14', 
      name: 'Sita Sharma', 
      phone: '+91 98765 11111', 
      type: 'Individual', 
      range: 'B011 - B030', 
      count: 20, 
      status: 'Distributed',
      batchName: 'HYD-OCT-23', // Added Batch Name
      registeredCount: 15,
      registeredSeries: ['B011 - B025'],
      submittedCount: 10,
      submittedSeries: ['B011 - B020']
    },
    { 
      id: 3, 
      date: '2023-10-15', 
      name: 'Hyd Center', 
      phone: '+91 98765 22222', 
      type: 'Center', 
      range: 'B031 - B130', 
      count: 100, 
      status: 'Distributed',
      batchName: 'BLR-NOV-23', // Added Batch Name
      registeredCount: 45,
      registeredSeries: ['B031 - B075'],
      submittedCount: 0,
      submittedSeries: []
    },
];

// Stateful storage for Receiver Books
let storedReceiverBooks: ReceiverBook[] | null = null;

const STORAGE_KEY = 'pssm_user_session';

export const api = {
  // Login with Real API fallback to Mock
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'pending@pssm.org') {
          reject({ message: 'Your account is currently under review by the administrator.', code: 403 });
          return;
        }

        if (password === 'password') { 
          const token = 'mock-jwt-token-' + Date.now();
          resolve({
            user: { ...MOCK_USER_BASE, email, role: UserRole.SUPER_ADMIN } as User,
            token
          });
        } else {
          reject({ message: 'Invalid credentials provided. Please check your email and password.' });
        }
      }, API_DELAY);
    });
  },

  register: async (formData: FormData): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: `u${Date.now()}`,
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          role: formData.get('role') as UserRole,
          isApproved: false,
        };
        resolve(newUser);
      }, API_DELAY);
    });
  },

  importBooks: async (file: File): Promise<{ count: number; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ count: 150, message: 'Successfully imported 150 records' });
      }, 1500);
    });
  },

  // --- Admin Features ---

  getPendingUsers: async (): Promise<PendingUser[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getPendingUsersMock()), 600);
    });
  },

  approveUser: async (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Approved user ${userId}`);
        resolve();
      }, 500);
    });
  },

  rejectUser: async (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Rejected user ${userId}`);
        resolve();
      }, 500);
    });
  },

  exportData: async (type: 'books' | 'users' | 'financials'): Promise<void> => {
    console.log(`Exporting ${type}...`);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  },

  // --- Distributor Features (UPDATED FOR PERSISTENCE) ---

  getDistributorStats: async (): Promise<DistributorStats> => {
    return new Promise((resolve) => {
       setTimeout(() => resolve(getDistributorStats()), 600);
    });
  },

  // -- Distributions CRUD --
  getDistributions: async (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve([...memoryDistributions]), 400);
    });
  },

  saveDistribution: async (item: any): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (item.id && memoryDistributions.some(d => d.id === item.id)) {
                // Update
                memoryDistributions = memoryDistributions.map(d => d.id === item.id ? item : d);
            } else {
                // Create
                const newItem = { ...item, id: item.id || Date.now() };
                memoryDistributions = [newItem, ...memoryDistributions];
            }
            resolve();
        }, 400);
    });
  },

  saveDistributionsBulk: async (items: any[]): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            memoryDistributions = [...items, ...memoryDistributions];
            resolve();
        }, 600);
    });
  },

  deleteDistribution: async (id: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            memoryDistributions = memoryDistributions.filter(d => d.id !== id);
            resolve();
        }, 400);
    });
  },

  // -- Batches CRUD --
  getBatches: async (): Promise<PrintBatch[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...memoryBatches]), 500);
    });
  },

  createBatch: async (batchData: any): Promise<void> => {
    // Legacy name, mapping to saveBatch
    return api.saveBatch(batchData);
  },

  saveBatch: async (batchData: any): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const batch = { ...batchData, id: batchData.id || `b${Date.now()}` };
        // Ensure remainingBooks is set if new
        if (batch.remainingBooks === undefined) {
             batch.remainingBooks = batch.totalBooks;
        }

        const idx = memoryBatches.findIndex(b => b.id === batch.id);
        if (idx >= 0) {
            memoryBatches[idx] = batch;
        } else {
            memoryBatches = [batch, ...memoryBatches];
        }
        resolve();
      }, 500);
    });
  },

  saveBatchesBulk: async (items: any[]): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Ensure remainingBooks is initialized
            const processedItems = items.map(i => ({
                ...i,
                remainingBooks: i.remainingBooks ?? i.totalBooks
            }));
            memoryBatches = [...processedItems, ...memoryBatches];
            resolve();
        }, 600);
    });
  },

  deleteBatch: async (id: string | number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            memoryBatches = memoryBatches.filter(b => b.id != id); // loose comparison for string/number id mismatch
            resolve();
        }, 400);
    });
  },

  // --- Incharge Features ---

  getInchargeStats: async (): Promise<InchargeStats> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getInchargeStats()), 600);
    });
  },

  registerRecipient: async (data: any): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Recipient Registered', data);
        resolve();
      }, 800);
    });
  },

  inchargeBulkImport: async (file: File): Promise<BulkImportResult[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const results: BulkImportResult[] = [
          { row: 1, status: 'success', message: 'Valid record', data: { name: 'Ravi', books: 10 } },
          { row: 2, status: 'success', message: 'Valid record', data: { name: 'Sita', books: 5 } },
          { row: 3, status: 'error', message: 'Invalid Phone Number format', data: { name: 'Unknown', phone: '123' } },
          { row: 4, status: 'success', message: 'Valid record', data: { name: 'Gopal', books: 2 } },
          { row: 5, status: 'error', message: 'Book serials overlap with existing records', data: { serial: 'B005' } },
        ];
        resolve(results);
      }, 1500);
    });
  },

  // --- Book Receiver Features ---

  getReceiverBooks: async (): Promise<ReceiverBook[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!storedReceiverBooks) {
          storedReceiverBooks = getReceiverBooks();
        }
        resolve(storedReceiverBooks);
      }, 600);
    });
  },

  getReceiverBookDetails: async (bookId: string): Promise<BookPage[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getReceiverBookDetails(bookId)), 700);
    });
  },

  saveBookPage: async (bookId: string, pageData: BookPage): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (storedReceiverBooks) {
          const idx = storedReceiverBooks.findIndex(b => b.id === bookId);
          if (idx !== -1) {
             const book = storedReceiverBooks[idx];
             storedReceiverBooks[idx] = {
               ...book,
               filledPages: Math.min(20, book.filledPages + 1),
               totalAmount: book.totalAmount + (pageData.amount || 0)
             };
          }
        }
        resolve();
      }, 400);
    });
  },

  updateBookQuickStats: async (bookId: string, filledPages: number, amount: number, status: 'Registered' | 'Received' | 'Distributed'): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!storedReceiverBooks) storedReceiverBooks = getReceiverBooks();
        
        const idx = storedReceiverBooks.findIndex(b => b.id === bookId);
        if (idx !== -1) {
          storedReceiverBooks[idx] = {
            ...storedReceiverBooks[idx],
            filledPages,
            totalAmount: amount,
            status
          };
        }
        resolve();
      }, 500);
    });
  },

  uploadBookExcel: async (bookId: string, file: File): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Uploaded Excel for book ${bookId}`);
        resolve();
      }, 1500);
    });
  },

  finalizeBook: async (bookId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!storedReceiverBooks) storedReceiverBooks = getReceiverBooks();
        const idx = storedReceiverBooks.findIndex(b => b.id === bookId);
        if (idx !== -1) {
          storedReceiverBooks[idx].status = 'Received';
        }
        resolve();
      }, 1000);
    });
  },

  // --- Auth Helpers ---

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  saveUserSession: (user: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('auth_token', 'mock-token');
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('auth_token');
  }
};