import { useMemo, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";

interface NewPlacementPickerProps {
  requests: CoordinatorQuotaRequest[];
  onUseRequest: (request: CoordinatorQuotaRequest) => void;
  onStartBlank: () => void;
  onRequestQuota?: () => void;
}

function fmt(d: string): string {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function periodOf(req: CoordinatorQuotaRequest): string {
  if (!req.startDate) return "";
  const [y, m] = req.startDate.split("-");
  const semester = parseInt(m || "1", 10) < 7 ? "Spring" : "Autumn";
  return `${semester} ${y}`;
}

interface Cap {
  approved: number;
  consumed: number;
  requested: number;
  available: number;
  isPending: boolean;
  entityLine: string;
}

function capacityOf(req: CoordinatorQuotaRequest): Cap {
  const ents = req.entityDistributions ?? [];
  const isPending = req.status === "pending";
  const approved = ents.reduce((s, e) => s + (e.approvedQuota ?? 0), 0);
  const consumed = ents.reduce((s, e) => s + (e.consumedQuota ?? 0), 0);
  const requested = ents.reduce((s, e) => s + (e.requestedQuota ?? 0), 0);
  const entityLine = ents
    .map((e) =>
      isPending
        ? `${e.entityName} ${e.requestedQuota ?? 0} requested`
        : `${e.entityName} ${(e.approvedQuota ?? 0) - (e.consumedQuota ?? 0)}/${e.approvedQuota ?? 0}`,
    )
    .join("  ·  ");
  return { approved, consumed, requested, available: approved - consumed, isPending, entityLine };
}

export function NewPlacementPicker({
  requests,
  onUseRequest,
  onStartBlank,
  onRequestQuota,
}: NewPlacementPickerProps) {
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterEmne, setFilterEmne] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  const programmes = useMemo(
    () => [...new Set(requests.map((r) => r.programName).filter(Boolean))].sort(),
    [requests],
  );
  const emner = useMemo(
    () => [...new Set(requests.map((r) => r.emne).filter(Boolean))].sort() as string[],
    [requests],
  );
  const periods = useMemo(
    () => [...new Set(requests.map(periodOf).filter(Boolean))].sort(),
    [requests],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (filterProgram !== "all" && r.programName !== filterProgram) return false;
      if (filterEmne !== "all" && r.emne !== filterEmne) return false;
      if (filterPeriod !== "all" && periodOf(r) !== filterPeriod) return false;
      if (q && !r.praksisPlaceName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [requests, filterProgram, filterEmne, filterPeriod, search]);

  return (
    <div className="px-8 py-6 max-w-3xl">
      {/* Search & filters — search toggles into a full-width input (matches
          the pattern used on Capacity planning, Priorities, etc.) */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {!isSearchMode ? (
          <>
            <Button
              variant="outline"
              onClick={() => setIsSearchMode(true)}
              className="h-9 justify-start text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200"
            >
              <Search className="h-4 w-4" />
            </Button>

            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="All programmes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programmes</SelectItem>
                {programmes.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEmne} onValueChange={setFilterEmne}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="All emne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All emne</SelectItem>
                {emner.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Any period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any period</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterProgram !== "all" ||
              filterEmne !== "all" ||
              filterPeriod !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setFilterProgram("all");
                  setFilterEmne("all");
                  setFilterPeriod("all");
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </>
        ) : (
          <>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search praksis place…"
                className="h-9 pl-9"
                autoFocus
              />
            </div>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => {
                setIsSearchMode(false);
                setSearch("");
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-6 mb-3">
        <p className="text-sm text-gray-500">
          {filtered.length > 0
            ? `${filtered.length} request${filtered.length === 1 ? "" : "s"} with capacity for your programme`
            : ""}
        </p>
        <button
          type="button"
          onClick={onStartBlank}
          className="text-sm text-blue-600 hover:text-blue-700 font-semibold whitespace-nowrap"
        >
          Start a blank placement
        </button>
      </div>

      {/* Cards */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((req) => {
            const cap = capacityOf(req);
            const total = cap.isPending ? cap.requested || 1 : cap.approved || 1;
            const usedPct = cap.isPending ? 0 : (cap.consumed / total) * 100;
            const freePct = cap.isPending ? 0 : (cap.available / total) * 100;
            return (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors grid grid-cols-[1fr_auto] gap-x-4"
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {req.praksisPlaceName}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {req.programName}
                    <span className="text-gray-300 mx-2">•</span>
                    {req.emne || "—"}
                    <span className="text-gray-300 mx-2">•</span>
                    {fmt(req.startDate)} – {fmt(req.endDate)}
                  </div>
                </div>
                <div className="row-span-2 flex flex-col items-end justify-between gap-3">
                  <Badge
                    className={
                      cap.isPending
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                    }
                  >
                    {cap.isPending ? "Awaiting approval" : "Approved"}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => onUseRequest(req)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Use this
                  </Button>
                </div>

                {/* Capacity meter */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-xs text-gray-500 mb-1.5">
                    <span>
                      {cap.isPending ? "Requested capacity" : "Capacity"}{" "}
                      <span className="font-semibold text-gray-700">
                        {cap.isPending ? cap.requested : cap.approved} places
                      </span>
                    </span>
                    <span>
                      {cap.isPending ? (
                        <span className="text-amber-700">pending approval</span>
                      ) : (
                        <span className="text-green-700 font-semibold">{cap.available} available</span>
                      )}
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                    <div className="bg-blue-600 h-full" style={{ width: `${usedPct}%` }} />
                    <div className="bg-green-500 h-full" style={{ width: `${freePct}%` }} />
                  </div>
                  {!cap.isPending && (
                    <div className="flex gap-4 mt-1.5 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-sm bg-blue-600" />
                        {cap.consumed} in use
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-sm bg-green-500" />
                        {cap.available} available
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1.5">{cap.entityLine}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-lg py-12 text-center text-gray-500">
          <p className="font-medium text-gray-700">No matching capacity</p>
          <p className="text-sm mt-1">Nothing approved fits those filters yet.</p>
          {onRequestQuota && (
            <button
              type="button"
              onClick={onRequestQuota}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm mt-4"
            >
              Request quota →
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-200 text-sm text-gray-500">
        Can't find what you need?
        {onRequestQuota && (
          <button
            type="button"
            onClick={onRequestQuota}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Request quota
          </button>
        )}
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={onStartBlank}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          Start a blank placement instead
        </button>
      </div>
    </div>
  );
}
