export interface GatewayResponse<T = any> {
  status: "SUCCESS" | "FAILED" | "TIMEOUT" | "ERROR";
  colladome_order_id: string;
  client_order_id?: string | null;
  timestamp: string;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

export interface PanVerificationData {
  pan_number: string;
  full_name: string;
  category: string; // INDIVIDUAL, COMPANY, FIRM, etc.
  status: "VALID" | "INVALID" | "DEACTIVATED";
  pan_aadhaar_linked: boolean;
  date_of_birth_matched?: boolean;
}

export interface BankVerificationData {
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  beneficiary_name: string;
  name_at_bank: string;
  name_match_score: number;
  utr_number: string;
  status: "VERIFIED" | "FAILED" | "INVALID_IFSC";
}

export interface ClientProfileWithDetails {
  id: string;
  clientCode: string | null;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  accountStatus: string;
  kycStatus: string;
  billingModel: string;
  creditLimit: number;
  companyName: string | null;
  brandName: string | null;
  businessType: string | null;
  businessPan: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  internalNotes?: string | null;
  createdAt: Date;
  wallet?: {
    balance: number;
    currency: string;
    lockedAmount: number;
  } | null;
  clientSettings?: {
    allowedIps: string[];
    sandboxIps: string[];
    allowedDomains: string[];
    webhookUrl: string | null;
    webhookSecret: string | null;
    lowBalanceAlert: number;
    alertEmail: string | null;
    alertPhone: string | null;
    rateLimitRpm: number;
    isLiveEnabled: boolean;
  } | null;
  apiKeys?: Array<{
    id: string;
    keyPrefix: string;
    keyHint: string;
    type: string;
    name: string;
    rateLimitRpm: number;
    isActive: boolean;
    lastUsedAt: Date | null;
    createdAt: Date;
  }>;
}
