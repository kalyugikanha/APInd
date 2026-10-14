/**
 * Realistic Mock Engine for Sandbox API Keys & Testing.
 * Allows clients and prospective visitors to test without burning real upstream provider credits.
 */

export function generateMockPanResponse(panNumber: string) {
  const panUpper = (panNumber || "").toUpperCase();
  const isValidFormat = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panUpper);

  if (!isValidFormat) {
    return {
      status: "FAILED",
      data: {
        pan_number: panUpper,
        status: "INVALID",
        message: "Invalid PAN format. Must be 10 alphanumeric characters (e.g., ABCDE1234F).",
      },
    };
  }

  // Derive mock details based on 4th character
  const typeChar = panUpper[3];
  let category = "INDIVIDUAL";
  let name = "VIKRAM MALHOTRA";
  if (typeChar === "C") {
    category = "COMPANY";
    name = "COLLADOME TECH PRIVATE LIMITED";
  } else if (typeChar === "F") {
    category = "FIRM";
    name = "HORIZON VENTURES PARTNERSHIP";
  } else if (typeChar === "H") {
    category = "HUF";
    name = "MALHOTRA HINDU UNDIVIDED FAMILY";
  }

  return {
    status: "SUCCESS",
    data: {
      pan_number: panUpper,
      full_name: name,
      category,
      status: "VALID",
      pan_aadhaar_linked: true,
      date_of_birth_matched: true,
    },
  };
}

export function generateMockBankResponse(accountNumber: string, ifscCode: string, beneficiaryName?: string) {
  const ifscUpper = (ifscCode || "").toUpperCase();
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscUpper);

  if (!ifscValid) {
    return {
      status: "FAILED",
      data: {
        account_number: accountNumber,
        ifsc_code: ifscUpper,
        status: "INVALID_IFSC",
        message: "IFSC code format is invalid.",
      },
    };
  }

  const bankPrefix = ifscUpper.substring(0, 4);
  const bankNames: Record<string, string> = {
    HDFC: "HDFC BANK LIMITED",
    SBIN: "STATE BANK OF INDIA",
    ICIC: "ICICI BANK LIMITED",
    UTIB: "AXIS BANK",
    KKBK: "KOTAK MAHINDRA BANK",
  };
  const bankName = bankNames[bankPrefix] || "RESERVE BANK OF INDIA AFFILIATED";
  const nameAtBank = (beneficiaryName || "VIKRAM MALHOTRA").toUpperCase();
  const utr = `2026${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  return {
    status: "SUCCESS",
    data: {
      account_number: accountNumber,
      ifsc_code: ifscUpper,
      bank_name: bankName,
      name_at_bank: nameAtBank,
      beneficiary_name: beneficiaryName || nameAtBank,
      name_match_score: 98.5,
      utr_number: utr,
      status: "VERIFIED",
    },
  };
}

export function generateMockGstinResponse(gstin: string) {
  const gstinUpper = (gstin || "").toUpperCase();
  const isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstinUpper);

  if (!isValid) {
    return {
      status: "FAILED",
      data: {
        gstin: gstinUpper,
        status: "INVALID",
        message: "Invalid GSTIN format.",
      },
    };
  }

  return {
    status: "SUCCESS",
    data: {
      gstin: gstinUpper,
      legal_name: "ACME FINTECH SOLUTIONS PRIVATE LIMITED",
      trade_name: "ACME PAY",
      taxpayer_type: "REGULAR",
      status: "ACTIVE",
      registration_date: "2021-04-15",
      state: "Telangana",
    },
  };
}
