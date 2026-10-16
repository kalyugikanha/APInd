import { NextRequest } from "next/server";
import { handleGatewayRequest } from "@/lib/gateway/proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const endpointPath = `/${(params.slug || []).join("/")}`;
  return handleGatewayRequest(req, endpointPath, "POST");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const endpointPath = `/${(params.slug || []).join("/")}`;
  return handleGatewayRequest(req, endpointPath, "GET");
}
