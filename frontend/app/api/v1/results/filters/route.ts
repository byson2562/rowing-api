import { NextResponse } from "next/server";

import { buildFiltersResponse, parseQueryFilters } from "../../../../../lib/results-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseQueryFilters(searchParams);

  return NextResponse.json(await buildFiltersResponse(filters));
}
