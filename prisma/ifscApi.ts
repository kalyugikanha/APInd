/**
 * Official IFSC Code Verification API definition.
 * Shared by the full seed (fresh DB) and the non-destructive catalog sync (existing DB).
 */
export function ifscApiData(categoryId: string, primaryProviderId: string) {
  return {
    categoryId,
    name: "IFSC Code Verification",
    slug: "ifsc-verification",
    endpointPath: "/ifsc-verification/v1",
    httpMethod: "POST",
    description:
      "Validates 11-character Indian Financial System Code (IFSC) and returns real-time verified bank branch details including bank name, branch address, contact, MICR, UPI, NEFT, IMPS, and RTGS support status.",
    useCase: "Bank branch lookup, penny drop pre-validation, IMPS/NEFT routing, and vendor payout onboarding.",
    status: "ACTIVE",
    defaultCostPrice: 0.5,
    defaultSellPrice: 1.2,
    requestSchema: JSON.stringify({
      ifsc: {
        type: "string",
        required: true,
        example: "THRS0000XXX",
        description: "11-character alphanumeric Indian bank IFSC code",
      },
      mode: { type: "string", required: false, example: "sync", description: "Execution mode ('sync')" },
      consent: { type: "string", required: false, example: "Y", description: "User consent (Y/N)" },
      consent_text: {
        type: "string",
        required: false,
        example: "I hear by declare my consent agreement for fetching my information via Colladome API",
        description: "Consent declaration text",
      },
      task_id: {
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
      colladome_order_id: "CDO_20261016_883291",
      client_order_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      result: {
        upi: false,
        bank: "Thrissur District Co-Operative Bank",
        city: "KODUNGALLUR",
        ifsc: "THRS0000XXX",
        imps: true,
        micr: "680800002",
        neft: true,
        rtgs: true,
        state: "KERALA",
        branch: "KODUNGALLUR",
        centre: "THRISSUR",
        address: "MAIN ROAD, KODUNGALLUR, THRISSUR DISTRICT, KERALA 680664",
        contact: "0480-2802244",
        district: "THRISSUR",
        bank_code: "THRS",
      },
      timestamp: "2026-10-16T12:35:00.000Z",
    }),
    providerMappings: {
      create: [
        {
          providerId: primaryProviderId,
          providerEndpoint: "/api/v1/in/utility/ifsc/lite",
          providerMethod: "POST",
          priority: 1,
          requestTransform: JSON.stringify({
            mode: "sync",
            data: { ifsc: "data.ifsc", consent: "data.consent", consent_text: "data.consent_text" },
            task_id: "colladome_order_id",
          }),
          responseExtract: JSON.stringify({
            result: "result",
            upstream_task_id: "task_id",
            upstream_group_id: "group_id",
            upstream_request_id: "request_id",
          }),
        },
      ],
    },
  };
}
