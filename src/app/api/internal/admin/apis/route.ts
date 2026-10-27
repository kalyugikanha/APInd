import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [categories, apis, providers] = await Promise.all([
      db.apiCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      db.api.findMany({
        where: { status: { not: "DEPRECATED" } },
        include: {
          category: true,
          providerMappings: {
            include: { provider: true },
            orderBy: { priority: "asc" },
          },
          _count: { select: { apiLogs: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.provider.findMany({ where: { isActive: true } }),
    ]);

    return NextResponse.json({ categories, apis, providers });
  } catch (err: any) {
    console.error("APIs fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Backwards-compatible rate update if apiId is provided in POST
    if (body.apiId && !body.name && !body.endpointPath) {
      const updated = await db.api.update({
        where: { id: body.apiId },
        data: {
          ...(body.defaultCostPrice !== undefined
            ? { defaultCostPrice: Number(body.defaultCostPrice) }
            : {}),
          ...(body.defaultSellPrice !== undefined
            ? { defaultSellPrice: Number(body.defaultSellPrice) }
            : {}),
          ...(body.defaultSetupFee !== undefined
            ? { defaultSetupFee: Number(body.defaultSetupFee) }
            : {}),
        },
      });
      return NextResponse.json({
        success: true,
        message: `Charges updated for ${updated.name}!`,
        api: updated,
      });
    }

    const {
      categoryId,
      name,
      slug,
      endpointPath,
      httpMethod = "POST",
      description,
      useCase,
      defaultCostPrice,
      defaultSellPrice,
      defaultSetupFee = 0.0,
      requestSchema = "{}",
      responseSchema = "{}",
      primaryProviderId,
      primaryEndpoint,
      upstreamUrl,
      secondaryProviderId,
      secondaryEndpoint,
    } = body;

    if (!name || !endpointPath) {
      return NextResponse.json(
        { error: "API Name and Colladome Endpoint Path are required." },
        { status: 400 }
      );
    }

    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const firstCat = await db.apiCategory.findFirst({ orderBy: { sortOrder: "asc" } });
      if (firstCat) {
        finalCategoryId = firstCat.id;
      } else {
        const newCat = await db.apiCategory.create({
          data: {
            name: "Banking & Financials",
            slug: "banking-financials",
            description: "Verification & financial utility APIs",
          },
        });
        finalCategoryId = newCat.id;
      }
    }

    // Normalize Colladome endpoint path (e.g., /pan-verification/v1/ -> /pan-verification/v1)
    const rawEndpoint = endpointPath.trim();
    const withLeadingSlash = rawEndpoint.startsWith("/") ? rawEndpoint : `/${rawEndpoint}`;
    const cleanEndpoint = withLeadingSlash.replace(/\/+$/, "") || "/";
    const cleanSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Resolve upstream provider (default to first active provider if not explicitly passed)
    let resolvedPrimaryProviderId = primaryProviderId;
    if (!resolvedPrimaryProviderId) {
      const primaryProv = await db.provider.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
      if (primaryProv) resolvedPrimaryProviderId = primaryProv.id;
    }

    // Extract providerEndpoint from upstreamUrl if provided
    let resolvedPrimaryEndpoint = primaryEndpoint;
    if (!resolvedPrimaryEndpoint && upstreamUrl) {
      try {
        const parsedUrl = new URL(upstreamUrl);
        resolvedPrimaryEndpoint = parsedUrl.pathname + parsedUrl.search;
      } catch {
        resolvedPrimaryEndpoint = upstreamUrl;
      }
    }

    const reqSchemaStr =
      typeof requestSchema === "string" ? requestSchema : JSON.stringify(requestSchema, null, 2);
    const resSchemaStr =
      typeof responseSchema === "string" ? responseSchema : JSON.stringify(responseSchema, null, 2);

    // Check if an API with this slug or endpointPath already exists
    const existing = await db.api.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { endpointPath: cleanEndpoint }],
      },
    });

    if (existing) {
      await db.apiProviderMapping.deleteMany({ where: { apiId: existing.id } });
      const updatedApi = await db.api.update({
        where: { id: existing.id },
        data: {
          categoryId: finalCategoryId,
          name,
          endpointPath: cleanEndpoint,
          httpMethod,
          description: description || name,
          useCase,
          status: "ACTIVE",
          defaultCostPrice: Number(defaultCostPrice) || 0.0,
          defaultSellPrice: Number(defaultSellPrice) || 2.5,
          defaultSetupFee: Number(defaultSetupFee) || 0.0,
          requestSchema: reqSchemaStr,
          responseSchema: resSchemaStr,
          providerMappings: {
            create: [
              ...(resolvedPrimaryProviderId && resolvedPrimaryEndpoint
                ? [
                    {
                      providerId: resolvedPrimaryProviderId,
                      providerEndpoint: resolvedPrimaryEndpoint,
                      providerMethod: httpMethod,
                      priority: 1,
                    },
                  ]
                : []),
              ...(secondaryProviderId && secondaryEndpoint
                ? [
                    {
                      providerId: secondaryProviderId,
                      providerEndpoint: secondaryEndpoint,
                      providerMethod: httpMethod,
                      priority: 2,
                    },
                  ]
                : []),
            ],
          },
        },
        include: {
          category: true,
          providerMappings: { include: { provider: true } },
        },
      });

      return NextResponse.json({
        success: true,
        message: `API '${name}' updated and live at ${cleanEndpoint}/!`,
        api: updatedApi,
      });
    }

    const newApi = await db.api.create({
      data: {
        categoryId: finalCategoryId,
        name,
        slug: cleanSlug,
        endpointPath: cleanEndpoint,
        httpMethod,
        description: description || name,
        useCase,
        status: "ACTIVE",
        defaultCostPrice: Number(defaultCostPrice) || 0.0,
        defaultSellPrice: Number(defaultSellPrice) || 2.5,
        defaultSetupFee: Number(defaultSetupFee) || 0.0,
        requestSchema: reqSchemaStr,
        responseSchema: resSchemaStr,
        providerMappings: {
          create: [
            ...(resolvedPrimaryProviderId && resolvedPrimaryEndpoint
              ? [
                  {
                    providerId: resolvedPrimaryProviderId,
                    providerEndpoint: resolvedPrimaryEndpoint,
                    providerMethod: httpMethod,
                    priority: 1,
                  },
                ]
              : []),
            ...(secondaryProviderId && secondaryEndpoint
              ? [
                  {
                    providerId: secondaryProviderId,
                    providerEndpoint: secondaryEndpoint,
                    providerMethod: httpMethod,
                    priority: 2,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        category: true,
        providerMappings: { include: { provider: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `API '${name}' deployed and live at ${cleanEndpoint}/!`,
      api: newApi,
    });
  } catch (err: any) {
    console.error("API creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apiId,
      name,
      endpointPath,
      httpMethod,
      defaultCostPrice,
      defaultSellPrice,
      defaultSetupFee,
      status,
      description,
      requestSchema,
      responseSchema,
      primaryProviderId,
      primaryEndpoint,
    } = body;

    if (!apiId) {
      return NextResponse.json({ error: "apiId is required" }, { status: 400 });
    }

    const cleanEndpoint = endpointPath
      ? (endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`).replace(/\/+$/, "")
      : undefined;

    const updated = await db.api.update({
      where: { id: apiId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(cleanEndpoint !== undefined ? { endpointPath: cleanEndpoint } : {}),
        ...(httpMethod !== undefined ? { httpMethod } : {}),
        ...(defaultCostPrice !== undefined ? { defaultCostPrice: Number(defaultCostPrice) } : {}),
        ...(defaultSellPrice !== undefined ? { defaultSellPrice: Number(defaultSellPrice) } : {}),
        ...(defaultSetupFee !== undefined ? { defaultSetupFee: Number(defaultSetupFee) } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(requestSchema !== undefined
          ? {
              requestSchema:
                typeof requestSchema === "string" ? requestSchema : JSON.stringify(requestSchema),
            }
          : {}),
        ...(responseSchema !== undefined
          ? {
              responseSchema:
                typeof responseSchema === "string"
                  ? responseSchema
                  : JSON.stringify(responseSchema),
            }
          : {}),
      },
    });

    if (primaryProviderId && primaryEndpoint) {
      const existingPrimary = await db.apiProviderMapping.findFirst({
        where: { apiId, priority: 1 },
      });
      if (existingPrimary) {
        await db.apiProviderMapping.update({
          where: { id: existingPrimary.id },
          data: {
            providerId: primaryProviderId,
            providerEndpoint: primaryEndpoint,
          },
        });
      } else {
        await db.apiProviderMapping.create({
          data: {
            apiId,
            providerId: primaryProviderId,
            providerEndpoint: primaryEndpoint,
            providerMethod: updated.httpMethod,
            priority: 1,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `API '${updated.name}' updated successfully!`,
      api: updated,
    });
  } catch (err: any) {
    console.error("API PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "API id query parameter is required" }, { status: 400 });
    }

    // Find logs to remove dependent bank/pan reports cleanly
    const logs = await db.apiLog.findMany({ where: { apiId: id }, select: { id: true } });
    const logIds = logs.map((l) => l.id);

    if (logIds.length > 0) {
      await db.bankReport.deleteMany({ where: { apiLogId: { in: logIds } } });
      await db.panReport.deleteMany({ where: { apiLogId: { in: logIds } } });
      await db.apiLog.deleteMany({ where: { apiId: id } });
    }

    await db.clientPricing.deleteMany({ where: { apiId: id } });
    await db.apiProviderMapping.deleteMany({ where: { apiId: id } });
    await db.api.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "API endpoint removed from catalog.",
    });
  } catch (err: any) {
    console.error("API DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
