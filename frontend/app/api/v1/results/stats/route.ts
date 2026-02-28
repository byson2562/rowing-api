import { NextResponse } from "next/server";

import { buildStats, parseQueryFilters } from "../../../../../lib/results-data";

const VALID_GROUP_BY = new Set([
  "year_count",
  "organization_medals",
  "organization_golds",
  "event_count",
  "winner_time_trend",
]);
const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupBy = searchParams.get("group_by") ?? "";

  if (!VALID_GROUP_BY.has(groupBy)) {
    return NextResponse.json(
      {
        error:
          "group_by must be one of: year_count, organization_medals, organization_golds, event_count, winner_time_trend",
      },
      { status: 422 },
    );
  }

  const filters = parseQueryFilters(searchParams);
  return NextResponse.json({ group_by: groupBy, data: await buildStats(groupBy, filters) }, { headers: RESPONSE_HEADERS });
}
