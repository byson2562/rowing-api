import { NextResponse } from "next/server";

import { buildFiltersResponse, parseQueryFilters } from "../../../../../lib/results-data";

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseQueryFilters(searchParams);

  return NextResponse.json(await buildFiltersResponse(filters), { headers: RESPONSE_HEADERS });
}
