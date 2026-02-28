import { NextResponse } from "next/server";

import { allResults, filterResults, paginate, parseQueryFilters, sortForIndex } from "../../../../lib/results-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseQueryFilters(searchParams);

  const filtered = filterResults(await allResults(filters), filters);
  const ordered = sortForIndex(filtered);
  const payload = paginate(ordered, searchParams.get("page"), searchParams.get("per_page"));

  return NextResponse.json(payload);
}
