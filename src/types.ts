export interface FeeTier {
  id: string;
  minCapital: number;
  maxCapital: number | null;
  feePercentage: number;
}

export interface Investor {
  id: string;
  investorName: string;
  password?: string;
  group?: string;
  baseCurrency?: string;
  status?: 'active' | 'suspended' | 'closed';
  joinedAt?: string;
  email?: string;
  phone?: string;
  country?: string;
  memberTier?: string;
  emailNotifications?: boolean;
  highWaterMark: number;
  startingCapital: number;
  lossCarryover: number;
  sharePercentage: number;
  individualProfitShare: number;
  feePercentage: number;
  customFeePercentage?: number | null;
  referredBy?: string;
  ibCommissionRate?: number;
  yourFee: number;
  netProfit: number;
  reinvestAmt: number; 
  cashPayout: number;
  endingCapital: number;
  qrCode: string;
  bankAccount: string;
  feeCollected: number;
  unpaidFee: number;
}

export interface AccessPermissions {
  canEditInvestors?: boolean;
  canManageTransactions?: boolean;
  canManageWithdrawals?: boolean;
  canSyncMT5?: boolean;
  canViewReports?: boolean;
  canViewAudit?: boolean;
  canManageSettings?: boolean;
  canViewAffiliates?: boolean;
}

export interface Manager {
  id: string;
  username: string;
  password?: string;
  name: string;
  role?: 'admin' | 'manager' | 'read_only' | 'custom';
  permissions?: AccessPermissions;
  baseCurrency?: string;
  mt5Server?: string;
  mt5Login?: string;
  mt5Password?: string;
  mt5RestApiUrl?: string;
  investorGroups?: string[];
  defaultInvestorGroup?: string;
  enableIBModule?: boolean;
  allowInvestorWithdrawals?: boolean;
  showTradingJournalToInvestors?: boolean;
  feeTiers?: FeeTier[];
  defaultFeePercentage?: number;
  brandName?: string;
  supportEmail?: string;
}

export interface Transaction {
  id: string;
  investorId?: string;
  type: 'deposit' | 'withdrawal' | 'fee_payment' | 'manager_withdrawal';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'rejected';
  notes?: string;
  referenceId?: string;
  method?: string;
  category?: 'Internal' | 'Bank' | 'Crypto' | 'Correction' | 'Other';
  receiptUrl?: string;
}

export interface TradingPeriod {
  id: string;
  date: string;
  totalProfitLoss: number;
}

export interface Trade {
  id: string;
  ticket: string;
  openTime: string;
  closeTime: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  sl?: number;
  tp?: number;
  entryReason?: string;
  exitReason?: string;
  notes?: string;
}

export interface InvestorSnapshot {
  investorId: string;
  investorName: string;
  startingCapital: number;
  netProfit: number;
  endingCapital: number;
}

export interface PeriodHistory {
  id: string;
  date: string;
  totalProfit: number;
  investorSnapshots: InvestorSnapshot[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  action: string;
  details: string;
  type: 'auth' | 'investor' | 'transaction' | 'system' | 'trade';
}
