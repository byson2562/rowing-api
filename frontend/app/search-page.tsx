"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import resultsIndex from "../data/results/index.json";

const DATASET_INDEX = resultsIndex as { years: number[]; total_count: number };
const DATASET_YEAR_MIN = Math.min(...DATASET_INDEX.years);
const DATASET_YEAR_MAX = Math.max(...DATASET_INDEX.years);

// チャート配色: メダル数はブランドブルー、金メダル数はゴールド、推移はブルー
const CHART_BLUE = "#1f6fce";
const CHART_GOLD = "#f0a92e";
const CHART_TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid #d6e0ef",
  boxShadow: "0 8px 20px rgba(16, 32, 58, 0.12)",
  fontSize: 12,
  padding: "8px 10px"
} as const;

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

export type SearchPageInitialFilters = {
  q: string;
  year: string;
  gender: string;
  affiliationType: string;
  event: string;
  finalGroup: string;
  competition: string;
  competitionCategory: string;
  organization: string;
  rank: string;
};

export type SearchPageProps = {
  initialFilters: SearchPageInitialFilters;
  initialPage: number;
  initialPerPage: string;
  initialResults: Result[];
  initialPagination: Pagination;
  initialFilterOptions: FilterOptionsResponse;
  initialOrganizationMedals: StatPoint[];
  initialOrganizationGolds: StatPoint[];
  initialWinnerTrend: StatPoint[];
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");
const API_PREFIX = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`;

function apiUrl(path: string): string {
  return `${API_PREFIX}${path}`;
}

// 競漕記録の慣例表記 m:ss.cc（例 6:12.08）
function formatSecondsToTime(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? totalSeconds : 0;
  let minutes = Math.floor(safeSeconds / 60);
  let seconds = Math.floor(safeSeconds % 60);
  let centiseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 100);
  if (centiseconds >= 100) {
    centiseconds -= 100;
    seconds += 1;
  }
  if (seconds >= 60) {
    seconds -= 60;
    minutes += 1;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
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

// 適用中の値が選択肢リストから漏れても、セレクト表示が勝手に「すべて」へ戻らないよう
// 現在値を選択肢の先頭に補う（チップとセレクトの表示不整合を防ぐ）
function withCurrentOption(options: string[], current: string): string[] {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}

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

export default function SearchPage({
  initialFilters,
  initialPage,
  initialPerPage,
  initialResults,
  initialPagination,
  initialFilterOptions,
  initialOrganizationMedals,
  initialOrganizationGolds,
  initialWinnerTrend
}: SearchPageProps) {
  const [results, setResults] = useState<Result[]>(initialResults);
  const [organizationMedals, setOrganizationMedals] = useState<StatPoint[]>(initialOrganizationMedals);
  const [organizationGolds, setOrganizationGolds] = useState<StatPoint[]>(initialOrganizationGolds);
  const [winnerTrend, setWinnerTrend] = useState<StatPoint[]>(initialWinnerTrend);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse>(initialFilterOptions);
  const [loading, setLoading] = useState(true);
  const resultsRequestRef = useRef(0);
  const filtersRequestRef = useRef(0);

  const [q, setQ] = useState(initialFilters.q);
  const [year, setYear] = useState(initialFilters.year);
  const [gender, setGender] = useState(initialFilters.gender);
  const [affiliationType, setAffiliationType] = useState(initialFilters.affiliationType);
  const [event, setEvent] = useState(initialFilters.event);
  const [finalGroup, setFinalGroup] = useState(initialFilters.finalGroup);
  const [competition, setCompetition] = useState(initialFilters.competition);
  const [competitionCategory, setCompetitionCategory] = useState(initialFilters.competitionCategory);
  const [organization, setOrganization] = useState(initialFilters.organization);
  const [organizationSearch, setOrganizationSearch] = useState(initialFilters.organization);
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [chartsExpanded, setChartsExpanded] = useState(false);
  const [rank, setRank] = useState(initialFilters.rank);
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [pageInput, setPageInput] = useState(initialPage.toString());
  const [isRefreshing, setIsRefreshing] = useState(true);
  const organizationGoldChartRef = useRef<HTMLDivElement | null>(null);
  const organizationMedalChartRef = useRef<HTMLDivElement | null>(null);
  const winnerTrendChartRef = useRef<HTMLDivElement | null>(null);
  const [organizationGoldChartWidth, setOrganizationGoldChartWidth] = useState(0);
  const [organizationMedalChartWidth, setOrganizationMedalChartWidth] = useState(0);
  const [winnerTrendChartWidth, setWinnerTrendChartWidth] = useState(0);
  const lastAnalyticsSnapshotRef = useRef("");
  const searchExecutionStorageKey = "rowingapi_search_execution_keys_v1";

  const rankOptions = useMemo(() => Array.from({ length: 8 }, (_, index) => `${index + 1}`), []);
  const topOrganizationGolds = useMemo(() => organizationGolds.slice(0, 8), [organizationGolds]);
  const topOrganizationMedals = useMemo(() => organizationMedals.slice(0, 8), [organizationMedals]);
  const organizationBarChartHeight = 260;
  const genderTabOptions = useMemo(() => {
    const options = new Set(["男子", "女子"]);
    filterOptions.genders
      .filter((value) => value === "男子" || value === "女子")
      .forEach((value) => options.add(value));
    return ["", ...Array.from(options)];
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

  // 初期値はサーバーがURLから復元した状態と一致している（ページリセット判定に使う）
  const lastFiltersSnapshotRef = useRef(baseQuery);

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
    // 優勝タイム推移カードは種目選択時のみマウント、チャート群はモバイルで
    // 折りたたみからの表示切替があるため、どちらの変化でも幅を再計測する
    // （display:none→表示の遷移ではResizeObserverの発火が保証されない）
  }, [event, chartsExpanded]);

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

  // フィルタが実際に変わったときだけ1ページ目へ戻す。「初回はスキップ」方式だと
  // dev(StrictMode)のエフェクト二重実行でURL復元したページ番号が消えるため、
  // スナップショット比較で判定する
  useEffect(() => {
    if (baseQuery === lastFiltersSnapshotRef.current) return;
    lastFiltersSnapshotRef.current = baseQuery;
    setPage(1);
  }, [baseQuery]);

  // フィルタ状態をURLへ反映する（共有リンク・ブックマーク・リロード対応）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(baseQuery);
    if (page > 1) params.set("page", String(page));
    if (perPage !== "50") params.set("per_page", perPage);
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [baseQuery, page, perPage]);

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
    emitFilterEvents("clear_filters", "all");
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
    if (affiliationType) {
      chips.push({ key: "affiliationType", text: `団体区分: ${affiliationType}`, onClear: () => setAffiliationType("") });
    }
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
  const advancedActiveCount = useMemo(() => {
    let count = 0;
    if (finalGroup) count += 1;
    if (rank) count += 1;
    if (organization) count += 1;
    if (affiliationType) count += 1;
    return count;
  }, [affiliationType, finalGroup, organization, rank]);

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
    emitFilterEvents("organization", value);
  };

  const noResultMessage = useMemo(() => {
    if (results.length > 0) return "";
    if (activeFilters.length === 0) return "No data";
    return "現在のフィルタ条件では該当データがありません。条件を一部解除してください。";
  }, [activeFilters.length, results.length]);
  const showChartLoading = isRefreshing || loading;
  // 1点だけの折れ線は推移として意味がないため、2点以上でのみチャートを描画する
  const winnerTrendHasData = Boolean(event && winnerTrend.length > 1);
  const winnerTrendSingle = event && winnerTrend.length === 1 ? winnerTrend[0] : null;
  const northStarValue = results.length;

  const emitAnalyticsEvent = (eventName: string, params: Record<string, string | number | boolean>) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("rowingapi_analytics_event", {
        detail: {
          event_name: eventName,
          ...params
        }
      })
    );
  };

  const emitFilterInteraction = (filterName: string, filterValue: string) => {
    emitAnalyticsEvent("filter_interaction", {
      filter_name: filterName,
      filter_value: filterValue,
      page_path: "/"
    });
  };

  const emitFilterApply = (filterName: string, filterValue: string) => {
    emitAnalyticsEvent("filter_apply", {
      filter_name: filterName,
      filter_value: filterValue,
      page_path: "/"
    });
  };

  const emitFilterEvents = (filterName: string, filterValue: string) => {
    emitFilterInteraction(filterName, filterValue);
    emitFilterApply(filterName, filterValue);
  };

  useEffect(() => {
    if (loading || isRefreshing) return;
    const snapshot = JSON.stringify({
      query: baseQuery,
      page,
      perPage,
      totalCount: pagination.total_count,
      activeFilterCount: activeFilters.length
    });
    if (snapshot === lastAnalyticsSnapshotRef.current) return;
    lastAnalyticsSnapshotRef.current = snapshot;

    emitAnalyticsEvent("search_results_loaded", {
      result_count: pagination.total_count,
      page,
      per_page: Number(perPage),
      active_filter_count: activeFilters.length,
      has_event_filter: Boolean(event),
      north_star_weekly_search_execution: northStarValue,
      search_context: activeFilters.length > 0 ? "filtered" : "initial"
    });

    if (activeFilters.length > 0 && page === 1) {
      const executionKey = baseQuery || "__all__";
      let shouldSendExecution = true;
      try {
        const raw = sessionStorage.getItem(searchExecutionStorageKey);
        const keys = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
        if (keys.has(executionKey)) {
          shouldSendExecution = false;
        } else {
          keys.add(executionKey);
          sessionStorage.setItem(searchExecutionStorageKey, JSON.stringify(Array.from(keys)));
        }
      } catch {
        shouldSendExecution = true;
      }

      if (shouldSendExecution) {
        emitAnalyticsEvent("search_execution", {
          result_count: pagination.total_count,
          active_filter_count: activeFilters.length,
          has_event_filter: Boolean(event),
          page_path: "/"
        });
      }
    }

    if (pagination.total_count === 0) {
      emitAnalyticsEvent("no_data_view", {
        active_filter_count: activeFilters.length,
        has_event_filter: Boolean(event)
      });
    }
  }, [activeFilters.length, baseQuery, event, isRefreshing, loading, northStarValue, page, pagination.total_count, perPage]);

  const shouldShowFilterGuide = activeFilters.length === 0;

  const applyLatestYearFilter = () => {
    if (filterOptions.years.length === 0) return;
    const latestYear = Math.max(...filterOptions.years);
    setYear(String(latestYear));
    emitFilterEvents("quick_filter", "latest_year");
  };

  return (
    <main className="container">
      <header className="hero">
        <div>
          <p className="hero-kicker">Rowing Results Database</p>
          <h1>ローイング大会結果データベース</h1>
          <p className="subtitle">年度・大会・種目・団体で検索し、メダル傾向・優勝タイム推移を可視化</p>
          <ul className="hero-stats" aria-label="収録データの概要">
            <li>
              <strong>{DATASET_INDEX.total_count.toLocaleString()}</strong>レース収録
            </li>
            <li>
              <strong>
                {DATASET_YEAR_MIN}–{DATASET_YEAR_MAX}
              </strong>
              年
            </li>
            <li>
              <strong>全日本級4大会</strong>
            </li>
          </ul>
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
                onClick={() => {
                  setGender(option);
                  // 新しい性別と矛盾する種目フィルタは残しても0件になるだけなので自動解除する
                  if (option && event && !event.startsWith(option)) {
                    setEvent("");
                  }
                  emitFilterEvents("gender", option);
                }}
                data-testid={`gender-tab-${label}`}
                data-ga-filter-action="gender"
                data-ga-filter-value={option}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </section>

        <section className="filters">
          <div>
            <div className="filters-primary" aria-label="主要フィルター">
            <select
              data-testid="year-select"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                emitFilterEvents("year", e.target.value);
              }}
              aria-label="年"
              data-ga-filter="year"
            >
              <option value="">年(すべて)</option>
              {filterOptions.years.map((option) => (
                <option key={option} value={option.toString()}>
                  {option}
                </option>
              ))}
            </select>

            <select
              data-testid="competition-category-select"
              value={competitionCategory}
              onChange={(e) => {
                setCompetitionCategory(e.target.value);
                emitFilterEvents("competition_category", e.target.value);
              }}
              aria-label="大会カテゴリ"
              data-ga-filter="competition_category"
            >
              <option value="">大会カテゴリ(すべて)</option>
              {withCurrentOption(filterOptions.competition_categories, competitionCategory).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              data-testid="competition-select"
              value={competition}
              onChange={(e) => {
                setCompetition(e.target.value);
                emitFilterEvents("competition", e.target.value);
              }}
              aria-label="大会名"
              data-ga-filter="competition"
            >
              <option value="">大会名(すべて)</option>
              {withCurrentOption(filterOptions.competitions, competition).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              data-testid="event-select"
              value={event}
              onChange={(e) => {
                setEvent(e.target.value);
                emitFilterEvents("event", e.target.value);
              }}
              aria-label="種目"
              data-ga-filter="event"
            >
              <option value="">種目(すべて)</option>
              {withCurrentOption(filterOptions.events, event).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            </div>
          </div>

          <div className="filters-secondary-wrap">
            <div className="advanced-filter-header">
              <button
                type="button"
                className="advanced-filter-toggle"
                aria-expanded={showAdvancedFilters}
                aria-controls="advanced-filters-panel"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
              >
                <span>詳細条件</span>
                <span className="advanced-filter-meta">
                  {advancedActiveCount > 0 ? `${advancedActiveCount}件選択中` : "未設定"}
                </span>
                <span aria-hidden="true" className="advanced-filter-caret">{showAdvancedFilters ? "▲" : "▼"}</span>
              </button>
            </div>
            <div
              className={`filters-secondary-panel${showAdvancedFilters ? " open" : ""}`}
              id="advanced-filters-panel"
              aria-label="詳細条件"
              aria-hidden={!showAdvancedFilters}
            >
              <div className="filters-secondary">
            <select
              data-testid="final-group-select"
              value={finalGroup}
              onChange={(e) => {
                setFinalGroup(e.target.value);
                emitFilterEvents("final_group", e.target.value);
              }}
              aria-label="Final"
              data-ga-filter="final_group"
            >
              <option value="">Final(すべて)</option>
              {withCurrentOption(filterOptions.final_groups, finalGroup).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              data-testid="rank-select"
              value={rank}
              onChange={(e) => {
                setRank(e.target.value);
                emitFilterEvents("rank", e.target.value);
              }}
              aria-label="順位"
              data-ga-filter="rank"
            >
              <option value="">順位(すべて)</option>
              {rankOptions.map((option) => (
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
                  emitFilterInteraction("organization_search", value);
                }}
                placeholder="団体を検索して選択"
                aria-label="団体"
                data-ga-filter="organization_search"
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
                      emitFilterEvents("organization", "");
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
                  {filteredOrganizations.length === 0 && (
                    <div className="combobox-no-match" data-testid="organization-no-match">
                      該当する団体がありません
                    </div>
                  )}
                </div>
              )}
              {!organizationMenuOpen && organizationSearch && !organization && (
                <p className="combobox-hint" role="status">
                  団体は候補から選択すると絞り込みに適用されます
                </p>
              )}
            </div>

            <select
              data-testid="affiliation-type-select"
              value={affiliationType}
              onChange={(e) => {
                setAffiliationType(e.target.value);
                emitFilterEvents("affiliation_type", e.target.value);
              }}
              aria-label="団体区分"
              data-ga-filter="affiliation_type"
            >
              <option value="">団体区分(すべて)</option>
              {withCurrentOption(filterOptions.affiliation_types, affiliationType).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
              </div>
            </div>
          </div>
        </section>

        <div className="filter-actions">
          {activeFilters.length > 0 && (
            <a className="results-jump" href="#results" data-testid="results-jump">
              該当 {pagination.total_count.toLocaleString()}件の結果へ移動 ↓
            </a>
          )}
          <button type="button" onClick={clearFilters} data-ga-filter-action="clear_filters" data-ga-filter-value="all">
            フィルタをクリア
          </button>
        </div>

        <div className="active-filter-chips">
          {activeFilters.length === 0 ? (
            <span className="chip chip-empty">フィルタ未指定</span>
          ) : (
            activeFilters.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="chip chip-clearable"
                onClick={() => {
                  chip.onClear();
                  emitFilterEvents("clear_filter_chip", chip.key);
                }}
                data-ga-filter-action="clear_filter_chip"
                data-ga-filter-value={chip.key}
              >
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
            <button
              type="button"
              onClick={applyLatestYearFilter}
              disabled={filterOptions.years.length === 0}
              data-ga-filter-action="quick_filter"
              data-ga-filter-value="latest_year"
            >
              最新年を選択
            </button>
            <button
              type="button"
              onClick={() => {
                setFinalGroup("Final A");
                emitFilterEvents("quick_filter", "final_a");
              }}
              data-ga-filter-action="quick_filter"
              data-ga-filter-value="final_a"
            >
              Final Aのみ
            </button>
            <button
              type="button"
              onClick={() => {
                setCompetitionCategory("全日本大学選手権");
                emitFilterEvents("quick_filter", "all_japan_university");
              }}
              data-ga-filter-action="quick_filter"
              data-ga-filter-value="all_japan_university"
            >
              全日本大学選手権
            </button>
          </div>
        </section>
      )}

      <div className="charts-toggle-wrap">
        <button
          type="button"
          className="charts-toggle"
          aria-expanded={chartsExpanded}
          onClick={() => setChartsExpanded((prev) => !prev)}
        >
          {chartsExpanded ? "グラフを閉じる ▲" : "グラフを見る（メダル数・優勝タイム推移） ▼"}
        </button>
      </div>

      <section className={`cards${isRefreshing ? " is-refreshing" : ""}${chartsExpanded ? "" : " cards-collapsed"}`}>
        <article className="chart-card chart-card-primary medal-chart-card" data-ga-event="chart_interaction" data-ga-label="organization_medals_chart" data-ga-location="/">
          <div className="chart-card-head">
            <h2>団体別メダル数(Top8)</h2>
            <span>Final A集計</span>
          </div>
          <div className="chart-wrap" ref={organizationMedalChartRef} style={{ height: organizationBarChartHeight }}>
            {topOrganizationMedals.length > 0 && organizationMedalChartWidth > 0 ? (
              <BarChart
                width={organizationMedalChartWidth}
                height={organizationBarChartHeight}
                data={topOrganizationMedals}
                layout="horizontal"
                margin={{ top: 10, left: 0, right: 10, bottom: 34 }}
              >
                <CartesianGrid vertical={false} stroke="#e3ecf7" />
                <XAxis type="category" dataKey="label" interval={0} height={52} tick={renderWrappedXAxisTick} />
                <YAxis type="number" allowDecimals={false} width={40} tick={{ fontSize: 12 }} tickMargin={2} />
                <Tooltip
                  formatter={(value) => [`${value}個`, "メダル"]}
                  labelFormatter={(label) => `団体: ${label}`}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <Bar dataKey="value" fill={CHART_BLUE} radius={[5, 5, 0, 0]}>
                  <LabelList dataKey="value" position="top" fontSize={11} fill="#57718f" />
                </Bar>
              </BarChart>
            ) : !showChartLoading ? (
              <div className="chart-empty-state">No data</div>
            ) : null}
            {showChartLoading ? (
              <div className="chart-loading-overlay" role="status" aria-live="polite">
                <span className="chart-loading-spinner" aria-hidden="true" />
                <span>Loading...</span>
              </div>
            ) : null}
          </div>
        </article>

        <article className="chart-card medal-chart-card" data-ga-event="chart_interaction" data-ga-label="organization_golds_chart" data-ga-location="/">
          <div className="chart-card-head">
            <h2>団体別金メダル数(Top8)</h2>
            <span>Final A集計</span>
          </div>
          <div className="chart-wrap" ref={organizationGoldChartRef} style={{ height: organizationBarChartHeight }}>
            {topOrganizationGolds.length > 0 && organizationGoldChartWidth > 0 ? (
              <BarChart
                width={organizationGoldChartWidth}
                height={organizationBarChartHeight}
                data={topOrganizationGolds}
                layout="horizontal"
                margin={{ top: 10, left: 0, right: 10, bottom: 34 }}
              >
                <CartesianGrid vertical={false} stroke="#e3ecf7" />
                <XAxis type="category" dataKey="label" interval={0} height={52} tick={renderWrappedXAxisTick} />
                <YAxis type="number" allowDecimals={false} width={40} tick={{ fontSize: 12 }} tickMargin={2} />
                <Tooltip
                  formatter={(value) => [`${value}個`, "金メダル"]}
                  labelFormatter={(label) => `団体: ${label}`}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <Bar dataKey="value" fill={CHART_GOLD} radius={[5, 5, 0, 0]}>
                  <LabelList dataKey="value" position="top" fontSize={11} fill="#57718f" />
                </Bar>
              </BarChart>
            ) : !showChartLoading ? (
              <div className="chart-empty-state">No data</div>
            ) : null}
            {showChartLoading ? (
              <div className="chart-loading-overlay" role="status" aria-live="polite">
                <span className="chart-loading-spinner" aria-hidden="true" />
                <span>Loading...</span>
              </div>
            ) : null}
          </div>
        </article>

        {/* 種目未選択時は大きな空状態が一等地を占有するだけなのでカードごと出さない */}
        {event && (
        <article className="chart-card winner-trend-card" data-ga-event="chart_interaction" data-ga-label="winner_trend_chart" data-ga-location="/">
          <div className="chart-card-head">
            <h2>優勝タイム推移</h2>
            <span>{event}</span>
          </div>
          <div className={`chart-wrap${winnerTrendHasData ? "" : " no-data"}`} ref={winnerTrendChartRef}>
            {winnerTrendHasData ? (
              winnerTrendChartWidth > 0 ? (
                <LineChart width={winnerTrendChartWidth} height={260} data={winnerTrend}>
                  <CartesianGrid vertical={false} stroke="#e3ecf7" />
                  <XAxis dataKey="label" />
                  {/* タイム差が読めるようY軸は0起点にせずデータ範囲へフィットさせる */}
                  <YAxis tickFormatter={formatSecondsForAxis} domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip formatter={(value) => formatSecondsToTime(Number(value))} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="value" stroke={CHART_BLUE} strokeWidth={3} dot />
                </LineChart>
              ) : null
            ) : winnerTrendSingle ? (
              <div className="chart-empty-state chart-single-point">
                <p className="single-point-value">
                  {winnerTrendSingle.label}年の優勝タイム(平均): <strong>{formatSecondsToTime(winnerTrendSingle.value)}</strong>
                </p>
                <p className="single-point-hint">年フィルタを解除すると、年ごとの推移を表示できます</p>
              </div>
            ) : (
              <div className="chart-empty-state">{event ? "No data" : "種目を選択してください (No data)"}</div>
            )}
            {showChartLoading ? (
              <div className="chart-loading-overlay" role="status" aria-live="polite">
                <span className="chart-loading-spinner" aria-hidden="true" />
                <span>Loading...</span>
              </div>
            ) : null}
          </div>
        </article>
        )}

      </section>

      <section id="results" className={`table-card${isRefreshing ? " is-refreshing" : ""}`}>
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
                    <div className="empty-results">
                      <p>{noResultMessage}</p>
                      {activeFilters.length > 0 && (
                        <button type="button" onClick={clearFilters}>
                          フィルタをクリアして再検索
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                results.map((row) => (
                  <tr key={row.id} data-ga-event="result_open" data-ga-label={`${row.year}_${row.event_name}`} data-ga-location="/">
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
                    <td className="col-rank">
                      <span className={`rank-badge ${rankCellClassName(row)}`}>{row.rank}</span>
                    </td>
                    <td className="col-time">{row.time_display}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="results-mobile-cards" aria-label="検索結果（モバイル表示）">
          {results.length === 0 ? (
            <div className="result-card-empty">
              <div className="empty-results">
                <p>{noResultMessage}</p>
                {activeFilters.length > 0 && (
                  <button type="button" onClick={clearFilters}>
                    フィルタをクリアして再検索
                  </button>
                )}
              </div>
            </div>
          ) : (
            results.map((row) => (
              <article className="result-card" key={`mobile-${row.id}`} data-ga-event="result_open" data-ga-label={`${row.year}_${row.event_name}`} data-ga-location="/">
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
                  {/* 団体名クルー（大学等）はクルーと同一値なので二重表示しない */}
                  {row.organization !== row.crew_name && (
                    <div>
                      <dt>団体</dt>
                      <dd>{row.organization}</dd>
                    </div>
                  )}
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
