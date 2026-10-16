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

export function generateMockIfscResponse(ifscCode: string) {
  const ifscUpper = (ifscCode || "").trim().toUpperCase();
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscUpper) || ifscUpper.length === 11;

  if (!ifscValid) {
    return {
      status: "FAILED",
      success: false,
      response_code: "104",
      response_message: "Invalid IFSC format. Must be an 11-character alphanumeric code.",
      result: null,
    };
  }

  const bankCode = ifscUpper.substring(0, 4);
  const knownBanks: Record<
    string,
    {
      bank: string;
      state: string;
      city: string;
      address: string;
      micr: string;
      contact: string;
      branch: string;
      centre: string;
      district: string;
      upi: boolean;
    }
  > = {
    SBIN: {
      bank: "State Bank of India",
      state: "MAHARASHTRA",
      city: "MUMBAI",
      branch: "MUMBAI MAIN",
      centre: "MUMBAI",
      address: "SAMACHAAR MARG, FORT, MUMBAI, MAHARASHTRA 400023",
      contact: "022-22661234",
      district: "GREATER MUMBAI",
      micr: "400002001",
      upi: true,
    },
    HDFC: {
      bank: "HDFC Bank Limited",
      state: "MAHARASHTRA",
      city: "MUMBAI",
      branch: "WORLI SANDOZ HOUSE",
      centre: "MUMBAI",
      address: "GROUND FLOOR, SANDOZ HOUSE, DR A B ROAD, WORLI, MUMBAI 400018",
      contact: "022-67564321",
      district: "MUMBAI",
      micr: "400240002",
      upi: true,
    },
    ICIC: {
      bank: "ICICI Bank Limited",
      state: "MAHARASHTRA",
      city: "MUMBAI",
      branch: "BANDRA KURLA COMPLEX",
      centre: "MUMBAI",
      address: "ICICI BANK TOWERS, BANDRA KURLA COMPLEX, MUMBAI 400051",
      contact: "022-26531414",
      district: "MUMBAI",
      micr: "400229002",
      upi: true,
    },
    UTIB: {
      bank: "Axis Bank",
      state: "MAHARASHTRA",
      city: "MUMBAI",
      branch: "CORPORATE OFFICE",
      centre: "MUMBAI",
      address: "AXIS HOUSE, WADIA INTERNATIONAL CENTRE, PANDURANG BUDHKAR MARG, WORLI, MUMBAI 400025",
      contact: "022-24252525",
      district: "MUMBAI",
      micr: "400211002",
      upi: true,
    },
    KKBK: {
      bank: "Kotak Mahindra Bank",
      state: "MAHARASHTRA",
      city: "MUMBAI",
      branch: "NARIMAN POINT",
      centre: "MUMBAI",
      address: "BAKHTAWAR, NARIMAN POINT, MUMBAI 400021",
      contact: "022-66006022",
      district: "MUMBAI",
      micr: "400485002",
      upi: true,
    },
    PUNB: {
      bank: "Punjab National Bank",
      state: "DELHI",
      city: "NEW DELHI",
      branch: "CONNAUGHT PLACE",
      centre: "NEW DELHI",
      address: "ECE HOUSE, CONNAUGHT PLACE, NEW DELHI 110001",
      contact: "011-23321456",
      district: "CENTRAL DELHI",
      micr: "110024002",
      upi: true,
    },
    BARB: {
      bank: "Bank of Baroda",
      state: "GUJARAT",
      city: "VADODARA",
      branch: "MANDVI",
      centre: "VADODARA",
      address: "P B NO 18, MANDVI, VADODARA, GUJARAT 390006",
      contact: "0265-2412345",
      district: "VADODARA",
      micr: "390012002",
      upi: true,
    },
    THRS: {
      bank: "Thrissur District Co-Operative Bank",
      state: "KERALA",
      city: "KODUNGALLUR",
      branch: "KODUNGALLUR",
      centre: "THRISSUR",
      address: "MAIN ROAD, KODUNGALLUR, THRISSUR DISTRICT, KERALA 680664",
      contact: "0480-2802244",
      district: "THRISSUR",
      micr: "680800002",
      upi: false,
    },
  };

  const bankInfo = knownBanks[bankCode] || {
    bank: `${bankCode} BANK LIMITED`,
    state: "MAHARASHTRA",
    city: "MUMBAI",
    branch: "COMMERCIAL BRANCH",
    centre: "MUMBAI",
    address: `COMMERCIAL BRANCH, ${bankCode} TOWER, FINANCIAL DISTRICT, MUMBAI 400001`,
    contact: "022-49876543",
    district: "GREATER MUMBAI",
    micr: `${Math.floor(100000000 + Math.random() * 900000000)}`,
    upi: true,
  };

  return {
    status: "SUCCESS",
    success: true,
    response_code: "100",
    response_message: "Valid Authentication",
    result: {
      upi: bankInfo.upi,
      bank: bankInfo.bank,
      city: bankInfo.city,
      ifsc: ifscUpper,
      imps: true,
      micr: bankInfo.micr,
      neft: true,
      rtgs: true,
      state: bankInfo.state,
      branch: bankInfo.branch,
      centre: bankInfo.centre,
      address: bankInfo.address,
      contact: bankInfo.contact,
      district: bankInfo.district,
      bank_code: bankCode,
    },
  };
}
