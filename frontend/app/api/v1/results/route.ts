import { NextResponse } from "next/server";

import { getFilteredResults, paginate, parseQueryFilters, sortForIndex } from "../../../../lib/results-data";

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseQueryFilters(searchParams);

  const filtered = await getFilteredResults(filters);
  const ordered = sortForIndex(filtered);
  const payload = paginate(ordered, searchParams.get("page"), searchParams.get("per_page"));

  return NextResponse.json(payload, { headers: RESPONSE_HEADERS });
}
