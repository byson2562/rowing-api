"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { sx } from "../components/search/search-classes";
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
const CHART_BLUE = "#4d94ff";
const CHART_GOLD = "#ffb84d";
const CHART_TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "2px solid #e3edfb",
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
    <text x={x} y={y} textAnchor="middle" fill="#5d7398" fontSize={11} dominantBaseline="hanging">
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

  // テーブルの順位バッジ用(デザインパスにより金のみ #ffd76e)
  const rankBadgeMedalClassName = (row: Result) => {
    if (row.rank === 1) return "font-bold bg-[#ffd76e] text-[#78350f]";
    if (row.rank === 2) return "font-bold bg-[#e5e7eb] text-[#374151]";
    if (row.rank === 3) return "font-bold bg-[#f5d0a9] text-[#7c2d12]";
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
    <main className="site-container">
      <header className="hero">
        <div>
          <h1>ローイング記録検索</h1>
          <ul className={sx.heroStats} aria-label="収録データの概要">
            <li>
              <strong className={sx.heroStatValue}>{DATASET_INDEX.total_count.toLocaleString()}</strong>レース収録
            </li>
            <li>
              <strong className={sx.heroStatValue}>
                {DATASET_YEAR_MIN}–{DATASET_YEAR_MAX}
              </strong>
              年
            </li>
            <li>
              <strong className={sx.heroStatValue}>全日本級5大会</strong>
            </li>
          </ul>
        </div>
      </header>

      <section className={sx.panel}>
        <section className={sx.genderTabs} aria-label="性別フィルタ">
          {genderTabOptions.map((option) => {
            const label = option === "" ? "すべて" : option;
            const active = gender === option;
            return (
              <button
                key={label}
                type="button"
                className={active ? sx.genderTabActive : sx.genderTabIdle}
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

        <section className={sx.filters}>
          <div>
            <div className={sx.filterRow} aria-label="主要フィルター">
            <select
              className={sx.select}
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
              className={sx.select}
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
              className={sx.select}
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
              className={sx.select}
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

          <div className={sx.secondaryWrap}>
            <div className={sx.advHeader}>
              <button
                type="button"
                className={sx.advToggle}
                aria-expanded={showAdvancedFilters}
                aria-controls="advanced-filters-panel"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
              >
                <span>詳細条件</span>
                <span className={sx.advMeta}>
                  {advancedActiveCount > 0 ? `${advancedActiveCount}件選択中` : "未設定"}
                </span>
                <span aria-hidden="true" className={sx.advCaret}>{showAdvancedFilters ? "▲" : "▼"}</span>
              </button>
            </div>
            <div
              className={showAdvancedFilters ? sx.secondaryPanelOpen : sx.secondaryPanel}
              id="advanced-filters-panel"
              aria-label="詳細条件"
              aria-hidden={!showAdvancedFilters}
            >
              <div className={sx.filterRowSecondary}>
            <select
              className={sx.select}
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
              className={sx.select}
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

            <div className={organizationMenuOpen ? sx.comboboxOpen : sx.combobox}>
              <input
                className={sx.control}
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
                  className={sx.comboboxMenu}
                  data-testid="organization-combobox-menu"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={!organization}
                    className={!organization ? sx.comboboxOptionActive : sx.comboboxOption}
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
                      className={organization === option ? sx.comboboxOptionActive : sx.comboboxOption}
                      key={option}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => chooseOrganization(option)}
                    >
                      {option}
                    </button>
                  ))}
                  {filteredOrganizations.length === 0 && (
                    <div className={sx.comboboxNoMatch} data-testid="organization-no-match">
                      該当する団体がありません
                    </div>
                  )}
                </div>
              )}
              {!organizationMenuOpen && organizationSearch && !organization && (
                <p className={sx.comboboxHint} role="status">
                  団体は候補から選択すると絞り込みに適用されます
                </p>
              )}
            </div>

            <select
              className={sx.select}
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

        <div className={sx.filterActions}>
          {activeFilters.length > 0 && (
            <a className={sx.resultsJump} href="#results" data-testid="results-jump">
              該当 {pagination.total_count.toLocaleString()}件の結果へ移動 ↓
            </a>
          )}
          <button type="button" className={sx.filterActionBtn} onClick={clearFilters} data-ga-filter-action="clear_filters" data-ga-filter-value="all">
            フィルタをクリア
          </button>
        </div>

        <div className={sx.chips}>
          {activeFilters.length === 0 ? (
            <span className={sx.chipEmpty}>フィルタ未指定</span>
          ) : (
            activeFilters.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={sx.chipClearable}
                onClick={() => {
                  chip.onClear();
                  emitFilterEvents("clear_filter_chip", chip.key);
                }}
                data-ga-filter-action="clear_filter_chip"
                data-ga-filter-value={chip.key}
              >
                <span>{chip.text}</span>
                <span className={sx.chipClear} aria-hidden="true">
                  ×
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {shouldShowFilterGuide && (
        <section className={sx.guide} aria-live="polite">
          <h2 className={sx.guideTitle}>まずは条件を1つ選んで検索を始めましょう</h2>
          <p className={sx.guideText}>おすすめ: 年、Final、種目の順で絞り込むと目的の結果に早く到達できます。</p>
          <div className={sx.guideActions}>
            <button
              type="button"
              className={sx.guideBtn}
              onClick={applyLatestYearFilter}
              disabled={filterOptions.years.length === 0}
              data-ga-filter-action="quick_filter"
              data-ga-filter-value="latest_year"
            >
              最新年を選択
            </button>
            <button
              type="button"
              className={sx.guideBtn}
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
              className={sx.guideBtn}
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

      <div className={sx.chartsToggleWrap}>
        <button
          type="button"
          className={sx.chartsToggle}
          aria-expanded={chartsExpanded}
          onClick={() => setChartsExpanded((prev) => !prev)}
        >
          {chartsExpanded ? "グラフを閉じる ▲" : "グラフを見る（メダル数・優勝タイム推移） ▼"}
        </button>
      </div>

      <section className={`${sx.cards}${isRefreshing ? " opacity-70" : ""}${chartsExpanded ? "" : " max-[768px]:hidden"}`}>
        <article className={sx.chartCard} data-ga-event="chart_interaction" data-ga-label="organization_medals_chart" data-ga-location="/">
          <div className={sx.chartCardHead}>
            <h2 className={sx.chartCardTitle}>団体別メダル数(Top8)</h2>
            <span className={sx.chartCardCaption}>Final A集計</span>
          </div>
          <div className={sx.chartWrap} ref={organizationMedalChartRef} style={{ height: organizationBarChartHeight }}>
            {topOrganizationMedals.length > 0 && organizationMedalChartWidth > 0 ? (
              <BarChart
                width={organizationMedalChartWidth}
                height={organizationBarChartHeight}
                data={topOrganizationMedals}
                layout="horizontal"
                margin={{ top: 22, left: 0, right: 10, bottom: 34 }}
              >
                <CartesianGrid vertical={false} stroke="#e4eefb" />
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
              <div className={sx.chartEmpty}>No data</div>
            ) : null}
            {showChartLoading ? (
              <div className={sx.chartLoading} role="status" aria-live="polite">
                <span className={sx.chartSpinner} aria-hidden="true" />
                <span>Loading...</span>
              </div>
            ) : null}
          </div>
        </article>

        <article className={sx.chartCard} data-ga-event="chart_interaction" data-ga-label="organization_golds_chart" data-ga-location="/">
          <div className={sx.chartCardHead}>
            <h2 className={sx.chartCardTitle}>団体別金メダル数(Top8)</h2>
            <span className={sx.chartCardCaption}>Final A集計</span>
          </div>
          <div className={sx.chartWrap} ref={organizationGoldChartRef} style={{ height: organizationBarChartHeight }}>
            {topOrganizationGolds.length > 0 && organizationGoldChartWidth > 0 ? (
              <BarChart
                width={organizationGoldChartWidth}
                height={organizationBarChartHeight}
                data={topOrganizationGolds}
                layout="horizontal"
                margin={{ top: 22, left: 0, right: 10, bottom: 34 }}
              >
                <CartesianGrid vertical={false} stroke="#e4eefb" />
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
              <div className={sx.chartEmpty}>No data</div>
            ) : null}
            {showChartLoading ? (
              <div className={sx.chartLoading} role="status" aria-live="polite">
                <span className={sx.chartSpinner} aria-hidden="true" />
                <span>Loading...</span>
              </div>
            ) : null}
          </div>
        </article>

        {/* 種目未選択時は大きな空状態が一等地を占有するだけなのでカードごと出さない */}
        {event && (
        <article className={sx.winnerTrendCard} data-ga-event="chart_interaction" data-ga-label="winner_trend_chart" data-ga-location="/">
          <div className={sx.chartCardHead}>
            <h2 className={sx.chartCardTitle}>優勝タイム推移</h2>
            <span className={sx.chartCardCaption}>{event}</span>
          </div>
          <div className={winnerTrendHasData ? sx.winnerTrendWrap : sx.winnerTrendWrapNoData} ref={winnerTrendChartRef}>
            {winnerTrendHasData ? (
              winnerTrendChartWidth > 0 ? (
                <LineChart width={winnerTrendChartWidth} height={260} data={winnerTrend}>
                  <CartesianGrid vertical={false} stroke="#e4eefb" />
                  <XAxis dataKey="label" />
                  {/* タイム差が読めるようY軸は0起点にせずデータ範囲へフィットさせる */}
                  <YAxis tickFormatter={formatSecondsForAxis} domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip formatter={(value) => formatSecondsToTime(Number(value))} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="value" stroke={CHART_BLUE} strokeWidth={3} dot />
                </LineChart>
              ) : null
            ) : winnerTrendSingle ? (
              <div className={`${sx.chartEmpty} ${sx.chartEmptyNoData} ${sx.chartSinglePoint}`}>
                <p className={sx.singlePointValue}>
                  {winnerTrendSingle.label}年の優勝タイム(平均): <strong className={sx.singlePointStrong}>{formatSecondsToTime(winnerTrendSingle.value)}</strong>
                </p>
                <p className={sx.singlePointHint}>年フィルタを解除すると、年ごとの推移を表示できます</p>
              </div>
            ) : (
              <div className={`${sx.chartEmpty} ${sx.chartEmptyNoData}`}>{event ? "No data" : "種目を選択してください (No data)"}</div>
            )}
            {showChartLoading ? (
              <div className={sx.chartLoading} role="status" aria-live="polite">
                <span className={sx.chartSpinner} aria-hidden="true" />
                <span>Loading...</span>
              </div>
            ) : null}
          </div>
        </article>
        )}

      </section>

      <section id="results" className={`${sx.tableCard}${isRefreshing ? " opacity-70" : ""}`}>
        <div className={sx.tableHead}>
          <h2 className={sx.tableTitle}>
            検索結果 ({pagination.total_count}件){" "}
            {pagination.total_count > 0 ? ` ${pageStart}-${pageEnd}件を表示` : ""}
          </h2>
          <label className={sx.perPage}>
            <span className={sx.perPageLabel}>表示件数</span>
            <select
              className={sx.perPageSelect}
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
        <div className={sx.tableScroll}>
          <table>
            <thead>
              <tr>
                <th className={`${sx.th} ${sx.colYear}`}>年</th>
                <th className={`${sx.th} ${sx.colCompetition}`}>大会</th>
                <th className={`${sx.th} ${sx.colEvent}`}>種目</th>
                <th className={`${sx.th} ${sx.colFinal}`}>Final</th>
                <th className={`${sx.th} ${sx.colCrew}`}>クルー</th>
                <th className={`${sx.th} ${sx.colOrganization}`}>団体</th>
                <th className={`${sx.th} ${sx.colRank}`}>順位</th>
                <th className={`${sx.th} ${sx.colTime}`}>タイム</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td className={sx.tableEmpty} colSpan={8}>
                    <div className={sx.emptyResults}>
                      <p className={sx.emptyResultsText}>{noResultMessage}</p>
                      {activeFilters.length > 0 && (
                        <button type="button" className={sx.emptyResultsBtn} onClick={clearFilters}>
                          フィルタをクリアして再検索
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                results.map((row) => (
                  <tr key={row.id} className={sx.tr} data-ga-event="result_open" data-ga-label={`${row.year}_${row.event_name}`} data-ga-location="/">
                    <td className={`${sx.colYear} ${sx.tdHover}`}>{row.year}</td>
                    <td className={`${sx.colCompetition} ${sx.tdHover}`} title={row.competition_name}>
                      <div className={sx.cellClamp}>{row.competition_name}</div>
                    </td>
                    <td className={`${sx.colEvent} ${sx.tdHover}`} title={row.event_name}>
                      <div className={sx.cellClamp}>{row.event_name}</div>
                    </td>
                    <td className={`${sx.colFinal} ${sx.tdHover}`}>{row.final_group}</td>
                    <td className={`${sx.colCrew} ${sx.tdHover}`} title={row.crew_name}>
                      <div className={sx.cellEllipsis}>{row.crew_name}</div>
                    </td>
                    <td className={`${sx.colOrganization} ${sx.tdHover}`} title={row.organization}>
                      <div className={sx.cellEllipsis}>{row.organization}</div>
                    </td>
                    <td className={`${sx.colRank} ${sx.tdHover}`}>
                      <span className={`${sx.rankBadge} ${rankBadgeMedalClassName(row) || sx.rankBadgePlain}`}>{row.rank}</span>
                    </td>
                    <td className={`${sx.colTime} ${sx.tdHover}`}>{row.time_display}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={sx.mobileCards} aria-label="検索結果（モバイル表示）">
          {results.length === 0 ? (
            <div className={sx.resultCardEmpty}>
              <div className={sx.emptyResults}>
                <p className={sx.emptyResultsText}>{noResultMessage}</p>
                {activeFilters.length > 0 && (
                  <button type="button" className={sx.emptyResultsBtn} onClick={clearFilters}>
                    フィルタをクリアして再検索
                  </button>
                )}
              </div>
            </div>
          ) : (
            results.map((row) => (
              <article className={sx.resultCard} key={`mobile-${row.id}`} data-ga-event="result_open" data-ga-label={`${row.year}_${row.event_name}`} data-ga-location="/">
                <header className={sx.resultCardHead}>
                  <span className={sx.resultCardTag}>{row.year}</span>
                  <span className={sx.resultCardTag}>{row.final_group}</span>
                  <span className={`ml-auto ${sx.rankBadge} ${rankBadgeMedalClassName(row) || sx.rankBadgePlain}`}>{row.rank}</span>
                </header>
                <p className={sx.resultCardEvent}>{row.event_name}</p>
                <p className={sx.resultCardCompetition} title={row.competition_name}>
                  {row.competition_name}
                </p>
                <dl className={sx.resultCardMeta}>
                  <div className={sx.resultCardMetaRow}>
                    <dt className={sx.resultCardMetaDt}>クルー</dt>
                    <dd className={sx.resultCardMetaDd}>{row.crew_name}</dd>
                  </div>
                  {/* 団体名クルー（大学等）はクルーと同一値なので二重表示しない */}
                  {row.organization !== row.crew_name && (
                    <div className={sx.resultCardMetaRow}>
                      <dt className={sx.resultCardMetaDt}>団体</dt>
                      <dd className={sx.resultCardMetaDd}>{row.organization}</dd>
                    </div>
                  )}
                  <div className={sx.resultCardMetaRow}>
                    <dt className={sx.resultCardMetaDt}>タイム</dt>
                    <dd className={sx.resultCardMetaDd}>{row.time_display}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>

        <div className={sx.pagination}>
          <button type="button" className={sx.pagBtn} disabled={pagination.page <= 1 || loading} onClick={() => goToPage(1)}>
            先頭
          </button>
          <button type="button" className={sx.pagBtn} disabled={pagination.page <= 1 || loading} onClick={() => goToPage(pagination.page - 1)}>
            前へ
          </button>

          <div className={sx.pagPages} aria-label="ページ番号">
            {pagination.total_pages <= 0 ? (
              <span className={sx.pagEmpty}>0 / 0</span>
            ) : (
              pageNumbers.map((pageNumber, index) => {
                const previous = index > 0 ? pageNumbers[index - 1] : null;
                const showEllipsis = previous !== null && pageNumber - previous > 1;

                return (
                  <span key={`page-${pageNumber}`}>
                    {showEllipsis ? <span className={sx.pagEllipsis}>…</span> : null}
                    <button
                      type="button"
                      className={pageNumber === pagination.page ? sx.pageNumActive : sx.pageNum}
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
            className={sx.pagBtn}
            disabled={pagination.total_pages === 0 || pagination.page >= pagination.total_pages || loading}
            onClick={() => goToPage(pagination.page + 1)}
          >
            次へ
          </button>
          <button
            type="button"
            className={sx.pagBtn}
            disabled={pagination.total_pages === 0 || pagination.page >= pagination.total_pages || loading}
            onClick={() => goToPage(pagination.total_pages)}
          >
            末尾
          </button>

          <form
            className={sx.pagJump}
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = Number(pageInput);
              if (!Number.isFinite(parsed)) return;
              goToPage(parsed);
            }}
          >
            <label htmlFor="page-jump-input" className={sx.pagJumpLabel}>移動</label>
            <input
              id="page-jump-input"
              className={sx.pagJumpInput}
              type="number"
              min={1}
              max={Math.max(1, pagination.total_pages)}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
            />
            <button type="submit" className={sx.pagBtn} disabled={loading || pagination.total_pages <= 0}>
              Go
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
