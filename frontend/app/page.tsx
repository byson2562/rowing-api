"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
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
type FilterOptionsResponse = {
  years: number[];
  genders: string[];
  affiliation_types: string[];
  final_groups: string[];
  competitions: string[];
  events: string[];
  organizations: string[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

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

export default function Page() {
  const [results, setResults] = useState<Result[]>([]);
  const [yearCount, setYearCount] = useState<StatPoint[]>([]);
  const [organizationMedals, setOrganizationMedals] = useState<StatPoint[]>([]);
  const [organizationGolds, setOrganizationGolds] = useState<StatPoint[]>([]);
  const [winnerTrend, setWinnerTrend] = useState<StatPoint[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 50, total_count: 0, total_pages: 0 });
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse>({
    years: [],
    genders: [],
    affiliation_types: [],
    final_groups: [],
    competitions: [],
    events: [],
    organizations: []
  });
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [affiliationType, setAffiliationType] = useState("");
  const [event, setEvent] = useState("");
  const [finalGroup, setFinalGroup] = useState("");
  const [competition, setCompetition] = useState("");
  const [organization, setOrganization] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false);
  const [rank, setRank] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("50");

  const rankOptions = useMemo(() => Array.from({ length: 8 }, (_, index) => `${index + 1}`), []);
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
    if (organization) params.set("organization", organization);
    if (rank) params.set("rank", rank);
    return params.toString();
  }, [affiliationType, competition, event, finalGroup, gender, organization, q, rank, year]);

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
    if (event) params.set("event", event);
    if (finalGroup) params.set("final_group", finalGroup);
    if (organization) params.set("organization", organization);
    return params.toString();
  }, [affiliationType, competition, event, finalGroup, gender, organization, year]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resultsRes, yearCountRes, orgMedalRes, orgGoldRes, winnerTrendRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/results?${resultsQuery}`),
          fetch(`${API_BASE_URL}/api/v1/results/stats?group_by=year_count&${baseQuery}`),
          fetch(`${API_BASE_URL}/api/v1/results/stats?group_by=organization_medals&${baseQuery}`),
          fetch(`${API_BASE_URL}/api/v1/results/stats?group_by=organization_golds&${baseQuery}`),
          event ? fetch(`${API_BASE_URL}/api/v1/results/stats?group_by=winner_time_trend&${baseQuery}`) : Promise.resolve(null)
        ]);

        const resultsData = (await resultsRes.json()) as ResultsResponse;
        const yearCountData = (await yearCountRes.json()) as StatsResponse;
        const orgMedalData = (await orgMedalRes.json()) as StatsResponse;
        const orgGoldData = (await orgGoldRes.json()) as StatsResponse;
        setResults(Array.isArray(resultsData.data) ? resultsData.data : []);
        setPagination(
          resultsData.pagination ?? {
            page: page,
            per_page: Number(perPage),
            total_count: 0,
            total_pages: 0
          }
        );
        setYearCount(yearCountData.data ?? []);
        setOrganizationMedals(orgMedalData.data ?? []);
        setOrganizationGolds(orgGoldData.data ?? []);
        if (winnerTrendRes) {
          const winnerTrendData = (await winnerTrendRes.json()) as StatsResponse;
          setWinnerTrend(winnerTrendData.data ?? []);
        } else {
          setWinnerTrend([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseQuery, event, page, perPage, resultsQuery]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/results/filters?${filterQuery}`);
      const payload = (await response.json()) as FilterOptionsResponse;
      setFilterOptions({
        years: payload.years ?? [],
        genders: payload.genders ?? [],
        affiliation_types: payload.affiliation_types ?? [],
        final_groups: payload.final_groups ?? [],
        competitions: payload.competitions ?? [],
        events: payload.events ?? [],
        organizations: payload.organizations ?? []
      });
    };

    fetchFilterOptions();
  }, [filterQuery]);

  useEffect(() => {
    setPage(1);
  }, [affiliationType, competition, event, finalGroup, gender, organization, q, rank, year]);

  const clearFilters = () => {
    setQ("");
    setYear("");
    setGender("");
    setAffiliationType("");
    setEvent("");
    setFinalGroup("");
    setCompetition("");
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
    const chips: string[] = [];
    if (year) chips.push(`年: ${year}`);
    if (gender) chips.push(`性別: ${gender}`);
    if (affiliationType) chips.push(`区分: ${affiliationType}`);
    if (competition) chips.push(`大会: ${competition}`);
    if (event) chips.push(`種目: ${event}`);
    if (finalGroup) chips.push(`Final: ${finalGroup}`);
    if (organization) chips.push(`所属: ${organization}`);
    if (rank) chips.push(`順位: ${rank}`);
    if (q) chips.push(`検索: ${q}`);
    return chips;
  }, [affiliationType, competition, event, finalGroup, gender, organization, q, rank, year]);

  const yearRangeLabel = useMemo(() => {
    if (yearCount.length === 0) return "-";
    const labels = yearCount.map((point) => Number(point.label)).filter((value) => Number.isFinite(value));
    if (labels.length === 0) return "-";
    const min = Math.min(...labels);
    const max = Math.max(...labels);
    return min === max ? `${min}` : `${min}-${max}`;
  }, [yearCount]);

  const pageStart = pagination.total_count === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const pageEnd = pagination.total_count === 0 ? 0 : pageStart + results.length - 1;
  const filteredOrganizations = useMemo(() => {
    const keyword = organizationSearch.trim().toLowerCase();
    const options = filterOptions.organizations;
    if (!keyword) return options;
    return options.filter((option) => option.toLowerCase().includes(keyword));
  }, [filterOptions.organizations, organizationSearch]);

  const chooseOrganization = (value: string) => {
    setOrganization(value);
    setOrganizationSearch(value);
    setOrganizationMenuOpen(false);
    setPage(1);
  };

  return (
    <main className="container">
      <header className="hero">
        <div>
          <h1>RowingAPI</h1>
          <p className="subtitle">大会記録を検索し、件数・メダル傾向・優勝タイム推移を可視化</p>
        </div>
        <div className="hero-badge">{loading ? "Loading..." : "Live Dashboard"}</div>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-label">検索結果</p>
          <p className="kpi-value">{pagination.total_count}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">集計年レンジ</p>
          <p className="kpi-value">{yearRangeLabel}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">有効フィルタ</p>
          <p className="kpi-value">{activeFilters.length}</p>
        </article>
      </section>

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
              >
                {label}
              </button>
            );
          })}
        </section>

        <section className="filters">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="キーワード" />

          <select data-testid="year-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">年(すべて)</option>
            {filterOptions.years.map((option) => (
              <option key={option} value={option.toString()}>
                {option}
              </option>
            ))}
          </select>

          <select data-testid="competition-select" value={competition} onChange={(e) => setCompetition(e.target.value)}>
            <option value="">大会名(すべて)</option>
            {filterOptions.competitions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            data-testid="affiliation-type-select"
            value={affiliationType}
            onChange={(e) => setAffiliationType(e.target.value)}
          >
            <option value="">区分(すべて)</option>
            {filterOptions.affiliation_types.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select data-testid="event-select" value={event} onChange={(e) => setEvent(e.target.value)}>
            <option value="">種目(すべて)</option>
            {filterOptions.events.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select data-testid="final-group-select" value={finalGroup} onChange={(e) => setFinalGroup(e.target.value)}>
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
              onChange={(e) => {
                const value = e.target.value;
                setOrganizationSearch(value);
                setOrganization("");
                setPage(1);
                setOrganizationMenuOpen(true);
              }}
              placeholder="所属を検索して選択"
            />
            {organizationMenuOpen && (
              <div className="organization-combobox-menu" data-testid="organization-combobox-menu">
                <button
                  type="button"
                  className={!organization ? "active" : ""}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOrganization("");
                    setOrganizationSearch("");
                    setOrganizationMenuOpen(false);
                    setPage(1);
                  }}
                >
                  所属(すべて)
                </button>
                {filteredOrganizations.slice(0, 50).map((option) => (
                  <button
                    type="button"
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

          <select data-testid="rank-select" value={rank} onChange={(e) => setRank(e.target.value)}>
            <option value="">順位(すべて)</option>
            {rankOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            data-testid="per-page-select"
            value={perPage}
            onChange={(e) => {
              setPerPage(e.target.value);
              setPage(1);
            }}
          >
            <option value="25">25件/ページ</option>
            <option value="50">50件/ページ</option>
            <option value="100">100件/ページ</option>
            <option value="200">200件/ページ</option>
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
              <span className="chip" key={chip}>
                {chip}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="cards">
        <article className="chart-card">
          <div className="chart-card-head">
            <h2>所属別金メダル数(上位10)</h2>
            <span>Final A golds</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={organizationGolds} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={160} interval={0} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-card-head">
            <h2>所属別メダル数(上位10)</h2>
            <span>Final A medals</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={organizationMedals} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={160} interval={0} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef6c00" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-card-head">
            <h2>優勝タイム推移</h2>
            <span>{event ? event : "種目を選択"}</span>
          </div>
          <div className="chart-wrap">
            {event && winnerTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={winnerTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={formatSecondsForAxis} />
                  <Tooltip formatter={(value) => formatSecondsToTime(Number(value))} />
                  <Line type="monotone" dataKey="value" stroke="#2e7d32" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">{event ? "No data" : "種目を選択してください (No data)"}</div>
            )}
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-card-head">
            <h2>年別レコード件数</h2>
            <span>Records by year</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearCount}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="table-card">
        <h2>
          検索結果 {loading ? "(読み込み中...)" : `(${pagination.total_count}件)`}{" "}
          {pagination.total_count > 0 && !loading ? ` ${pageStart}-${pageEnd}件を表示` : ""}
        </h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>年</th>
                <th>大会</th>
                <th>種目</th>
                <th>Final</th>
                <th>クルー</th>
                <th>所属</th>
                <th>順位</th>
                <th>タイム</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td className="table-empty" colSpan={8}>
                    No data
                  </td>
                </tr>
              ) : (
                results.map((row) => (
                  <tr key={row.id}>
                    <td>{row.year}</td>
                    <td>{row.competition_name}</td>
                    <td>{row.event_name}</td>
                    <td>{row.final_group}</td>
                    <td>{row.crew_name}</td>
                    <td>{row.organization}</td>
                    <td className={rankCellClassName(row)}>{row.rank}</td>
                    <td>{row.time_display}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination-controls">
          <button type="button" disabled={pagination.page <= 1 || loading} onClick={() => setPage((prev) => prev - 1)}>
            前へ
          </button>
          <span data-testid="pagination-indicator">
            {pagination.total_pages === 0 ? "0 / 0" : `${pagination.page} / ${pagination.total_pages}`}
          </span>
          <button
            type="button"
            disabled={pagination.total_pages === 0 || pagination.page >= pagination.total_pages || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            次へ
          </button>
        </div>
      </section>
    </main>
  );
}
