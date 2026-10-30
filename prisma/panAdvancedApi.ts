/**
 * Official PAN Advanced Verification API definition backed by Eko Platform Services (EPS).
 * Reference: https://eps.eko.in/docs/pan-advanced
 */
export function panAdvancedApiData(categoryId: string, primaryProviderId: string) {
  return {
    categoryId,
    name: "PAN Advanced Verification",
    slug: "pan-advanced",
    endpointPath: "/pan-advanced/v1",
    httpMethod: "POST",
    description:
      "Authoritative deep KYC verification returning registered name, name printed on card, PAN type, gender, DOB, masked Aadhaar, Aadhaar link status, and structured address.",
    useCase: "Deep enterprise KYC, high-value loan onboarding, merchant underwriting, and strict regulatory compliance.",
    status: "ACTIVE",
    defaultCostPrice: 2.04,
    defaultSellPrice: 3.5,
    defaultSetupFee: 5500.0,
    requestSchema: JSON.stringify({
      pan_number: {
        type: "string",
        required: true,
        example: "ABCDE1234F",
        description: "10-character alphanumeric Indian PAN number",
      },
      name: {
        type: "string",
        required: false,
        example: "Rajesh Kumar",
        description: "Optional individual's name for match scoring",
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
      colladome_order_id: "CDO_20261030_109283",
      client_order_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      result: {
        pan_number: "ABCDE1234F",
        registered_name: "Rajesh Kumar",
        name_on_card: "Rajesh Kumar",
        first_name: "Rajesh",
        last_name: "Kumar",
        category: "Individual",
        gender: "M",
        date_of_birth: "1994-08-29",
        masked_aadhaar: "XXXX XXXX 1234",
        aadhaar_linked: true,
        email: "ra******ar@example.com",
        mobile_number: "98******10",
        address: {
          full_address: "Woodland Heights, Ghatkopar, Mumbai, Maharashtra 400072",
          street: "Woodland Heights, Ghatkopar",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: 400072,
          country: "India",
        },
        status: "VALID",
      },
      status: "SUCCESS",
    }),
    providerMappings: {
      create: [
        {
          providerId: primaryProviderId,
          providerEndpoint: "/ekoapi/v3/tools/kyc/pan-advanced",
          providerMethod: "POST",
          priority: 1,
        },
      ],
    },
  };
}
