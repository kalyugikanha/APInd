import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [categories, apis, providers] = await Promise.all([
      db.apiCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      db.api.findMany({
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
      requestSchema = "{}",
      responseSchema = "{}",
      primaryProviderId,
      primaryEndpoint,
      secondaryProviderId,
      secondaryEndpoint,
    } = body;

    if (!name || !endpointPath) {
      return NextResponse.json({ error: "API Name and Endpoint Path are required." }, { status: 400 });
    }

    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const firstCat = await db.apiCategory.findFirst({ orderBy: { sortOrder: "asc" } });
      if (firstCat) {
        finalCategoryId = firstCat.id;
      } else {
        const newCat = await db.apiCategory.create({
          data: {
            name: "General & Identity",
            slug: "general-identity",
            description: "Custom and platform integrated APIs",
          },
        });
        finalCategoryId = newCat.id;
      }
    }

    const cleanEndpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newApi = await db.api.create({
      data: {
        categoryId: finalCategoryId,
        name,
        slug: cleanSlug,
        endpointPath: cleanEndpoint,
        httpMethod,
        description: description || name,
        useCase,
        defaultCostPrice: Number(defaultCostPrice) || 0.0,
        defaultSellPrice: Number(defaultSellPrice) || 2.5,
        requestSchema: typeof requestSchema === "string" ? requestSchema : JSON.stringify(requestSchema),
        responseSchema: typeof responseSchema === "string" ? responseSchema : JSON.stringify(responseSchema),
        providerMappings: {
          create: [
            ...(primaryProviderId && primaryEndpoint
              ? [
                  {
                    providerId: primaryProviderId,
                    providerEndpoint: primaryEndpoint,
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
        providerMappings: { include: { provider: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `API '${name}' added successfully and routed to Colladome Gateway!`,
      api: newApi,
    });
  } catch (err: any) {
    console.error("API creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
