
import { User, UserRole, AuthResponse, ApiError, PendingUser, DistributorStats, PrintBatch, InchargeStats, BulkImportResult, ReceiverBook, BookPage } from '../types';
import { getPendingUsersMock, getDistributorStats, mockBatches, getInchargeStats, getReceiverBooks, getReceiverBookDetails } from './mockData';

const API_DELAY = 300; // Fast response

// --- Centralized In-Memory Database (Clean Slate) ---

// 1. Batches (Inventory)
let memoryBatches: PrintBatch[] = [];

// 2. Distributions (Bulk Transfers)
let memoryDistributions: any[] = [];

// 3. Individual Books (The atomic unit of tracking)
interface GlobalBook {
    bookNumber: string;
    batchName: string;
    status: 'Distributed' | 'Registered' | 'Received';
    
    // Distribution Phase (from Incharge)
    distributorName: string;
    distributorPhone: string;
    distributionDate: string;
    distributionLocation: string; // State, District, Town

    // Registration Phase (to Receiver)
    recipientName?: string;
    recipientPhone?: string;
    recipientId?: string; // PSSM ID
    registrationDate?: string;
    registrationAddress?: string;

    // Submission Phase (Return)
    receivedDate?: string;
    totalPages: number;
    filledPages: number;
    totalAmount: number;
    paymentMode?: 'Online' | 'Offline';
    
    // Pages Data
    pages: BookPage[];
}

let memoryBooks: GlobalBook[] = [];

// --- API Implementation ---

export const api = {
  // --- Auth ---
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (password === 'password') { 
          const token = 'mock-jwt-token-' + Date.now();
          const user: User = { 
              id: 'u1', 
              name: 'Demo User', 
              email, 
              role: UserRole.SUPER_ADMIN, 
              isApproved: true,
              avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=0D9488&color=fff' 
          };
          resolve({ user, token });
        } else {
          reject({ message: 'Invalid credentials.' });
        }
      }, API_DELAY);
    });
  },

  register: async (formData: FormData): Promise<User> => {
    return new Promise((resolve) => setTimeout(() => resolve({
        id: `u${Date.now()}`,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as UserRole,
        isApproved: false
    }), API_DELAY));
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('pssm_user_session');
    return userStr ? JSON.parse(userStr) : null;
  },

  saveUserSession: (user: User) => {
    localStorage.setItem('pssm_user_session', JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem('pssm_user_session');
  },

  // --- Distributor Flow ---

  getBatches: async (): Promise<PrintBatch[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...memoryBatches]), API_DELAY));
  },

  saveBatch: async (batchData: any): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const existingIdx = memoryBatches.findIndex(b => b.id === batchData.id);
            if (existingIdx > -1) {
                memoryBatches[existingIdx] = { ...memoryBatches[existingIdx], ...batchData };
            } else {
                const newBatch = { ...batchData, id: `b-${Date.now()}`, remainingBooks: batchData.totalBooks };
                memoryBatches.unshift(newBatch);
            }
            resolve();
        }, API_DELAY);
    });
  },

  getDistributions: async (): Promise<any[]> => {
    return new Promise(resolve => {
        // Enrich distribution data with live stats from memoryBooks
        const enriched = memoryDistributions.map(d => {
            const linkedBooks = memoryBooks.filter(b => b.distributorName === d.name && b.batchName === d.batchName);
            const registered = linkedBooks.filter(b => b.status === 'Registered' || b.status === 'Received').length;
            const submitted = linkedBooks.filter(b => b.status === 'Received').length;
            return {
                ...d,
                registeredCount: registered,
                submittedCount: submitted,
                amountCollected: linkedBooks.reduce((sum, b) => sum + b.totalAmount, 0)
            };
        });
        setTimeout(() => resolve(enriched), API_DELAY);
    });
  },

  saveDistribution: async (distData: any): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            // 1. Create Distribution Record
            const newDist = { ...distData, id: distData.id || Date.now() };
            if (!distData.id) memoryDistributions.unshift(newDist);
            
            // 2. Generate Individual Books
            const booksToCreate: string[] = distData.bookChips || [];
            
            booksToCreate.forEach(num => {
                const existing = memoryBooks.find(b => b.bookNumber === num);
                if (!existing) {
                    memoryBooks.push({
                        bookNumber: num,
                        batchName: distData.batchName || 'Unknown Batch',
                        status: 'Distributed',
                        distributorName: distData.name,
                        distributorPhone: distData.phone,
                        distributionDate: distData.date,
                        distributionLocation: distData.address,
                        totalPages: 20,
                        filledPages: 0,
                        totalAmount: 0,
                        pages: []
                    });
                }
            });

            resolve();
        }, API_DELAY);
    });
  },

  getDistributorStats: async (): Promise<DistributorStats> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const totalPrinted = memoryBatches.reduce((sum, b) => sum + b.totalBooks, 0);
              const totalDistributed = memoryBooks.length;
              const totalRegistered = memoryBooks.filter(b => b.status !== 'Distributed').length;
              const totalReceived = memoryBooks.filter(b => b.status === 'Received').length;
              
              resolve({
                  totalPrinted,
                  totalDistributed,
                  totalRegistered,
                  totalReceived,
                  printedNotDistributed: Math.max(0, totalPrinted - totalDistributed),
                  distributedNotRegistered: Math.max(0, totalDistributed - totalRegistered),
                  registeredNotReceived: Math.max(0, totalRegistered - totalReceived)
              });
          }, API_DELAY);
      });
  },

  // --- Staff / Incharge Flow (Registration) ---

  getAllBooksForRegister: async (): Promise<any[]> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const books = memoryBooks.map(b => ({
                  bookNumber: b.bookNumber,
                  status: b.status === 'Distributed' ? 'Pending' : 'Registered',
                  recipientName: b.recipientName,
                  phone: b.recipientPhone,
                  pssmId: b.recipientId,
                  date: b.registrationDate,
                  address: b.registrationAddress,
                  locationState: b.distributionLocation?.split(',').pop()?.trim() || '',
                  locationDistrict: b.distributionLocation?.split(',').slice(-2)[0]?.trim() || '',
                  locationTown: b.distributionLocation?.split(',').slice(-3)[0]?.trim() || ''
              }));
              resolve(books);
          }, API_DELAY);
      });
  },

  registerBook: async (data: any): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const bookIdx = memoryBooks.findIndex(b => b.bookNumber === data.bookNumber);
              if (bookIdx > -1) {
                  memoryBooks[bookIdx] = {
                      ...memoryBooks[bookIdx],
                      status: 'Registered',
                      recipientName: data.recipientName,
                      recipientPhone: data.phone,
                      recipientId: data.pssmId,
                      registrationDate: data.date,
                      registrationAddress: `${data.town}, ${data.district}, ${data.state}`
                  };
              }
              resolve();
          }, API_DELAY);
      });
  },

  getInchargeStats: async (): Promise<InchargeStats> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const totalAssigned = memoryBooks.length;
              const distributed = memoryBooks.filter(b => b.status !== 'Distributed').length;
              resolve({
                  totalAssigned,
                  distributed,
                  pendingDetails: totalAssigned - distributed,
                  amountCollected: memoryBooks.reduce((sum, b) => sum + b.totalAmount, 0)
              });
          }, API_DELAY);
      });
  },

  // --- Receiver Flow (Submission & Donors) ---

  getReceiverBooks: async (): Promise<ReceiverBook[]> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const books: ReceiverBook[] = memoryBooks.map(b => ({
                  id: b.bookNumber,
                  bookNumber: b.bookNumber,
                  batchName: b.batchName,
                  status: b.status,
                  assignedToName: b.recipientName || 'Unknown',
                  assignedToPhone: b.recipientPhone || '',
                  pssmId: b.recipientId,
                  distributorName: b.distributorName,
                  totalPages: b.totalPages,
                  filledPages: b.filledPages,
                  totalAmount: b.totalAmount,
                  assignedDate: b.registrationDate || b.distributionDate,
                  receivedDate: b.receivedDate,
                  paymentMode: b.paymentMode
              }));
              resolve(books);
          }, API_DELAY);
      });
  },

  getReceiverBookDetails: async (bookId: string): Promise<BookPage[]> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const book = memoryBooks.find(b => b.bookNumber === bookId || b.bookNumber === bookId.replace('bk-', ''));
              if (book) {
                  if (book.pages && book.pages.length > 0) {
                      resolve(book.pages);
                  } else {
                      const emptyPages: BookPage[] = Array.from({length: 20}, (_, i) => ({
                          pageNumber: i + 1,
                          isFilled: false
                      }));
                      book.pages = emptyPages;
                      resolve(emptyPages);
                  }
              } else {
                  resolve([]);
              }
          }, API_DELAY);
      });
  },

  saveBookPage: async (bookId: string, pageData: BookPage): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const bookIdx = memoryBooks.findIndex(b => b.bookNumber === bookId);
              if (bookIdx > -1) {
                  const book = memoryBooks[bookIdx];
                  const pageIdx = book.pages.findIndex(p => p.pageNumber === pageData.pageNumber);
                  if (pageIdx > -1) {
                      book.pages[pageIdx] = pageData;
                  } else {
                      book.pages.push(pageData);
                  }
                  
                  const filled = book.pages.filter(p => p.isFilled).length;
                  const total = book.pages.reduce((sum, p) => sum + (p.amount || 0), 0);
                  
                  memoryBooks[bookIdx] = {
                      ...book,
                      filledPages: filled,
                      totalAmount: total
                  };
              }
              resolve();
          }, API_DELAY);
      });
  },

  submitBook: async (bookNumber: string, data: any): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const bookIdx = memoryBooks.findIndex(b => b.bookNumber === bookNumber);
              if (bookIdx > -1) {
                  memoryBooks[bookIdx] = {
                      ...memoryBooks[bookIdx],
                      status: 'Received',
                      receivedDate: data.submissionDate,
                      filledPages: data.pagesFilled,
                      totalAmount: data.amount,
                      paymentMode: data.paymentMode
                  };
              }
              resolve();
          }, API_DELAY);
      });
  },

  updateBookQuickStats: async (bookId: string, filledPages: number, amount: number, status: any, paymentMode: any): Promise<void> => {
      return api.submitBook(bookId, { submissionDate: new Date().toISOString(), pagesFilled: filledPages, amount, paymentMode });
  },
  
  saveBatchesBulk: async (items: any[]) => {
      for (const item of items) await api.saveBatch(item);
  },
  
  saveDistributionsBulk: async (items: any[]) => {
      for (const item of items) await api.saveDistribution(item);
  },

  registerRecipient: async (data: any) => { return api.registerBook({ ...data, bookNumber: data.startSerial, recipientName: data.name }); }
};
