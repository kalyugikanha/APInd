import { NextRequest } from "next/server";
import { handleGatewayRequest } from "@/lib/gateway/proxy";

export async function POST(req: NextRequest) {
  return handleGatewayRequest(req, "/pan-fetch/v1", "POST");
}

export async function GET(req: NextRequest) {
  return handleGatewayRequest(req, "/pan-fetch/v1", "GET");
}
