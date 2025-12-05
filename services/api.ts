
import { User, UserRole, AuthResponse, ApiError, PendingUser, DistributorStats, PrintBatch, InchargeStats, BulkImportResult, ReceiverBook, BookPage } from '../types';
import { getPendingUsersMock, getDistributorStats, mockBatches, getInchargeStats, getReceiverBooks, getReceiverBookDetails } from './mockData';

const API_DELAY = 300; // Simulated network delay

// --- Persistence Helpers ---

const STORAGE_KEYS = {
  BATCHES: 'pssm_batches_v2',
  DISTRIBUTIONS: 'pssm_distributions_v2',
  BOOKS: 'pssm_books_v2',
  LOCATIONS: 'pssm_locations_v2',
  SESSION: 'pssm_user_session_v2',
  USERS: 'pssm_system_users_v2' // Added for User Info persistence
};

const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage`, error);
    return defaultValue;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage`, error);
  }
};

// --- Initial Data Setup ---

const getInitialLocations = () => {
  return {
    'Telangana': {
        'Hyderabad': {
            'Kukatpally': ['Main Center', 'Sub Center A'],
            'Hitech City': ['Cyber Towers']
        },
        'Ranga Reddy': {
            'Shamshabad': ['Airport Center']
        }
    },
    'Andhra Pradesh': {
        'Visakhapatnam': {
            'Gajuwaka': ['RK Center']
        }
    }
  };
};

// --- In-Memory State (Initialized from Storage) ---

// 1. Batches (Inventory)
let memoryBatches: PrintBatch[] = loadFromStorage(STORAGE_KEYS.BATCHES, []);

// 2. Distributions (Bulk Transfers)
let memoryDistributions: any[] = loadFromStorage(STORAGE_KEYS.DISTRIBUTIONS, []);

// 3. Locations (State -> District -> Town -> Center[])
let memoryLocations: Record<string, Record<string, Record<string, string[]>>> = loadFromStorage(STORAGE_KEYS.LOCATIONS, getInitialLocations());

// 4. Users (Office & People)
let memoryUsers: any[] = loadFromStorage(STORAGE_KEYS.USERS, []);

// 5. Individual Books (The atomic unit of tracking)
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
    
    // Granular Registration Location (For Filtering)
    registrationState?: string;
    registrationDistrict?: string;
    registrationTown?: string;
    registrationCenter?: string;
    pincode?: string;

    // Submission Phase (Return)
    receivedDate?: string;
    totalPages: number;
    filledPages: number; // This is the DECLARED count from Book Submit
    totalAmount: number;
    paymentMode?: 'Online' | 'Offline' | 'Check';
    transactionId?: string;
    checkNumber?: string;
    
    // Pages Data
    pages: BookPage[];
    
    // Derived
    donorUpdateDate?: string;
}

let memoryBooks: GlobalBook[] = loadFromStorage(STORAGE_KEYS.BOOKS, []);

// --- Helper Functions ---

// STRICT LOGIC: A book is "Donor Updated" ONLY if the entered donors match or exceed the declared filled pages.
// Even if submitted (Received), it is NOT "Donor Updated" until data entry is complete.
const isBookFullyUpdated = (b: GlobalBook) => {
    // It must be in 'Received' (Submitted) status first
    if (b.status !== 'Received') return false;
    
    const declared = b.filledPages || 0;
    if (declared === 0) return false;
    
    const entered = b.pages ? b.pages.filter(p => p.isFilled).length : 0;
    
    // Check count
    if (entered < declared) return false;

    // Also check Amount equality if strict (Requirement: "If the total book amount = sum of individual dornor amout")
    const totalEnteredAmount = b.pages ? b.pages.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;
    // Allow small float difference just in case
    if (Math.abs(totalEnteredAmount - (b.totalAmount || 0)) > 1) return false;

    return true;
};

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
    const userStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    return userStr ? JSON.parse(userStr) : null;
  },

  saveUserSession: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // --- Location Management ---
  getLocations: async (): Promise<Record<string, Record<string, Record<string, string[]>>>> => {
      return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(memoryLocations))), API_DELAY));
  },

  addLocation: async (data: { type: string, state: string, district?: string, town?: string, center?: string }): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const { type, state, district, town, center } = data;
              
              if (!memoryLocations[state]) memoryLocations[state] = {};

              if (type === 'District' && district) {
                  if (!memoryLocations[state][district]) memoryLocations[state][district] = {};
              } else if (type === 'Town' && district && town) {
                   if (!memoryLocations[state][district]) memoryLocations[state][district] = {};
                   if (!memoryLocations[state][district][town]) memoryLocations[state][district][town] = [];
              } else if (type === 'Center' && district && town && center) {
                   if (!memoryLocations[state][district]) memoryLocations[state][district] = {};
                   if (!memoryLocations[state][district][town]) memoryLocations[state][district][town] = [];
                   if (!memoryLocations[state][district][town].includes(center)) {
                       memoryLocations[state][district][town].push(center);
                   }
              }
              saveToStorage(STORAGE_KEYS.LOCATIONS, memoryLocations);
              resolve();
          }, API_DELAY);
      });
  },

  updateLocation: async (data: { type: string, oldName: string, newName: string, state: string, district?: string, town?: string }): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const { type, oldName, newName, state, district, town } = data;
              
              if (type === 'State') {
                  if (memoryLocations[oldName]) {
                      memoryLocations[newName] = memoryLocations[oldName];
                      delete memoryLocations[oldName];
                  }
              } else if (type === 'District' && state) {
                  if (memoryLocations[state] && memoryLocations[state][oldName]) {
                      memoryLocations[state][newName] = memoryLocations[state][oldName];
                      delete memoryLocations[state][oldName];
                  }
              } else if (type === 'Town' && state && district) {
                  if (memoryLocations[state] && memoryLocations[state][district] && memoryLocations[state][district][oldName]) {
                      memoryLocations[state][district][newName] = memoryLocations[state][district][oldName];
                      delete memoryLocations[state][district][oldName];
                  }
              } else if (type === 'Center' && state && district && town) {
                  if (memoryLocations[state] && memoryLocations[state][district] && memoryLocations[state][district][town]) {
                      const arr = memoryLocations[state][district][town];
                      const idx = arr.indexOf(oldName);
                      if (idx > -1) {
                          arr[idx] = newName;
                      }
                  }
              }
              saveToStorage(STORAGE_KEYS.LOCATIONS, memoryLocations);
              resolve();
          }, API_DELAY);
      });
  },

  deleteLocation: async (data: { type: string, state: string, district?: string, town?: string, center?: string }): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const { type, state, district, town, center } = data;
              if (type === 'State' && state) {
                  delete memoryLocations[state];
              } else if (type === 'District' && state && district) {
                  if (memoryLocations[state]) delete memoryLocations[state][district];
              } else if (type === 'Town' && state && district && town) {
                  if (memoryLocations[state] && memoryLocations[state][district]) delete memoryLocations[state][district][town];
              } else if (type === 'Center' && state && district && town && center) {
                  if (memoryLocations[state] && memoryLocations[state][district] && memoryLocations[state][district][town]) {
                      const arr = memoryLocations[state][district][town];
                      const idx = arr.indexOf(center);
                      if (idx > -1) arr.splice(idx, 1);
                  }
              }
              saveToStorage(STORAGE_KEYS.LOCATIONS, memoryLocations);
              resolve();
          }, API_DELAY);
      });
  },

  importLocations: async (newLocations: any): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              // Check for the specific structure: { States: { "StateName": { Districts: [...] } } }
              if (newLocations && newLocations["States"]) {
                  const statesObj = newLocations["States"];
                  Object.keys(statesObj).forEach(rawStateKey => {
                      // Normalize state name (e.g. "Andhra_Pradesh" -> "Andhra Pradesh")
                      const stateName = rawStateKey.replace(/_/g, ' ');
                      
                      if (!memoryLocations[stateName]) memoryLocations[stateName] = {};
                      
                      const stateData = statesObj[rawStateKey];
                      if (stateData && stateData["Districts"] && Array.isArray(stateData["Districts"])) {
                          stateData["Districts"].forEach((distObj: any) => {
                              const districtName = distObj["District_Name"];
                              if (districtName) {
                                  if (!memoryLocations[stateName][districtName]) {
                                      memoryLocations[stateName][districtName] = {};
                                  }
                                  
                                  if (distObj["Mandals"] && Array.isArray(distObj["Mandals"])) {
                                      distObj["Mandals"].forEach((mandal: string) => {
                                          if (!memoryLocations[stateName][districtName][mandal]) {
                                              // Initialize with empty array for centers
                                              memoryLocations[stateName][districtName][mandal] = [];
                                          }
                                      });
                                  }
                              }
                          });
                      }
                  });
              } else {
                  // Fallback: Legacy deep merge logic for simple structure
                  Object.keys(newLocations).forEach(state => {
                      if (!memoryLocations[state]) memoryLocations[state] = {};
                      
                      Object.keys(newLocations[state]).forEach(district => {
                          if (!memoryLocations[state][district]) memoryLocations[state][district] = {};
                          
                          Object.keys(newLocations[state][district]).forEach(town => {
                              if (!memoryLocations[state][district][town]) memoryLocations[state][district][town] = [];
                              
                              const existingCenters = memoryLocations[state][district][town];
                              const newCenters = newLocations[state][district][town];
                              
                              if (Array.isArray(newCenters)) {
                                  newCenters.forEach((center: string) => {
                                      if (!existingCenters.includes(center)) {
                                          existingCenters.push(center);
                                      }
                                  });
                              }
                          });
                      });
                  });
              }
              
              saveToStorage(STORAGE_KEYS.LOCATIONS, memoryLocations);
              resolve();
          }, API_DELAY);
      });
  },

  // --- User Info Management ---
  getUsers: async (): Promise<any[]> => {
      return new Promise(resolve => setTimeout(() => resolve([...memoryUsers]), API_DELAY));
  },

  saveUser: async (userData: any): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const existingIdx = memoryUsers.findIndex(u => u.id === userData.id);
              if (existingIdx > -1) {
                  memoryUsers[existingIdx] = { ...memoryUsers[existingIdx], ...userData };
              } else {
                  memoryUsers.unshift({ ...userData, id: userData.id || `u-${Date.now()}` });
              }
              saveToStorage(STORAGE_KEYS.USERS, memoryUsers);
              resolve();
          }, API_DELAY);
      });
  },

  deleteUser: async (userId: string): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              memoryUsers = memoryUsers.filter(u => u.id !== userId);
              saveToStorage(STORAGE_KEYS.USERS, memoryUsers);
              resolve();
          }, API_DELAY);
      });
  },

  // --- Super Admin Stats ---
  getSuperAdminStats: async (): Promise<any> => {
      return new Promise(resolve => {
          setTimeout(() => {
              // 1. Aggregates
              const printed = memoryBatches.reduce((sum, b) => sum + b.totalBooks, 0);
              const distributed = memoryBooks.length;
              const registered = memoryBooks.filter(b => b.status === 'Registered' || b.status === 'Received').length;
              const submitted = memoryBooks.filter(b => b.status === 'Received').length;
              const donorUpdated = memoryBooks.filter(isBookFullyUpdated).length;
              
              const amount = memoryBooks.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
              const donors = memoryBooks.reduce((sum, b) => sum + (b.filledPages || 0), 0);

              // 2. Breakdown Data
              const locationAggregation: Record<string, any> = {};
              
              if (memoryBooks.length > 0) {
                  memoryBooks.forEach(b => {
                      const locName = b.registrationDistrict || b.registrationTown || (b.distributionLocation || "").split(',').slice(-2)[0]?.trim() || 'Unknown';
                      
                      if (!locationAggregation[locName]) {
                          locationAggregation[locName] = { 
                              name: locName, 
                              amount: 0, 
                              donorCount: 0, 
                              Distributed: 0, 
                              Registered: 0, 
                              Submitted: 0 
                          };
                      }
                      
                      const entry = locationAggregation[locName];
                      entry.Distributed += 1;
                      
                      if (b.status === 'Registered' || b.status === 'Received') {
                          entry.Registered += 1;
                      }
                      
                      if (b.status === 'Received') {
                          entry.Submitted += 1;
                          entry.amount += (b.totalAmount || 0);
                          entry.donorCount += (b.filledPages || 0);
                      }
                  });
              }

              const breakdownData = Object.values(locationAggregation);

              resolve({
                  stats: { printed, distributed, registered, submitted, donorUpdated, donors, amount },
                  breakdownData
              });
          }, API_DELAY);
      });
  },
  
  // --- Leaderboard Data ---
  getLeaderboardData: async (filters: { type: string, state: string, district: string, town: string }): Promise<any[]> => {
      return new Promise(resolve => {
          setTimeout(() => {
              let result: any[] = [];
              const { type, state, district, town } = filters;

              // Helper: Check location match
              const matchLocation = (itemState: string = '', itemDistrict: string = '', itemTown: string = '') => {
                  if (state && itemState !== state) return false;
                  if (district && itemDistrict !== district) return false;
                  if (town && itemTown !== town) return false;
                  return true;
              };

              if (type === 'Donor') {
                  // Flatten all donors from books
                  memoryBooks.forEach(book => {
                      if (book.pages) {
                          book.pages.forEach(page => {
                              if (page.isFilled) {
                                  // Use page location if available, else book location
                                  const pgState = page.state || book.registrationState;
                                  const pgDist = page.district || book.registrationDistrict;
                                  const pgTown = page.town || book.registrationTown;

                                  if (matchLocation(pgState, pgDist, pgTown)) {
                                      result.push({
                                          id: `${book.bookNumber}-p${page.pageNumber}`,
                                          type: 'Donor',
                                          name: page.donorName || 'Unknown',
                                          contact: page.donorPhone,
                                          email: page.email,
                                          profession: page.profession,
                                          location: `${pgTown || ''}, ${pgDist || ''}`,
                                          amount: page.amount || 0,
                                          // Full details for modal
                                          ...page
                                      });
                                  }
                              }
                          });
                      }
                  });
              } else if (type === 'Recipient') {
                  const recipientMap: Record<string, any> = {};
                  
                  memoryBooks.forEach(book => {
                      if (!book.recipientName) return;
                      // Group by Name + Phone for uniqueness
                      const key = `${book.recipientName}-${book.recipientPhone || ''}`;
                      
                      // Check Location Filter
                      const bookState = book.registrationState;
                      const bookDist = book.registrationDistrict;
                      const bookTown = book.registrationTown;
                      
                      if (!matchLocation(bookState, bookDist, bookTown)) return;

                      if (!recipientMap[key]) {
                          recipientMap[key] = {
                              id: key,
                              type: 'Recipient',
                              name: book.recipientName,
                              contact: book.recipientPhone || '',
                              location: book.registrationAddress || '',
                              amount: 0,
                              totalDonors: 0,
                              totalBooks: 0, // Reuse property for book count
                              // Additional info for modal
                              state: bookState,
                              district: bookDist,
                              town: bookTown,
                              pincode: book.pincode
                          };
                      }
                      
                      recipientMap[key].amount += (book.totalAmount || 0);
                      recipientMap[key].totalDonors += (book.filledPages || 0);
                      recipientMap[key].totalBooks += 1;
                  });
                  
                  result = Object.values(recipientMap);
              } else {
                  // Incharge Aggregation (Individual, Center, District, Autonomous)
                  // 1. Group Books by Distributor Name
                  const distributorMap: Record<string, { totalAmount: number, bookCount: number, books: any[] }> = {};
                  
                  memoryBooks.forEach(book => {
                      const dName = book.distributorName;
                      if (!dName) return;
                      
                      if (!distributorMap[dName]) {
                          distributorMap[dName] = { totalAmount: 0, bookCount: 0, books: [] };
                      }
                      // Sum collected amounts
                      distributorMap[dName].totalAmount += (book.totalAmount || 0);
                      distributorMap[dName].bookCount += 1;
                      distributorMap[dName].books.push(book);
                  });

                  // 2. Join with Distribution Registry to get Type/Entity Info
                  Object.keys(distributorMap).forEach(dName => {
                      // Find metadata from distributions array (most recent match usually preferred)
                      const distMeta = memoryDistributions.find(d => d.name === dName);
                      
                      if (distMeta) {
                          // Filter by requested Type (if not 'All')
                          if (type !== 'All' && distMeta.type !== type) return;
                          
                          // Parse address for location filtering
                          // Simple parsing based on standard format: Town, District, State
                          const addrParts = (distMeta.address || '').split(',').map((s:any) => s.trim());
                          const dState = addrParts[addrParts.length - 1]?.split(' - ')[0] || '';
                          const dDist = addrParts[addrParts.length - 2] || '';
                          const dTown = addrParts[addrParts.length - 3] || '';

                          if (matchLocation(dState, dDist, dTown)) {
                              result.push({
                                  id: distMeta.id || dName,
                                  type: distMeta.type, // 'Individual', 'Center', etc.
                                  typeName: distMeta.entityName, // The specific name of Center/District body
                                  name: dName,
                                  contact: distMeta.phone,
                                  location: distMeta.address,
                                  totalBooks: distributorMap[dName].bookCount,
                                  amount: distributorMap[dName].totalAmount
                              });
                          }
                      }
                  });
              }

              // Sort by Amount DESC
              result.sort((a, b) => b.amount - a.amount);

              resolve(result);
          }, API_DELAY);
      });
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
                const newBatch = { 
                    ...batchData, 
                    id: `b-${Date.now()}`, 
                    remainingBooks: batchData.totalBooks 
                };
                memoryBatches.unshift(newBatch);
            }
            saveToStorage(STORAGE_KEYS.BATCHES, memoryBatches);
            resolve();
        }, API_DELAY);
    });
  },

  getDistributions: async (): Promise<any[]> => {
    return new Promise(resolve => {
        const enriched = memoryDistributions.map(d => {
            const linkedBooks = memoryBooks.filter(b => b.distributorName === d.name && b.distributionDate === d.date);
            const registered = linkedBooks.filter(b => b.status === 'Registered' || b.status === 'Received').length;
            const submitted = linkedBooks.filter(b => b.status === 'Received').length;
            const donorUpdated = linkedBooks.filter(isBookFullyUpdated).length;
            
            const bookDetails = linkedBooks.map(b => ({
                number: b.bookNumber,
                status: b.status, 
                isDonorUpdated: isBookFullyUpdated(b)
            }));
            
            if (bookDetails.length === 0 && d.bookChips) {
                 d.bookChips.forEach((chip: string) => {
                     bookDetails.push({ number: chip, status: 'Distributed', isDonorUpdated: false });
                 });
            }

            return {
                ...d,
                registeredCount: registered,
                submittedCount: submitted,
                donorUpdatedCount: donorUpdated,
                amountCollected: linkedBooks.reduce((sum, b) => sum + b.totalAmount, 0),
                bookDetails: bookDetails.sort((a,b) => a.number.localeCompare(b.number)) 
            };
        });
        setTimeout(() => resolve(enriched), API_DELAY);
    });
  },

  getBookLifecycle: async (bookNumber: string): Promise<any> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const book = memoryBooks.find(b => b.bookNumber === bookNumber);
              if (book) {
                  const isDonorUpdated = isBookFullyUpdated(book);
                  const donorUpdateDate = isDonorUpdated ? (book.donorUpdateDate || book.receivedDate || new Date().toISOString()) : null;

                  resolve({ ...book, isDonorUpdated, donorUpdateDate });
              } else {
                  resolve(null);
              }
          }, API_DELAY);
      });
  },

  saveDistribution: async (distData: any): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newDist = { ...distData, id: distData.id || Date.now() };
            if (!distData.id) memoryDistributions.unshift(newDist);
            else {
                const idx = memoryDistributions.findIndex(d => d.id === distData.id);
                if (idx > -1) memoryDistributions[idx] = newDist;
            }
            saveToStorage(STORAGE_KEYS.DISTRIBUTIONS, memoryDistributions);
            
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
                } else {
                    existing.distributorName = distData.name;
                    existing.distributorPhone = distData.phone;
                    existing.distributionLocation = distData.address;
                }
            });
            saveToStorage(STORAGE_KEYS.BOOKS, memoryBooks);
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
              const donorUpdated = memoryBooks.filter(isBookFullyUpdated).length;

              resolve({
                  totalPrinted,
                  totalDistributed,
                  totalRegistered,
                  totalReceived,
                  printedNotDistributed: Math.max(0, totalPrinted - totalDistributed),
                  distributedNotRegistered: Math.max(0, totalDistributed - totalRegistered),
                  registeredNotReceived: Math.max(0, totalRegistered - totalReceived),
                  donorUpdated: donorUpdated
              });
          }, API_DELAY);
      });
  },

  // --- Other Methods (unchanged but necessary for compilation) ---
  getAllBooksForRegister: async (): Promise<any[]> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const books = memoryBooks.map(b => ({
                  bookNumber: b.bookNumber,
                  status: b.status === 'Distributed' ? 'Pending' : 'Registered',
                  inchargeName: b.distributorName,
                  inchargePhone: b.distributorPhone,
                  recipientName: b.recipientName,
                  phone: b.recipientPhone,
                  pssmId: b.recipientId,
                  date: b.registrationDate,
                  address: b.registrationAddress,
                  locationState: b.registrationState,
                  locationDistrict: b.registrationDistrict,
                  locationTown: b.registrationTown,
                  center: b.registrationCenter,
                  pincode: b.pincode
              }));
              resolve(books);
          }, API_DELAY);
      });
  },

  registerBook: async (data: any): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const targets = data.bookNumbers || [data.bookNumber];
              targets.forEach((bookNum: string) => {
                  const bookIdx = memoryBooks.findIndex(b => b.bookNumber === bookNum);
                  if (bookIdx > -1) {
                      const constructedAddress = data.address 
                          ? data.address 
                          : `${data.specificAddress ? data.specificAddress + ', ' : ''}${data.center ? data.center + ', ' : ''}${data.town}, ${data.district}, ${data.state}${data.pincode ? ' - ' + data.pincode : ''}`;

                      memoryBooks[bookIdx] = {
                          ...memoryBooks[bookIdx],
                          status: 'Registered',
                          recipientName: data.recipientName,
                          recipientPhone: data.phone,
                          recipientId: data.pssmId,
                          registrationDate: data.date,
                          registrationAddress: constructedAddress,
                          registrationState: data.state,
                          registrationDistrict: data.district,
                          registrationTown: data.town,
                          registrationCenter: data.center,
                          pincode: data.pincode
                      };
                  }
              });
              saveToStorage(STORAGE_KEYS.BOOKS, memoryBooks);
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

  getReceiverBooks: async (): Promise<ReceiverBook[]> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const books = memoryBooks.map(b => {
                  const declared = b.filledPages || 0; 
                  const entered = b.pages ? b.pages.filter(p => p.isFilled).length : 0; 
                  return {
                    id: b.bookNumber,
                    bookNumber: b.bookNumber,
                    batchName: b.batchName,
                    status: b.status,
                    assignedToName: b.recipientName || 'Unknown',
                    assignedToPhone: b.recipientPhone || '',
                    pssmId: b.recipientId,
                    distributorName: b.distributorName,
                    totalPages: b.totalPages,
                    filledPages: declared,
                    enteredDonors: entered,
                    totalAmount: b.totalAmount,
                    assignedDate: b.registrationDate || b.distributionDate,
                    receivedDate: b.receivedDate,
                    paymentMode: b.paymentMode,
                    transactionId: b.transactionId,
                    checkNumber: b.checkNumber,
                    state: b.registrationState,
                    district: b.registrationDistrict,
                    town: b.registrationTown,
                    center: b.registrationCenter,
                    address: b.registrationAddress,
                    isDonorUpdated: isBookFullyUpdated(b)
                  };
              });
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

  getAllDonors: async (): Promise<any[]> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const allDonors: any[] = [];
              memoryBooks.forEach(book => {
                  if (book.pages) {
                      book.pages.forEach(page => {
                          if (page.isFilled) {
                              allDonors.push({
                                  id: `${book.bookNumber}-p${page.pageNumber}`,
                                  receiptNumber: page.receiptNumber || 'N/A',
                                  name: page.donorName || 'Unknown',
                                  phone: page.donorPhone || 'N/A',
                                  email: page.email || 'N/A',
                                  gender: page.gender || 'N/A',
                                  profession: page.profession || 'N/A',
                                  idProofType: page.idProofType,
                                  idProofNumber: page.idProofNumber,
                                  address: page.donorAddress || 'N/A',
                                  pincode: page.pincode || '',
                                  amount: page.amount || 0,
                                  paymentMode: page.paymentMode || 'Offline',
                                  transactionId: page.transactionId,
                                  checkNumber: page.checkNumber,
                                  bookNumber: book.bookNumber,
                                  state: page.state || book.registrationState || '',
                                  district: page.district || book.registrationDistrict || '',
                                  town: page.town || book.registrationTown || '',
                                  yagam: "Dhyana Maha Yagam - 4" 
                              });
                          }
                      });
                  }
              });
              resolve(allDonors);
          }, API_DELAY);
      });
  },

  saveBookPage: async (bookId: string, pageData: BookPage): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const bookIdx = memoryBooks.findIndex(b => b.bookNumber === bookId || b.bookNumber === bookId.replace('bk-', ''));
              if (bookIdx > -1) {
                  const book = memoryBooks[bookIdx];
                  if (!book.pages) book.pages = [];
                  
                  const pageIdx = book.pages.findIndex(p => p.pageNumber === pageData.pageNumber);
                  if (pageIdx > -1) {
                      book.pages[pageIdx] = pageData;
                  } else {
                      book.pages.push(pageData);
                  }
                  
                  memoryBooks[bookIdx] = {
                      ...book,
                      donorUpdateDate: new Date().toISOString()
                  };
                  saveToStorage(STORAGE_KEYS.BOOKS, memoryBooks);
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
                  const currentFilled = memoryBooks[bookIdx].filledPages;
                  const newFilled = data.pagesFilled !== undefined ? data.pagesFilled : currentFilled;
                  
                  memoryBooks[bookIdx] = {
                      ...memoryBooks[bookIdx],
                      status: 'Received',
                      receivedDate: data.submissionDate,
                      filledPages: newFilled,
                      totalAmount: data.amount,
                      paymentMode: data.paymentMode,
                      transactionId: data.transactionId,
                      checkNumber: data.checkNumber
                  };
                  saveToStorage(STORAGE_KEYS.BOOKS, memoryBooks);
              }
              resolve();
          }, API_DELAY);
      });
  },
  
  getAllBooksLifecycle: async (): Promise<any[]> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const result = memoryBooks.map(b => {
                  const isFullyUpdated = isBookFullyUpdated(b);
                  let status = b.status === 'Received' ? 'Submitted' : b.status;
                  if (isFullyUpdated) status = 'Donor Updated'; 

                  return {
                      id: b.bookNumber,
                      bookNumber: b.bookNumber,
                      status: status, 
                      distributorName: b.distributorName,
                      distributorPhone: b.distributorPhone,
                      distributionDate: b.distributionDate,
                      distributionAddress: b.distributionLocation,
                      recipientName: b.recipientName,
                      recipientPhone: b.recipientPhone,
                      registrationDate: b.registrationDate,
                      registrationAddress: b.registrationAddress,
                      submissionDate: b.receivedDate,
                      paymentMode: b.paymentMode,
                      totalDonors: b.filledPages,
                      donationAmount: b.totalAmount,
                      isDonorUpdated: isFullyUpdated,
                      donorUpdateDate: b.donorUpdateDate || b.receivedDate
                  };
              });
              resolve(result);
          }, API_DELAY);
      });
  },

  saveBatchesBulk: async (items: any[]) => { for (const item of items) await api.saveBatch(item); },
  saveDistributionsBulk: async (items: any[]) => { for (const item of items) await api.saveDistribution(item); },
  registerRecipient: async (data: any) => { return api.registerBook({ ...data, bookNumbers: [data.startSerial], recipientName: data.name }); }
};