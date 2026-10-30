/**
 * Official Bank Account Verification (Pennyless) API definition backed by Eko Platform Services (EPS).
 * Reference: https://eps.eko.in/docs/bank-account-verification-pennyless
 */
export function bankPennylessApiData(categoryId: string, primaryProviderId: string) {
  return {
    categoryId,
    name: "Bank Account Verification (Pennyless)",
    slug: "bank-pennyless",
    endpointPath: "/bank-pennyless/v1",
    httpMethod: "POST",
    description:
      "Instant penny-less bank account validation. Validates account number + IFSC code and returns the verified registered beneficiary name without moving ₹1.",
    useCase: "Zero-risk vendor payout onboarding, salary disbursement checks, and merchant validation with no stray credits.",
    status: "ACTIVE",
    defaultCostPrice: 2.04,
    defaultSellPrice: 3.5,
    defaultSetupFee: 5500.0,
    requestSchema: JSON.stringify({
      account_number: {
        type: "string",
        required: true,
        example: "38759149196",
        description: "Complete bank account number to be verified",
      },
      ifsc: {
        type: "string",
        required: true,
        example: "SBIN0007515",
        description: "11-character alphanumeric bank IFSC code",
      },
      client_order_id: {
        type: "string",
        required: false,
        example: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
        description: "Optional client order tracking UUID",
      },
    }),
    responseSchema: JSON.stringify({
      success: true,
      response_code: "100",
      response_message: "Valid Authentication",
      colladome_order_id: "CDO_20261030_884920",
      client_order_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      result: {
        bank_account_no: "38759149196",
        bank_ifsc: "SBIN0007515",
        verified_beneficiary_name: "Master YASHWANT BASNETT",
        status: "VERIFIED",
        account_active: true,
      },
      status: "SUCCESS",
    }),
    providerMappings: {
      create: [
        {
          providerId: primaryProviderId,
          providerEndpoint: "/ekoapi/v3/tools/kyc/bank-acc-verify-pennyless",
          providerMethod: "POST",
          priority: 1,
        },
      ],
    },
  };
}
