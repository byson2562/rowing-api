"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Result = {
  id: number;
  year: number;
  competition_name: string;
  event_name: string;
  final_group: string;
  crew_name: string;
  organization: string;
  rank: number;
  time_seconds: number;
  time_display: string;
};

type StatPoint = { label: string; value: number };
type StatsResponse = { group_by: string; data: StatPoint[] };
type Pagination = { page: number; per_page: number; total_count: number; total_pages: number };
type ResultsResponse = { data: Result[]; pagination: Pagination };
type ActiveFilterChip = { key: string; text: string; onClear: () => void };
type FilterOptionsResponse = {
  years: number[];
  genders: string[];
  affiliation_types: string[];
  competition_categories: string[];
  final_groups: string[];
  competitions: string[];
  events: string[];
  organizations: string[];
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API_PREFIX = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";

function apiUrl(path: string): string {
  return `${API_PREFIX}${path}`;
}

function formatSecondsToTime(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? totalSeconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  const centiseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 100);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${centiseconds
    .toString()
    .padStart(2, "0")}`;
}

function formatSecondsForAxis(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? totalSeconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

type WrappedXAxisTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string };
};

function truncateLabel(label: string, maxChars = 6): string {
  if (label.length <= maxChars) return label;
  return `${label.slice(0, maxChars)}…`;
}

function renderWrappedXAxisTick({ x = 0, y = 0, payload }: WrappedXAxisTickProps) {
  const label = truncateLabel(String(payload?.value ?? ""), 6);
  const chars = Array.from(label);

  return (
    <text x={x} y={y} textAnchor="middle" fill="#6b7280" fontSize={11} dominantBaseline="hanging">
      {chars.map((char, index) => (
        <tspan key={`${char}-${index}`} x={x} dy={index === 0 ? 8 : 11}>
          {char}
        </tspan>
      ))}
    </text>
  );
}

export default function Page() {
  const [results, setResults] = useState<Result[]>([]);
  const [organizationMedals, setOrganizationMedals] = useState<StatPoint[]>([]);
  const [organizationGolds, setOrganizationGolds] = useState<StatPoint[]>([]);
  const [winnerTrend, setWinnerTrend] = useState<StatPoint[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 50, total_count: 0, total_pages: 0 });
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse>({
    years: [],
    genders: [],
    affiliation_types: [],
    competition_categories: [],
    final_groups: [],
    competitions: [],
    events: [],
    organizations: []
  });
  const [loading, setLoading] = useState(false);
  const resultsRequestRef = useRef(0);
  const filtersRequestRef = useRef(0);

  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [affiliationType, setAffiliationType] = useState("");
  const [event, setEvent] = useState("");
  const [finalGroup, setFinalGroup] = useState("");
  const [competition, setCompetition] = useState("");
  const [competitionCategory, setCompetitionCategory] = useState("");
  const [organization, setOrganization] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false);
  const [rank, setRank] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("50");
  const [pageInput, setPageInput] = useState("1");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const organizationGoldChartRef = useRef<HTMLDivElement | null>(null);
  const organizationMedalChartRef = useRef<HTMLDivElement | null>(null);
  const winnerTrendChartRef = useRef<HTMLDivElement | null>(null);
  const [organizationGoldChartWidth, setOrganizationGoldChartWidth] = useState(0);
  const [organizationMedalChartWidth, setOrganizationMedalChartWidth] = useState(0);
  const [winnerTrendChartWidth, setWinnerTrendChartWidth] = useState(0);

  const rankOptions = useMemo(() => Array.from({ length: 8 }, (_, index) => `${index + 1}`), []);
  const topOrganizationGolds = useMemo(() => organizationGolds.slice(0, 8), [organizationGolds]);
  const topOrganizationMedals = useMemo(() => organizationMedals.slice(0, 8), [organizationMedals]);
  const organizationBarChartHeight = 260;
  const genderTabOptions = useMemo(() => {
    const options = filterOptions.genders.filter((value) => value === "男子" || value === "女子");
    return ["", ...options];
  }, [filterOptions.genders]);

  const baseQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (year) params.set("year", year);
    if (gender) params.set("gender", gender);
    if (affiliationType) params.set("affiliation_type", affiliationType);
    if (event) params.set("event", event);
    if (finalGroup) params.set("final_group", finalGroup);
    if (competition) params.set("competition", competition);
    if (competitionCategory) params.set("competition_category", competitionCategory);
    if (organization) params.set("organization", organization);
    if (rank) params.set("rank", rank);
    return params.toString();
  }, [affiliationType, competition, competitionCategory, event, finalGroup, gender, organization, q, rank, year]);

  const resultsQuery = useMemo(() => {
    const params = new URLSearchParams(baseQuery);
    params.set("page", page.toString());
    params.set("per_page", perPage);
    return params.toString();
  }, [baseQuery, page, perPage]);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (gender) params.set("gender", gender);
    if (affiliationType) params.set("affiliation_type", affiliationType);
    if (competition) params.set("competition", competition);
    if (competitionCategory) params.set("competition_category", competitionCategory);
    if (event) params.set("event", event);
    if (finalGroup) params.set("final_group", finalGroup);
    if (organization) params.set("organization", organization);
    return params.toString();
  }, [affiliationType, competition, competitionCategory, event, finalGroup, gender, organization, year]);

  useEffect(() => {
    const requestId = resultsRequestRef.current + 1;
    resultsRequestRef.current = requestId;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setIsRefreshing(true);
      try {
        const [resultsRes, orgMedalRes, orgGoldRes, winnerTrendRes] = await Promise.all([
          fetch(apiUrl(`/v1/results?${resultsQuery}`), { signal: controller.signal }),
          fetch(apiUrl(`/v1/results/stats?group_by=organization_medals&${baseQuery}`), { signal: controller.signal }),
          fetch(apiUrl(`/v1/results/stats?group_by=organization_golds&${baseQuery}`), { signal: controller.signal }),
          event
            ? fetch(apiUrl(`/v1/results/stats?group_by=winner_time_trend&${baseQuery}`), { signal: controller.signal })
            : Promise.resolve(null)
        ]);

        const resultsData = (await resultsRes.json()) as ResultsResponse;
        const orgMedalData = (await orgMedalRes.json()) as StatsResponse;
        const orgGoldData = (await orgGoldRes.json()) as StatsResponse;

        if (requestId !== resultsRequestRef.current) return;

        setResults(Array.isArray(resultsData.data) ? resultsData.data : []);
        setPagination(
          resultsData.pagination ?? {
            page: page,
            per_page: Number(perPage),
            total_count: 0,
            total_pages: 0
          }
        );
        setOrganizationMedals(orgMedalData.data ?? []);
        setOrganizationGolds(orgGoldData.data ?? []);
        if (winnerTrendRes) {
          const winnerTrendData = (await winnerTrendRes.json()) as StatsResponse;
          setWinnerTrend(winnerTrendData.data ?? []);
        } else {
          setWinnerTrend([]);
        }
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        if (requestId === resultsRequestRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [baseQuery, event, page, perPage, resultsQuery]);

  useEffect(() => {
    const requestId = filtersRequestRef.current + 1;
    filtersRequestRef.current = requestId;
    const controller = new AbortController();

    const fetchFilterOptions = async () => {
      try {
        const response = await fetch(apiUrl(`/v1/results/filters?${filterQuery}`), { signal: controller.signal });
        const payload = (await response.json()) as FilterOptionsResponse;
        if (requestId !== filtersRequestRef.current) return;

        setFilterOptions({
          years: payload.years ?? [],
          genders: payload.genders ?? [],
          affiliation_types: payload.affiliation_types ?? [],
          competition_categories: payload.competition_categories ?? [],
          final_groups: payload.final_groups ?? [],
          competitions: payload.competitions ?? [],
          events: payload.events ?? [],
          organizations: payload.organizations ?? []
        });
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          console.error(error);
        }
      }
    };

    fetchFilterOptions();

    return () => {
      controller.abort();
    };
  }, [filterQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateChartWidths = () => {
      setOrganizationGoldChartWidth(Math.floor(organizationGoldChartRef.current?.clientWidth ?? 0));
      setOrganizationMedalChartWidth(Math.floor(organizationMedalChartRef.current?.clientWidth ?? 0));
      setWinnerTrendChartWidth(Math.floor(winnerTrendChartRef.current?.clientWidth ?? 0));
    };

    updateChartWidths();

    const observers: ResizeObserver[] = [];
    const observe = (element: HTMLDivElement | null) => {
      if (!element || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => {
        updateChartWidths();
      });
      observer.observe(element);
      observers.push(observer);
    };

    observe(organizationGoldChartRef.current);
    observe(organizationMedalChartRef.current);
    observe(winnerTrendChartRef.current);

    window.addEventListener("resize", updateChartWidths);
    window.addEventListener("orientationchange", updateChartWidths);

    return () => {
      observers.forEach((observer) => observer.disconnect());
      window.removeEventListener("resize", updateChartWidths);
      window.removeEventListener("orientationchange", updateChartWidths);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const refreshKey = "sw-refresh-once-v1";

    const clearStaleCaches = async () => {
      try {
        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
        }
      } catch (error) {
        console.error(error);
      }
    };

    const unregisterWorkers = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) return;
        await Promise.all(registrations.map((registration) => registration.unregister()));
        await clearStaleCaches();

        if (!sessionStorage.getItem(refreshKey)) {
          sessionStorage.setItem(refreshKey, "1");
          window.location.reload();
        }
      } catch (error) {
        console.error(error);
      }
    };

    unregisterWorkers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [affiliationType, competition, competitionCategory, event, finalGroup, gender, organization, q, rank, year]);

  useEffect(() => {
    setPageInput(page.toString());
  }, [page]);

  const clearFilters = () => {
    setQ("");
    setYear("");
    setGender("");
    setAffiliationType("");
    setEvent("");
    setFinalGroup("");
    setCompetition("");
    setCompetitionCategory("");
    setOrganization("");
    setOrganizationSearch("");
    setOrganizationMenuOpen(false);
    setRank("");
    setPage(1);
  };

  const rankCellClassName = (row: Result): string => {
    if (row.final_group !== "Final A") return "";
    if (row.rank === 1) return "medal-rank medal-rank-gold";
    if (row.rank === 2) return "medal-rank medal-rank-silver";
    if (row.rank === 3) return "medal-rank medal-rank-bronze";
    return "";
  };

  const activeFilters = useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    if (year) chips.push({ key: "year", text: `年: ${year}`, onClear: () => setYear("") });
    if (gender) chips.push({ key: "gender", text: `性別: ${gender}`, onClear: () => setGender("") });
    if (affiliationType) chips.push({ key: "affiliationType", text: `区分: ${affiliationType}`, onClear: () => setAffiliationType("") });
    if (competition) chips.push({ key: "competition", text: `大会: ${competition}`, onClear: () => setCompetition("") });
    if (competitionCategory) {
      chips.push({
        key: "competitionCategory",
        text: `大会カテゴリ: ${competitionCategory}`,
        onClear: () => setCompetitionCategory("")
      });
    }
    if (event) chips.push({ key: "event", text: `種目: ${event}`, onClear: () => setEvent("") });
    if (finalGroup) chips.push({ key: "finalGroup", text: `Final: ${finalGroup}`, onClear: () => setFinalGroup("") });
    if (organization) {
      chips.push({
        key: "organization",
        text: `団体: ${organization}`,
        onClear: () => {
          setOrganization("");
          setOrganizationSearch("");
        }
      });
    }
    if (rank) chips.push({ key: "rank", text: `順位: ${rank}`, onClear: () => setRank("") });
    if (q) chips.push({ key: "q", text: `検索: ${q}`, onClear: () => setQ("") });
    return chips;
  }, [affiliationType, competition, competitionCategory, event, finalGroup, gender, organization, q, rank, year]);

  const pageStart = pagination.total_count === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const pageEnd = pagination.total_count === 0 ? 0 : pageStart + results.length - 1;
  const filteredOrganizations = useMemo(() => {
    const keyword = organizationSearch.trim().toLowerCase();
    const options = filterOptions.organizations;
    if (!keyword) return options;
    return options.filter((option) => option.toLowerCase().includes(keyword));
  }, [filterOptions.organizations, organizationSearch]);

  const pageNumbers = useMemo(() => {
    const total = pagination.total_pages;
    const current = pagination.page;
    if (total <= 0) return [] as number[];

    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);
    for (let value = current - 2; value <= current + 2; value += 1) {
      if (value >= 1 && value <= total) pages.add(value);
    }

    return Array.from(pages).sort((a, b) => a - b);
  }, [pagination.page, pagination.total_pages]);

  const goToPage = (nextPage: number) => {
    if (pagination.total_pages <= 0) return;
    const clamped = Math.min(Math.max(nextPage, 1), pagination.total_pages);
    setPage(clamped);
  };

  const chooseOrganization = (value: string) => {
    setOrganization(value);
    setOrganizationSearch(value);
    setOrganizationMenuOpen(false);
    setPage(1);
  };

  const noResultMessage = useMemo(() => {
    if (results.length > 0) return "";
    if (activeFilters.length === 0) return "No data";
    return "現在のフィルタ条件では該当データがありません。条件を一部解除してください。";
  }, [activeFilters.length, results.length]);

  const shouldShowFilterGuide = activeFilters.length === 0;

  const applyLatestYearFilter = () => {
    if (filterOptions.years.length === 0) return;
    const latestYear = Math.max(...filterOptions.years);
    setYear(String(latestYear));
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "RowingAPI",
        url: SITE_URL,
        inLanguage: "ja"
      },
      {
        "@type": "Dataset",
        name: "RowingAPI ローイング記録データセット",
        description: "日本ローイング協会の大会結果データを検索・可視化できるデータセット",
        url: SITE_URL,
        creator: {
          "@type": "Organization",
          name: "RowingAPI"
        }
      }
    ]
  };

  return (
    <main className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="hero">
        <div>
          <h1>ローイング記録検索 | RowingAPI</h1>
          <p className="subtitle">ローイング記録を検索し、メダル傾向・優勝タイム推移を可視化</p>
        </div>
      </header>

      <section className="filters-panel">
        <section className="gender-tabs" aria-label="性別フィルタ">
          {genderTabOptions.map((option) => {
            const label = option === "" ? "すべて" : option;
            const active = gender === option;
            return (
              <button
                key={label}
                type="button"
                className={active ? "active" : ""}
                onClick={() => setGender(option)}
                data-testid={`gender-tab-${label}`}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </section>

        <section className="filters">
          <select data-testid="year-select" value={year} onChange={(e) => setYear(e.target.value)} aria-label="年">
            <option value="">年(すべて)</option>
            {filterOptions.years.map((option) => (
              <option key={option} value={option.toString()}>
                {option}
              </option>
            ))}
          </select>

          <select data-testid="competition-select" value={competition} onChange={(e) => setCompetition(e.target.value)} aria-label="大会名">
            <option value="">大会名(すべて)</option>
            {filterOptions.competitions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            data-testid="competition-category-select"
            value={competitionCategory}
            onChange={(e) => setCompetitionCategory(e.target.value)}
            aria-label="大会カテゴリ"
          >
            <option value="">大会カテゴリ(すべて)</option>
            {filterOptions.competition_categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            data-testid="affiliation-type-select"
            value={affiliationType}
            onChange={(e) => setAffiliationType(e.target.value)}
            aria-label="区分"
          >
            <option value="">区分(すべて)</option>
            {filterOptions.affiliation_types.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select data-testid="event-select" value={event} onChange={(e) => setEvent(e.target.value)} aria-label="種目">
            <option value="">種目(すべて)</option>
            {filterOptions.events.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select data-testid="final-group-select" value={finalGroup} onChange={(e) => setFinalGroup(e.target.value)} aria-label="Final">
            <option value="">Final(すべて)</option>
            {filterOptions.final_groups.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className={`organization-combobox${organizationMenuOpen ? " open" : ""}`}>
            <input
              data-testid="organization-combobox-input"
              value={organizationSearch}
              onFocus={() => setOrganizationMenuOpen(true)}
              onBlur={() => window.setTimeout(() => setOrganizationMenuOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOrganizationMenuOpen(false);
                }
                if (e.key === "Enter" && organizationMenuOpen && filteredOrganizations.length > 0) {
                  e.preventDefault();
                  chooseOrganization(filteredOrganizations[0]);
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                setOrganizationSearch(value);
                setOrganization("");
                setPage(1);
                setOrganizationMenuOpen(true);
              }}
              placeholder="団体を検索して選択"
              aria-label="団体"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={organizationMenuOpen}
              aria-controls="organization-listbox"
            />
            {organizationMenuOpen && (
              <div
                id="organization-listbox"
                role="listbox"
                className="organization-combobox-menu"
                data-testid="organization-combobox-menu"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={!organization}
                  className={!organization ? "active" : ""}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOrganization("");
                    setOrganizationSearch("");
                    setOrganizationMenuOpen(false);
                    setPage(1);
                  }}
                >
                  団体(すべて)
                </button>
                {filteredOrganizations.map((option) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={organization === option}
                    data-testid={`organization-option-${option}`}
                    className={organization === option ? "active" : ""}
                    key={option}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chooseOrganization(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select data-testid="rank-select" value={rank} onChange={(e) => setRank(e.target.value)} aria-label="順位">
            <option value="">順位(すべて)</option>
            {rankOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </section>

        <div className="filter-actions">
          <button type="button" onClick={clearFilters}>
            フィルタをクリア
          </button>
        </div>

        <div className="active-filter-chips">
          {activeFilters.length === 0 ? (
            <span className="chip chip-empty">フィルタ未指定</span>
          ) : (
            activeFilters.map((chip) => (
              <button key={chip.key} type="button" className="chip chip-clearable" onClick={chip.onClear}>
                <span>{chip.text}</span>
                <span className="chip-clear" aria-hidden="true">
                  ×
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {shouldShowFilterGuide && (
        <section className="empty-state-guide" aria-live="polite">
          <h2>まずは条件を1つ選んで検索を始めましょう</h2>
          <p>おすすめ: 年、Final、種目の順で絞り込むと目的の結果に早く到達できます。</p>
          <div className="empty-state-guide-actions">
            <button type="button" onClick={applyLatestYearFilter} disabled={filterOptions.years.length === 0}>
              最新年を選択
            </button>
            <button type="button" onClick={() => setFinalGroup("Final A")}>
              Final Aのみ
            </button>
            <button type="button" onClick={() => setCompetitionCategory("全日本大学選手権")}>
              全日本大学選手権
            </button>
          </div>
        </section>
      )}

      <section className={`cards${isRefreshing ? " is-refreshing" : ""}`}>
        <article className="chart-card">
          <div className="chart-card-head">
            <h2>団体別金メダル数(Top8)</h2>
            <span>Final A golds</span>
          </div>
          <div className="chart-wrap" ref={organizationGoldChartRef} style={{ height: organizationBarChartHeight }}>
            {organizationGoldChartWidth > 0 ? (
              <BarChart
                width={organizationGoldChartWidth}
                height={organizationBarChartHeight}
                data={topOrganizationGolds}
                layout="horizontal"
                margin={{ top: 10, left: 0, right: 10, bottom: 34 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="category" dataKey="label" interval={0} height={52} tick={renderWrappedXAxisTick} />
                <YAxis type="number" allowDecimals={false} width={40} tick={{ fontSize: 12 }} tickMargin={2} />
                <Tooltip formatter={(value) => [`${value}個`, "金メダル"]} labelFormatter={(label) => `団体: ${label}`} />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            ) : null}
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-card-head">
            <h2>団体別メダル数(Top8)</h2>
            <span>Final A medals</span>
          </div>
          <div className="chart-wrap" ref={organizationMedalChartRef} style={{ height: organizationBarChartHeight }}>
            {organizationMedalChartWidth > 0 ? (
              <BarChart
                width={organizationMedalChartWidth}
                height={organizationBarChartHeight}
                data={topOrganizationMedals}
                layout="horizontal"
                margin={{ top: 10, left: 0, right: 10, bottom: 34 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="category" dataKey="label" interval={0} height={52} tick={renderWrappedXAxisTick} />
                <YAxis type="number" allowDecimals={false} width={40} tick={{ fontSize: 12 }} tickMargin={2} />
                <Tooltip formatter={(value) => [`${value}個`, "メダル"]} labelFormatter={(label) => `団体: ${label}`} />
                <Bar dataKey="value" fill="#ef6c00" />
              </BarChart>
            ) : null}
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-card-head">
            <h2>優勝タイム推移</h2>
            <span>{event ? event : "種目を選択"}</span>
          </div>
          <div className="chart-wrap" ref={winnerTrendChartRef}>
            {event && winnerTrend.length > 0 ? (
              winnerTrendChartWidth > 0 ? (
                <LineChart width={winnerTrendChartWidth} height={260} data={winnerTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={formatSecondsForAxis} />
                  <Tooltip formatter={(value) => formatSecondsToTime(Number(value))} />
                  <Line type="monotone" dataKey="value" stroke="#2e7d32" strokeWidth={3} dot />
                </LineChart>
              ) : null
            ) : (
              <div className="chart-empty-state">{event ? "No data" : "種目を選択してください (No data)"}</div>
            )}
          </div>
        </article>

      </section>

      <section className={`table-card${isRefreshing ? " is-refreshing" : ""}`}>
        <div className="table-head">
          <h2>
            検索結果 ({pagination.total_count}件){" "}
            {pagination.total_count > 0 ? ` ${pageStart}-${pageEnd}件を表示` : ""}
          </h2>
          <label className="results-per-page">
            <span>表示件数</span>
            <select
              data-testid="per-page-select"
              value={perPage}
              onChange={(e) => {
                setPerPage(e.target.value);
                setPage(1);
              }}
              aria-label="1ページ件数"
            >
              <option value="25">25件/ページ</option>
              <option value="50">50件/ページ</option>
              <option value="100">100件/ページ</option>
              <option value="200">200件/ページ</option>
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table className="results-table">
            <thead>
              <tr>
                <th className="col-year">年</th>
                <th className="col-competition">大会</th>
                <th className="col-event">種目</th>
                <th className="col-final">Final</th>
                <th className="col-crew">クルー</th>
                <th className="col-organization">団体</th>
                <th className="col-rank">順位</th>
                <th className="col-time">タイム</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td className="table-empty" colSpan={8}>
                    {noResultMessage}
                  </td>
                </tr>
              ) : (
                results.map((row) => (
                  <tr key={row.id}>
                    <td className="col-year">{row.year}</td>
                    <td className="col-competition" title={row.competition_name}>
                      <div className="cell-competition">{row.competition_name}</div>
                    </td>
                    <td className="col-event" title={row.event_name}>
                      <div className="cell-event">{row.event_name}</div>
                    </td>
                    <td className="col-final">{row.final_group}</td>
                    <td className="col-crew" title={row.crew_name}>
                      <div className="cell-ellipsis">{row.crew_name}</div>
                    </td>
                    <td className="col-organization" title={row.organization}>
                      <div className="cell-ellipsis">{row.organization}</div>
                    </td>
                    <td className={`col-rank ${rankCellClassName(row)}`}>{row.rank}</td>
                    <td className="col-time">{row.time_display}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="results-mobile-cards" aria-label="検索結果（モバイル表示）">
          {results.length === 0 ? (
            <div className="result-card-empty">{noResultMessage}</div>
          ) : (
            results.map((row) => (
              <article className="result-card" key={`mobile-${row.id}`}>
                <header className="result-card-head">
                  <span className="result-card-year">{row.year}</span>
                  <span className="result-card-final">{row.final_group}</span>
                  <span className={`result-card-rank ${rankCellClassName(row)}`}>{row.rank}位</span>
                </header>
                <p className="result-card-event">{row.event_name}</p>
                <p className="result-card-competition" title={row.competition_name}>
                  {row.competition_name}
                </p>
                <dl className="result-card-meta">
                  <div>
                    <dt>クルー</dt>
                    <dd>{row.crew_name}</dd>
                  </div>
                  <div>
                    <dt>団体</dt>
                    <dd>{row.organization}</dd>
                  </div>
                  <div>
                    <dt>タイム</dt>
                    <dd>{row.time_display}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>

        <div className="pagination-controls">
          <button type="button" disabled={pagination.page <= 1 || loading} onClick={() => goToPage(1)}>
            先頭
          </button>
          <button type="button" disabled={pagination.page <= 1 || loading} onClick={() => goToPage(pagination.page - 1)}>
            前へ
          </button>

          <div className="pagination-pages" aria-label="ページ番号">
            {pagination.total_pages <= 0 ? (
              <span className="pagination-empty">0 / 0</span>
            ) : (
              pageNumbers.map((pageNumber, index) => {
                const previous = index > 0 ? pageNumbers[index - 1] : null;
                const showEllipsis = previous !== null && pageNumber - previous > 1;

                return (
                  <span key={`page-${pageNumber}`}>
                    {showEllipsis ? <span className="pagination-ellipsis">…</span> : null}
                    <button
                      type="button"
                      className={pageNumber === pagination.page ? "page-number active" : "page-number"}
                      onClick={() => goToPage(pageNumber)}
                      disabled={loading}
                    >
                      {pageNumber}
                    </button>
                  </span>
                );
              })
            )}
          </div>

          <button
            type="button"
            disabled={pagination.total_pages === 0 || pagination.page >= pagination.total_pages || loading}
            onClick={() => goToPage(pagination.page + 1)}
          >
            次へ
          </button>
          <button
            type="button"
            disabled={pagination.total_pages === 0 || pagination.page >= pagination.total_pages || loading}
            onClick={() => goToPage(pagination.total_pages)}
          >
            末尾
          </button>

          <form
            className="pagination-jump"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = Number(pageInput);
              if (!Number.isFinite(parsed)) return;
              goToPage(parsed);
            }}
          >
            <label htmlFor="page-jump-input">移動</label>
            <input
              id="page-jump-input"
              type="number"
              min={1}
              max={Math.max(1, pagination.total_pages)}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
            />
            <button type="submit" disabled={loading || pagination.total_pages <= 0}>
              Go
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
