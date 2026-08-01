"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpDown, Building2, Users } from "lucide-react";
import { peopleDirectory, type PersonProfile } from "@/lib/people-data";
import { PageHeader } from "@/components/ui/PageHeader";
import { AvatarMark } from "@/components/ui/BrandMark";
import { CatalogSearch } from "@/components/ui/CatalogSearch";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

type SortKey = "name" | "office" | "division" | "role";

function uniqueSorted(values: (string | undefined)[]): string[] {
  return Array.from(
    new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))
  ).sort((a, b) => a.localeCompare(b));
}

function matchesFilters(
  person: PersonProfile,
  q: string,
  office: string,
  division: string,
  role: string
): boolean {
  if (office !== "all" && person.office !== office) return false;
  if (division !== "all" && person.division !== division) return false;
  if (role !== "all" && person.role !== role) return false;
  if (!q) return true;
  const hay = [
    person.name,
    person.handle,
    person.role,
    person.office,
    person.division,
    person.bio,
    ...(person.projects ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function sortPeople(list: PersonProfile[], sort: SortKey): PersonProfile[] {
  const next = [...list];
  next.sort((a, b) => {
    const av =
      sort === "name"
        ? a.name
        : sort === "office"
          ? a.office ?? ""
          : sort === "division"
            ? a.division ?? ""
            : a.role ?? "";
    const bv =
      sort === "name"
        ? b.name
        : sort === "office"
          ? b.office ?? ""
          : sort === "division"
            ? b.division ?? ""
            : b.role ?? "";
    const cmp = av.localeCompare(bv);
    return cmp !== 0 ? cmp : a.name.localeCompare(b.name);
  });
  return next;
}

const selectClass = cn(
  "h-9 min-w-0 appearance-none rounded-xl border border-[var(--glass-border-soft)]",
  "bg-[var(--glass-strong-solid)]/90 pl-3 pr-8 text-[13px]",
  "text-[var(--text-primary)] shadow-[var(--shadow-sm)] outline-none",
  "transition-[border-color] duration-150",
  "hover:border-[var(--glass-border)] focus:border-[var(--glass-border)]"
);

/**
 * People directory — search, filter by office / division / role, sort.
 */
export function PeopleView() {
  const [query, setQuery] = useState("");
  const [office, setOffice] = useState("all");
  const [division, setDivision] = useState("all");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");

  const offices = useMemo(
    () => uniqueSorted(peopleDirectory.map((p) => p.office)),
    []
  );
  const divisions = useMemo(
    () => uniqueSorted(peopleDirectory.map((p) => p.division)),
    []
  );
  const roles = useMemo(
    () => uniqueSorted(peopleDirectory.map((p) => p.role)),
    []
  );

  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    const filtered = peopleDirectory.filter((p) =>
      matchesFilters(p, q, office, division, role)
    );
    return sortPeople(filtered, sort);
  }, [q, office, division, role, sort]);

  const hasFilters =
    office !== "all" || division !== "all" || role !== "all" || q.length > 0;

  const clearFilters = () => {
    setQuery("");
    setOffice("all");
    setDivision("all");
    setRole("all");
    setSort("name");
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[920px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="People"
            icon={Users}
            title="Find colleagues"
            description="Browse faces across offices and projects — open profiles and jump into related feed conversations."
            className="mb-4"
          />

          {/* Search + filters + sort */}
          <div
            className={cn(
              "mb-5 space-y-2.5 rounded-2xl border border-[var(--glass-border-soft)]",
              "bg-[var(--glass-strong-solid)]/80 p-3 shadow-[var(--shadow-sm)] backdrop-blur-xl"
            )}
            data-people-filters
          >
            <CatalogSearch
              value={query}
              onChange={setQuery}
              placeholder="Search name, role, project…"
              aria-label="Search people"
              data-testid="people-search"
              inputClassName="h-9 bg-[var(--hover-fill)] shadow-none"
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--text-muted)]">
                <Building2 className="h-3 w-3" strokeWidth={ICON_STROKE} />
                Filter
              </span>

              <label className="relative min-w-[7.5rem] flex-1 sm:flex-none sm:min-w-[8.5rem]">
                <span className="sr-only">Office</span>
                <select
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  className={cn(selectClass, "w-full")}
                  data-people-filter-office
                >
                  <option value="all">All offices</option>
                  {offices.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </label>

              <label className="relative min-w-[7.5rem] flex-1 sm:flex-none sm:min-w-[8.5rem]">
                <span className="sr-only">Division</span>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className={cn(selectClass, "w-full")}
                  data-people-filter-division
                >
                  <option value="all">All divisions</option>
                  {divisions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </label>

              <label className="relative min-w-[7.5rem] flex-1 sm:flex-none sm:min-w-[9rem]">
                <span className="sr-only">Role</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={cn(selectClass, "w-full")}
                  data-people-filter-role
                >
                  <option value="all">All roles</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </label>

              <label className="relative min-w-[8rem] flex-1 sm:ml-auto sm:flex-none sm:min-w-[9.5rem]">
                <span className="sr-only">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className={cn(selectClass, "w-full pl-8")}
                  data-people-sort
                >
                  <option value="name">Sort: Name</option>
                  <option value="office">Sort: Office</option>
                  <option value="division">Sort: Division</option>
                  <option value="role">Sort: Role</option>
                </select>
                <ArrowUpDown
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]"
                  strokeWidth={ICON_STROKE}
                />
                <SelectChevron />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 px-0.5">
              <p className="text-[12px] text-[var(--text-muted)]">
                {visible.length}{" "}
                {visible.length === 1 ? "person" : "people"}
                {hasFilters ? " match" : ""}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  data-people-clear-filters
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="py-14 text-center text-[13px] text-[var(--text-muted)]">
              No colleagues match these filters.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((person, i) => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="block"
                  data-person-card={person.id}
                >
                  <motion.article
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.035, 0.22),
                      duration: 0.32,
                      ease: easeSpring,
                    }}
                    className={cn(
                      "flex h-full flex-col gap-3 rounded-[18px] border border-[var(--glass-border-soft)]",
                      "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-sm)]",
                      "transition-[border-color,box-shadow] duration-200",
                      "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-md)]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <AvatarMark
                        src={person.avatarUrl}
                        initials={person.initials}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold tracking-tight text-[var(--text-primary)]">
                          {person.name}
                        </p>
                        <p className="truncate text-[12px] text-[var(--text-muted)]">
                          @{person.handle}
                          {person.role ? ` · ${person.role}` : ""}
                        </p>
                        {person.office && (
                          <p className="mt-0.5 text-[11.5px] text-[var(--text-secondary)]">
                            {person.office}
                            {person.division ? ` · ${person.division}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                      {person.bio}
                    </p>
                    {person.projects && person.projects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {person.projects.map((p) => (
                          <span
                            key={p}
                            className="rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--text-muted)]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollFade>
    </div>
  );
}

function SelectChevron() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]"
    >
      ▾
    </span>
  );
}
