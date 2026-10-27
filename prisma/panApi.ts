/**
 * Official PAN Fetch & Verification API definition backed by Eko Platform Services (EPS).
 */
export function panApiData(categoryId: string, primaryProviderId: string, fallbackProviderId?: string) {
  return {
    categoryId,
    name: "PAN Fetch & Verification",
    slug: "pan-fetch",
    endpointPath: "/pan-verification/v1",
    httpMethod: "POST",
    description:
      "Instant PAN fetch and identity verification. Returns registered full name, PAN status, cardholder category, and verification timestamp directly from official databases.",
    useCase: "User KYC onboarding, merchant verification, banking pre-checks, and tax compliance.",
    status: "ACTIVE",
    defaultCostPrice: 1.3,
    defaultSellPrice: 2.2,
    defaultSetupFee: 0.0,
    requestSchema: JSON.stringify({
      pan_number: {
        type: "string",
        required: true,
        example: "ABCDE1234F",
        description: "10-character alphanumeric Indian PAN number",
      },
      client_order_id: {
        type: "string",
        required: false,
        example: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
        description: "Optional tracking order UUID",
      },
    }),
    responseSchema: JSON.stringify({
      success: true,
      response_code: "100",
      response_message: "Valid Authentication",
      colladome_order_id: "CDO_20261027_109283",
      client_order_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      result: {
        pan_number: "ABCDE1234F",
        full_name: "RAMESH KUMAR",
        category: "Individual",
        status: "VALID",
        upstream_rrn: "123456789",
      },
      status: "SUCCESS",
    }),
    providerMappings: {
      create: [
        {
          providerId: primaryProviderId,
          providerEndpoint: "/ekoapi/v3/tools/kyc/fetch-pan",
          providerMethod: "POST",
          priority: 1,
        },
        ...(fallbackProviderId
          ? [
              {
                providerId: fallbackProviderId,
                providerEndpoint: "/api/v1/in/identity/pan/lite",
                providerMethod: "POST",
                priority: 2,
              },
            ]
          : []),
      ],
    },
  };
}
