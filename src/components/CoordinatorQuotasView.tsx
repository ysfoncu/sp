import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Plus,
  Search,
  ClipboardCheck,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Check,
  AlertCircle,
  ArrowRight,
  X,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  CalendarRange,
} from "lucide-react";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";
import { QuotaOffering } from "../types/quotaOffering";
import { PraksisPlace } from "../types/praksisPlace";
import { Study } from "./SettingsView";
import { PlacementTaskState } from "../types/studentPlacement";
import { RequestQuotaModal } from "./RequestQuotaModal";
import { ApproveRejectQuotaModal } from "./ApproveRejectQuotaModal";
import { CapacityPlanningHelpOverlay } from "./CapacityPlanningHelpOverlay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type PeriodOption = "previous" | "current" | "next" | "expired" | "custom";

function getSemesterRanges(today: Date) {
  const year = today.getFullYear();
  const aug1 = new Date(year, 7, 1); // Aug 1
  if (today < aug1) {
    return {
      previous: { start: new Date(year - 1, 7, 1), end: new Date(year - 1, 11, 1) },
      current:  { start: new Date(year, 0, 1),      end: new Date(year, 7, 1) },
      next:     { start: new Date(year, 7, 1),       end: new Date(year, 11, 1) },
    };
  }
  return {
    previous: { start: new Date(year, 0, 1),      end: new Date(year, 7, 1) },
    current:  { start: new Date(year, 7, 1),       end: new Date(year, 11, 1) },
    next:     { start: new Date(year + 1, 0, 1),   end: new Date(year + 1, 7, 1) },
  };
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface CoordinatorQuotasViewProps {
  quotaOfferings: QuotaOffering[];
  quotaRequests: CoordinatorQuotaRequest[];
  praksisPlaces: PraksisPlace[];
  studies: Study[];
  currentUserName: string;
  placementTaskStates?: PlacementTaskState[];
  nodeSlots?: Record<string, Record<string, number>>;
  onRequestCreate: (
    request: Omit<
      CoordinatorQuotaRequest,
      "id" | "requestedDate" | "status"
    >,
  ) => void;
  onRequestUpdate: (
    id: string,
    updates: Partial<CoordinatorQuotaRequest>,
  ) => void;
  onRequestDelete: (id: string) => void;
  onNavigateToPlacement?: (request: CoordinatorQuotaRequest) => void;
}

export function CoordinatorQuotasView({
  quotaOfferings,
  quotaRequests,
  praksisPlaces,
  studies,
  currentUserName,
  placementTaskStates = [],
  nodeSlots = {},
  onRequestCreate,
  onRequestUpdate,
  onRequestDelete,
  onNavigateToPlacement,
}: CoordinatorQuotasViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isQuotaSearchMode, setIsQuotaSearchMode] = useState(false);
  const [filterStudy, setFilterStudy] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmne, setFilterEmne] = useState("all");
  const [filterPlace, setFilterPlace] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [isRequestModalOpen, setIsRequestModalOpen] =
    useState(false);
  const [deletingRequest, setDeletingRequest] =
    useState<CoordinatorQuotaRequest | null>(null);
  const [approvingRequest, setApprovingRequest] =
    useState<CoordinatorQuotaRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] =
    useState<CoordinatorQuotaRequest | null>(null);
  const [showApprovalWarning, setShowApprovalWarning] =
    useState<CoordinatorQuotaRequest | null>(null);

  // Chat dialog state
  const [chatContact, setChatContact] = useState<{ name: string; email: string } | null>(null);

  // Help overlay state
  const [isHelpOverlayOpen, setIsHelpOverlayOpen] = useState(false);

  // Period filter
  const [selectedPeriods, setSelectedPeriods] = useState<Set<PeriodOption>>(
    new Set(["current", "next"] as PeriodOption[])
  );
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isPeriodFilterOpen, setIsPeriodFilterOpen] = useState(false);
  const periodFilterRef = useRef<HTMLDivElement>(null);

  // Oslo University ID (must match the universityId in studies data)
  const OSLO_UNIVERSITY_ID = "U1";

  // Close period filter panel when clicking outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (periodFilterRef.current && !periodFilterRef.current.contains(e.target as Node)) {
        setIsPeriodFilterOpen(false);
      }
    };
    if (isPeriodFilterOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isPeriodFilterOpen]);

  const semesterRanges = useMemo(() => getSemesterRanges(new Date()), []);

  const togglePeriod = (period: PeriodOption) => {
    setSelectedPeriods((prev) => {
      const next = new Set(prev);
      if (period === "custom") {
        return next.has("custom") ? (() => { next.delete("custom"); return next; })() : new Set(["custom"] as PeriodOption[]);
      }
      // Switching away from custom
      if (next.has("custom")) next.delete("custom");
      if (next.has(period)) next.delete(period); else next.add(period);
      return next;
    });
  };

  // Returns true if a record's [start, end] overlaps the active period filter
  const matchesPeriod = (startDateStr: string, endDateStr: string): boolean => {
    if (selectedPeriods.size === 0) return true;
    const rStart = new Date(startDateStr);
    const rEnd = new Date(endDateStr);
    if (selectedPeriods.has("custom")) {
      if (!customStartDate || !customEndDate) return false;
      const cStart = new Date(customStartDate);
      const cEnd = new Date(customEndDate);
      return rStart <= cEnd && rEnd >= cStart;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedPeriods.has("expired") && rEnd < today) return true;
    const ranges: Array<{ start: Date; end: Date }> = [];
    if (selectedPeriods.has("previous")) ranges.push(semesterRanges.previous);
    if (selectedPeriods.has("current"))  ranges.push(semesterRanges.current);
    if (selectedPeriods.has("next"))     ranges.push(semesterRanges.next);
    return ranges.some((r) => rStart <= r.end && rEnd >= r.start);
  };

  // Build chips data for the active period selections
  const periodChips = useMemo(() => {
    const chips: Array<{ key: PeriodOption; label: string; range: string }> = [];
    if (selectedPeriods.has("custom")) {
      chips.push({
        key: "custom",
        label: "Custom Range",
        range: customStartDate && customEndDate
          ? `${fmtDate(new Date(customStartDate))} – ${fmtDate(new Date(customEndDate))}`
          : "Select dates",
      });
    } else {
      if (selectedPeriods.has("previous"))
        chips.push({ key: "previous", label: "Previous Semester", range: `${fmtDate(semesterRanges.previous.start)} – ${fmtDate(semesterRanges.previous.end)}` });
      if (selectedPeriods.has("current"))
        chips.push({ key: "current", label: "This Semester", range: `${fmtDate(semesterRanges.current.start)} – ${fmtDate(semesterRanges.current.end)}` });
      if (selectedPeriods.has("next"))
        chips.push({ key: "next", label: "Next Semester", range: `${fmtDate(semesterRanges.next.start)} – ${fmtDate(semesterRanges.next.end)}` });
      if (selectedPeriods.has("expired"))
        chips.push({ key: "expired", label: "Expired Requests", range: "End date passed" });
    }
    return chips;
  }, [selectedPeriods, customStartDate, customEndDate, semesterRanges]);

  // Derive the gantt timeline range from the active period selection
  const ganttDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedPeriods.size === 0) {
      const y = today.getFullYear();
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
    }

    if (selectedPeriods.has("custom")) {
      if (customStartDate && customEndDate) {
        return { start: new Date(customStartDate), end: new Date(customEndDate) };
      }
      const y = today.getFullYear();
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
    }

    let minStart: Date | null = null;
    let maxEnd: Date | null = null;
    const extend = (s: Date, e: Date) => {
      if (!minStart || s < minStart) minStart = new Date(s);
      if (!maxEnd || e > maxEnd) maxEnd = new Date(e);
    };

    if (selectedPeriods.has("previous")) extend(semesterRanges.previous.start, semesterRanges.previous.end);
    if (selectedPeriods.has("current"))  extend(semesterRanges.current.start,  semesterRanges.current.end);
    if (selectedPeriods.has("next"))     extend(semesterRanges.next.start,     semesterRanges.next.end);
    if (selectedPeriods.has("expired")) {
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      extend(twoYearsAgo, today);
    }

    return {
      start: minStart ?? new Date(today.getFullYear(), 0, 1),
      end:   maxEnd   ?? new Date(today.getFullYear(), 11, 31),
    };
  }, [selectedPeriods, customStartDate, customEndDate, semesterRanges]);

  // Calculate distributed quotas for study programs based on academic periods
  const studyProgramDistribution = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    
    // Show full year view: current date to one year ahead
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Filter offerings for Oslo University only
    const osloOfferings = quotaOfferings.filter(
      (offering) =>
        offering.universityId === OSLO_UNIVERSITY_ID &&
        offering.status === "active",
    );

    // Filter approved quota requests for Oslo University
    const approvedRequests = quotaRequests.filter(
      (request) =>
        (request.universityId === OSLO_UNIVERSITY_ID || !request.universityId) &&
        request.status === "approved",
    );

    // Filter pending quota requests for Oslo University
    const pendingRequests = quotaRequests.filter(
      (request) =>
        (request.universityId === OSLO_UNIVERSITY_ID || !request.universityId) &&
        request.status === "pending",
    );

    // Group by study + program (combine offerings and approved requests)
    const grouped = new Map<
      string,
      {
        studyId: string;
        studyName: string;
        programId: string;
        programName: string;
        offerings: Array<{ capacity: number; startDate: string; endDate: string; source: string; emne?: string }>;
        totalCapacity: number;
      }
    >();

    // Process quota offerings
    osloOfferings.forEach((offering) => {
      const key = `${offering.studyId}-${offering.programId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          studyId: offering.studyId,
          studyName: offering.studyName,
          programId: offering.programId,
          programName: offering.programName,
          offerings: [],
          totalCapacity: 0,
        });
      }

      const group = grouped.get(key)!;
      group.offerings.push({
        capacity: offering.capacity,
        startDate: offering.startDate,
        endDate: offering.endDate,
        source: 'offering',
      });
      group.totalCapacity += offering.capacity;
    });

    // Process approved quota requests
    approvedRequests.forEach((request) => {
      const key = `${request.studyId}-${request.programId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          studyId: request.studyId,
          studyName: request.studyName,
          programId: request.programId,
          programName: request.programName,
          offerings: [],
          totalCapacity: 0,
        });
      }

      // Calculate approved capacity from entity distributions
      let approvedCapacity = 0;
      
      // If we have entity distributions, sum up the approved quotas
      if (request.entityDistributions && request.entityDistributions.length > 0) {
        approvedCapacity = request.entityDistributions.reduce(
          (sum, entity) => sum + (entity.approvedQuota || 0),
          0
        );
      } else if (request.approvedCapacity) {
        // Fall back to top-level approvedCapacity if no entity distributions
        approvedCapacity = request.approvedCapacity;
      }
      
      // Skip this request if approvedCapacity is 0 (nothing was actually approved yet)
      if (approvedCapacity === 0) {
        return;
      }

      const group = grouped.get(key)!;
      // Create completely new object to avoid any mutation
      grouped.set(key, {
        studyId: group.studyId,
        studyName: group.studyName,
        programId: group.programId,
        programName: group.programName,
        offerings: [
          ...group.offerings,
          {
            capacity: approvedCapacity,
            startDate: request.startDate,
            endDate: request.endDate,
            source: 'approved-request',
            emne: request.emne,
          }
        ],
        totalCapacity: group.totalCapacity + approvedCapacity,
      });
    });

    // Process pending quota requests
    pendingRequests.forEach((request) => {
      const key = `${request.studyId}-${request.programId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          studyId: request.studyId,
          studyName: request.studyName,
          programId: request.programId,
          programName: request.programName,
          offerings: [],
          totalCapacity: 0,
        });
      }

      // Calculate pending capacity from entity distributions
      let pendingCapacity = 0;
      
      // If we have entity distributions, sum up the requested quotas
      if (request.entityDistributions && request.entityDistributions.length > 0) {
        pendingCapacity = request.entityDistributions.reduce(
          (sum, entity) => sum + (entity.requestedQuota || 0),
          0
        );
      } else if (request.requestedCapacity) {
        // Fall back to top-level requestedCapacity if no entity distributions
        pendingCapacity = request.requestedCapacity;
      }

      const group = grouped.get(key)!;
      // Create completely new object to avoid any mutation
      grouped.set(key, {
        studyId: group.studyId,
        studyName: group.studyName,
        programId: group.programId,
        programName: group.programName,
        offerings: [
          ...group.offerings,
          {
            capacity: pendingCapacity,
            startDate: request.startDate,
            endDate: request.endDate,
            source: 'pending-request',
            emne: request.emne,
          }
        ],
        totalCapacity: group.totalCapacity, // Don't add pending
      });
    });

    // Calculate chart data for each study/program combination
    return Array.from(grouped.values())
      .map((group) => {
        let maxCount = 0;

        const totalDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Collect all critical dates (start and end of each offering)
        const criticalDates = new Set<number>();
        criticalDates.add(0); // Always include start
        criticalDates.add(totalDays); // Always include end
        
        group.offerings.forEach((item) => {
          const itemStart = new Date(item.startDate);
          const itemEnd = new Date(item.endDate);
          itemStart.setHours(0, 0, 0, 0);
          itemEnd.setHours(0, 0, 0, 0);
          
          // Calculate days from startDate
          const startDay = Math.floor((itemStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const endDay = Math.floor((itemEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (startDay >= 0 && startDay <= totalDays) criticalDates.add(startDay);
          if (startDay > 0 && startDay <= totalDays) criticalDates.add(startDay - 1); // Day before start
          if (endDay >= 0 && endDay <= totalDays) criticalDates.add(endDay);
          if (endDay < totalDays && endDay >= 0) criticalDates.add(endDay + 1); // Day after end
        });
        
        // Add regular interval points
        const interval = Math.max(7, Math.ceil(totalDays / 30)); // Sample at least every week, up to 30 points
        for (let i = 0; i <= totalDays; i += interval) {
          criticalDates.add(i);
        }
        
        // Convert to sorted array
        const daysToSample = Array.from(criticalDates).sort((a, b) => a - b);
        
        // Calculate values for each day
        const chartData = daysToSample.map(i => {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + i);

          // Calculate approved and pending counts separately
          let approvedCount = 0;
          let pendingCount = 0;

          group.offerings.forEach((item) => {
            const itemStart = new Date(item.startDate);
            const itemEnd = new Date(item.endDate);
            itemStart.setHours(0, 0, 0, 0);
            itemEnd.setHours(0, 0, 0, 0);

            if (currentDate >= itemStart && currentDate <= itemEnd) {
              if (item.source === 'pending-request') {
                pendingCount += item.capacity;
              } else if (item.source === 'approved-request') {
                approvedCount += item.capacity;
              } else {
                // offering
                approvedCount += item.capacity;
              }
            }
          });

          const totalCount = approvedCount + pendingCount;
          maxCount = Math.max(maxCount, totalCount);

          return {
            day: i,
            count: approvedCount, // For backward compatibility
            approved: approvedCount,
            inReview: pendingCount,
            date: currentDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          };
        });

        // Calculate total approved and pending from offerings
        const totalApproved = group.offerings
          .filter(o => o.source === 'approved-request' || o.source === 'offering')
          .reduce((sum, o) => sum + o.capacity, 0);
        const totalPending = group.offerings
          .filter(o => o.source === 'pending-request')
          .reduce((sum, o) => sum + o.capacity, 0);

        return {
          studyId: group.studyId,
          studyName: group.studyName,
          programId: group.programId,
          programName: group.programName,
          totalCapacity: group.totalCapacity,
          totalApproved,
          totalPending,
          offerings: group.offerings,
          chartData,
          maxCount,
          dateRange: {
            start: startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            end: endDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          },
        };
      })
      .sort((a, b) => {
        // Sort by study name, then program name
        if (a.studyName !== b.studyName) {
          return a.studyName.localeCompare(b.studyName);
        }
        return a.programName.localeCompare(b.programName);
      });
  }, [quotaOfferings, quotaRequests]);

  // Filter study program distribution
  const filteredDistribution = useMemo(() => {
    return studyProgramDistribution.filter((item) => {
      const matchesSearch =
        item.studyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.programName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStudy = filterStudy === "all" || item.studyId === filterStudy;
      const matchesProgram = filterProgram === "all" || item.programId === filterProgram;
      const matchesEmne = filterEmne === "all" || item.offerings.some((o) => o.emne === filterEmne);

      // Period filter: at least one offering must overlap the selected period
      const matchesPeriodSelection =
        selectedPeriods.size === 0 ||
        item.offerings.some((o) => matchesPeriod(o.startDate, o.endDate));

      return matchesSearch && matchesStudy && matchesProgram && matchesEmne && matchesPeriodSelection;
    });
  }, [
    studyProgramDistribution,
    searchTerm,
    filterStudy,
    filterProgram,
    filterEmne,
    selectedPeriods,
    customStartDate,
    customEndDate,
  ]);

  // Filter quota requests
  const filteredRequests = useMemo(() => {
    return quotaRequests.filter((request) => {
      const matchesSearch =
        request.studyName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.programName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.praksisPlaceName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.departmentName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStudy =
        filterStudy === "all" ||
        request.studyId === filterStudy;
      const matchesProgram =
        filterProgram === "all" ||
        request.programId === filterProgram;
      const matchesStatus =
        filterStatus === "all" ||
        request.status === filterStatus;
      const matchesEmne =
        filterEmne === "all" ||
        request.emne === filterEmne;
      const matchesPlace =
        filterPlace === "all" ||
        request.praksisPlaceId === filterPlace;
      const matchesEntity =
        filterEntity === "all" ||
        (request.entityDistributions
          ? request.entityDistributions.some((ed) => ed.entityId === filterEntity)
          : request.departmentId === filterEntity);

      const matchesPeriodSelection = matchesPeriod(request.startDate, request.endDate);

      return (
        matchesSearch &&
        matchesStudy &&
        matchesProgram &&
        matchesStatus &&
        matchesEmne &&
        matchesPlace &&
        matchesEntity &&
        matchesPeriodSelection
      );
    });
  }, [
    quotaRequests,
    searchTerm,
    filterStudy,
    filterProgram,
    filterStatus,
    filterEmne,
    filterPlace,
    filterEntity,
    selectedPeriods,
    customStartDate,
    customEndDate,
  ]);

  // Filter quota offerings for PK person's university
  const filteredOfferings = useMemo(() => {
    return quotaOfferings.filter((offering) => {
      // Filter by university
      const matchesUniversity = offering.universityId === OSLO_UNIVERSITY_ID;
      
      // Filter by search term
      const matchesSearch =
        offering.studyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offering.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offering.praksisPlaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offering.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by study
      const matchesStudy = filterStudy === "all" || offering.studyId === filterStudy;
      
      // Filter by program
      const matchesProgram = filterProgram === "all" || offering.programId === filterProgram;
      
      // Filter by praksis place
      const matchesPlace = filterPlace === "all" || offering.praksisPlaceId === filterPlace;
      
      return matchesUniversity && matchesSearch && matchesStudy && matchesProgram && matchesPlace;
    });
  }, [quotaOfferings, searchTerm, filterStudy, filterProgram, filterPlace]);

  // Praksis places with their unique entities derived from quota requests
  const placeEntityOptions = useMemo(() => {
    const placesMap = new Map<string, { id: string; name: string; entities: Map<string, string> }>();
    quotaRequests.forEach((req) => {
      if (!placesMap.has(req.praksisPlaceId)) {
        placesMap.set(req.praksisPlaceId, { id: req.praksisPlaceId, name: req.praksisPlaceName, entities: new Map() });
      }
      const place = placesMap.get(req.praksisPlaceId)!;
      if (req.entityDistributions && req.entityDistributions.length > 0) {
        req.entityDistributions.forEach((ed) => place.entities.set(ed.entityId, ed.entityName));
      } else if (req.departmentId) {
        place.entities.set(req.departmentId, req.departmentName);
      }
    });
    return Array.from(placesMap.values())
      .map((p) => ({ ...p, entities: Array.from(p.entities.entries()).map(([id, name]) => ({ id, name })) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [quotaRequests]);

  // Label for the cascading praksis place / entity dropdown trigger
  const placeEntityLabel = useMemo(() => {
    if (filterPlace === "all") return "Praksis Place";
    const place = placeEntityOptions.find((p) => p.id === filterPlace);
    if (!place) return "Praksis Place";
    if (filterEntity === "all") return place.name;
    const entity = place.entities.find((e) => e.id === filterEntity);
    return entity ? `${place.name} / ${entity.name}` : place.name;
  }, [filterPlace, filterEntity, placeEntityOptions]);

  // Unique emne values from all quota requests
  const uniqueEmnes = useMemo(() => {
    const set = new Set(quotaRequests.map((r) => r.emne).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [quotaRequests]);

  // Label for the cascading study/program dropdown trigger
  const studyProgramLabel = useMemo(() => {
    if (filterStudy === "all") return "Study / Program";
    const study = studies.find((s) => s.id === filterStudy);
    if (!study) return "Study / Program";
    if (filterProgram === "all") return study.name;
    const program = study.programs.find((p) => p.id === filterProgram);
    return program ? `${study.name} / ${program.name}` : study.name;
  }, [filterStudy, filterProgram, studies]);

  // Helper function to count consumed quotas for a specific request
  const getConsumedCount = (requestId: string): number => {
    // Aggregate all students from all placement task states
    const allStudents = placementTaskStates.flatMap(state => state.students || []);
    
    // Count students assigned to this specific quota request
    const consumedCount = allStudents.filter(
      (student) =>
        student.assignedPraksisPlace?.quotaRequestId === requestId
    ).length;
    
    return consumedCount;
  };

  // Helper function to count consumed quotas for a specific entity within a request
  const getConsumedCountForEntity = (requestId: string, entityId: string): number => {
    // Aggregate all students from all placement task states
    const allStudents = placementTaskStates.flatMap(state => state.students || []);
    
    // Count students assigned to this specific quota request and entity
    const consumedCount = allStudents.filter(
      (student) =>
        student.assignedPraksisPlace?.quotaRequestId === requestId &&
        student.assignedPraksisPlace?.entityId === entityId
    ).length;
    
    return consumedCount;
  };

  const handleDelete = (request: CoordinatorQuotaRequest) => {
    setDeletingRequest(request);
  };

  const confirmDelete = () => {
    if (deletingRequest) {
      onRequestDelete(deletingRequest.id);
      setDeletingRequest(null);
    }
  };

  const getStatusBadgeClass = (
    status: CoordinatorQuotaRequest["status"],
  ) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "fulfilled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getOfferingStatusBadgeClass = (
    status: QuotaOffering["status"],
  ) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "expired":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (
    status: CoordinatorQuotaRequest["status"],
  ) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "fulfilled":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDateRange = (
    startDate: string,
    endDate: string,
  ) => {
    const start = new Date(startDate).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
    const end = new Date(endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Capacity planing
        </h1>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center gap-3">
        {!isQuotaSearchMode ? (
          <>
            {/* Left: filters */}
            <Button
              variant="outline"
              onClick={() => setIsQuotaSearchMode(true)}
              className="justify-start text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-200"
            >
              <Search className="h-4 w-4 mr-2" />
             
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-gray-600 max-w-[260px] justify-between bg-gray-100 hover:bg-gray-200 border-gray-200"
                >
                  <span className="truncate">{studyProgramLabel}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[220px]">
                <DropdownMenuItem
                  onSelect={() => { setFilterStudy("all"); setFilterProgram("all"); }}
                  className={filterStudy === "all" ? "font-medium text-purple-600" : ""}
                >
                  All Studies
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {studies.map((study) => (
                  <DropdownMenuSub key={study.id}>
                    <DropdownMenuSubTrigger
                      className={filterStudy === study.id && filterProgram === "all" ? "font-medium text-purple-600" : ""}
                    >
                      {study.name}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[180px]">
                      <DropdownMenuItem
                        onSelect={() => { setFilterStudy(study.id); setFilterProgram("all"); }}
                        className={filterStudy === study.id && filterProgram === "all" ? "font-medium text-purple-600" : ""}
                      >
                        All programs
                      </DropdownMenuItem>
                      {study.programs.length > 0 && <DropdownMenuSeparator />}
                      {study.programs.map((program) => (
                        <DropdownMenuItem
                          key={program.id}
                          onSelect={() => { setFilterStudy(study.id); setFilterProgram(program.id); }}
                          className={filterStudy === study.id && filterProgram === program.id ? "font-medium text-purple-600" : ""}
                        >
                          {program.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={filterEmne} onValueChange={setFilterEmne}>
              <SelectTrigger className="w-[140px] bg-gray-100 border-gray-200">
                <SelectValue placeholder="All Emne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emne</SelectItem>
                {uniqueEmnes.map((emne) => (
                  <SelectItem key={emne} value={emne}>{emne}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-gray-600 max-w-[260px] justify-between bg-gray-100 hover:bg-gray-200 border-gray-200"
                >
                  <span className="truncate">{placeEntityLabel}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[240px]">
                <DropdownMenuItem
                  onSelect={() => { setFilterPlace("all"); setFilterEntity("all"); }}
                  className={filterPlace === "all" ? "font-medium text-purple-600" : ""}
                >
                  All Praksis Places
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {placeEntityOptions.map((place) => (
                  <DropdownMenuSub key={place.id}>
                    <DropdownMenuSubTrigger
                      className={filterPlace === place.id && filterEntity === "all" ? "font-medium text-purple-600" : ""}
                    >
                      {place.name}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[200px]">
                      <DropdownMenuItem
                        onSelect={() => { setFilterPlace(place.id); setFilterEntity("all"); }}
                        className={filterPlace === place.id && filterEntity === "all" ? "font-medium text-purple-600" : ""}
                      >
                        All entities
                      </DropdownMenuItem>
                      {place.entities.length > 0 && <DropdownMenuSeparator />}
                      {place.entities.map((entity) => (
                        <DropdownMenuItem
                          key={entity.id}
                          onSelect={() => { setFilterPlace(place.id); setFilterEntity(entity.id); }}
                          className={filterPlace === place.id && filterEntity === entity.id ? "font-medium text-purple-600" : ""}
                        >
                          {entity.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] bg-gray-100 border-gray-200">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>

            {/* Period filter */}
            <div ref={periodFilterRef} className="relative">
              <Button
                variant="outline"
                onClick={() => setIsPeriodFilterOpen((v) => !v)}
                className={`gap-2 justify-between ${
                  selectedPeriods.size > 0
                    ? "text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100"
                    : "text-gray-600 bg-gray-100 border-gray-200 hover:bg-gray-200"
                }`}
              >
                <CalendarRange className="h-4 w-4 flex-shrink-0" />
                <span>Period</span>
                {selectedPeriods.size > 0 && (
                  <span className="ml-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-purple-600 text-white text-[11px] font-semibold leading-none">
                    {selectedPeriods.size}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 flex-shrink-0 opacity-50 transition-transform ${isPeriodFilterOpen ? "rotate-180" : ""}`} />
              </Button>

              {isPeriodFilterOpen && (
                <div className="absolute top-full mt-2 left-0 z-50 w-[300px] bg-white rounded-xl shadow-xl border border-gray-200 p-1 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Show records for</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {(
                      [
                        { key: "previous" as PeriodOption, label: "Previous Semester", range: `${fmtDate(semesterRanges.previous.start)} – ${fmtDate(semesterRanges.previous.end)}` },
                        { key: "current"  as PeriodOption, label: "This Semester",     range: `${fmtDate(semesterRanges.current.start)} – ${fmtDate(semesterRanges.current.end)}` },
                        { key: "next"     as PeriodOption, label: "Next Semester",     range: `${fmtDate(semesterRanges.next.start)} – ${fmtDate(semesterRanges.next.end)}` },
                        { key: "expired"  as PeriodOption, label: "Expired Requests",  range: "End date in the past" },
                      ] as const
                    ).map(({ key, label, range }) => {
                      const isCustomMode = selectedPeriods.has("custom");
                      const checked = selectedPeriods.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => !isCustomMode && togglePeriod(key)}
                          disabled={isCustomMode}
                          className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            isCustomMode
                              ? "opacity-40 cursor-not-allowed"
                              : checked
                              ? "bg-purple-50 hover:bg-purple-100"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                            checked ? "bg-purple-600 border-purple-600" : "border-gray-300"
                          }`}>
                            {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-sm font-medium ${checked ? "text-purple-700" : "text-gray-800"}`}>{label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{range}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-2 pb-2">
                    <div className="border-t border-gray-100 pt-2">
                      {/* Custom date range toggle */}
                      <button
                        type="button"
                        onClick={() => togglePeriod("custom")}
                        className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedPeriods.has("custom") ? "bg-purple-50 hover:bg-purple-100" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedPeriods.has("custom") ? "bg-purple-600 border-purple-600" : "border-gray-300"
                        }`}>
                          {selectedPeriods.has("custom") && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${selectedPeriods.has("custom") ? "text-purple-700" : "text-gray-800"}`}>Custom Date Range</div>
                          <div className="text-xs text-gray-400 mt-0.5">Pick a specific start and end date</div>
                        </div>
                      </button>

                      {/* Custom date inputs — shown when custom is selected */}
                      {selectedPeriods.has("custom") && (
                        <div className="mt-2 mx-3 space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                            <input
                              type="date"
                              value={customEndDate}
                              min={customStartDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          {(!customStartDate || !customEndDate) && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Select both dates to apply filter
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedPeriods(new Set())}
                      className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPeriodFilterOpen(false)}
                      className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {(filterStudy !== "all" || filterProgram !== "all" || filterStatus !== "all" || filterEmne !== "all" || filterPlace !== "all") && (
              <button
                type="button"
                onClick={() => { setFilterStudy("all"); setFilterProgram("all"); setFilterStatus("all"); setFilterEmne("all"); setFilterPlace("all"); setFilterEntity("all"); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}

            {/* Right: actions */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                onClick={() => setIsRequestModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Quota
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHelpOverlayOpen(true)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-300"
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by study, program, or praksis place..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setIsQuotaSearchMode(false);
                setSearchTerm("");
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </>
        )}
      </div>

      {/* Period filter chips */}
      {periodChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <span className="text-xs text-gray-400 font-medium">Showing:</span>
          {periodChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700"
            >
              <CalendarRange className="h-3 w-3 opacity-70" />
              <span>{chip.label}</span>
              <span className="text-purple-400">·</span>
              <span className="font-normal text-purple-500">{chip.range}</span>
              <button
                type="button"
                onClick={() => togglePeriod(chip.key)}
                className="ml-0.5 text-purple-400 hover:text-purple-700 transition-colors"
                aria-label={`Remove ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available Quotas Table - Only show when there are quota requests and not in search mode */}
      {!isQuotaSearchMode && quotaRequests.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Available Quotas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredDistribution.length > 0 &&
              filteredDistribution[0].dateRange
                ? `Available capacity from praksis places (${filteredDistribution[0].dateRange.start} - ${filteredDistribution[0].dateRange.end})`
                : "Available capacity from praksis places"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Study / Program
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Approved
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Requested
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Distributed Quota Timeline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredDistribution.length > 0 ? (
                  filteredDistribution.map((item) => (
                    <tr
                      key={`${item.studyId}-${item.programId}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">
                          {item.studyName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.programName}
                        </div>
                        {(() => {
                          const rowEmnes = [...new Set(item.offerings.map((o) => o.emne).filter(Boolean))] as string[];
                          return rowEmnes.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {rowEmnes.map((emne) => (
                                <button
                                  key={emne}
                                  type="button"
                                  onClick={() => setFilterEmne(filterEmne === emne ? "all" : emne)}
                                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                    filterEmne === emne
                                      ? "bg-purple-100 border-purple-300 text-purple-700 font-medium"
                                      : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                                  }`}
                                >
                                  {emne}
                                </button>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center justify-center">
                          <span className="text-lg font-bold text-purple-600">
                            {filterEmne === "all"
                              ? item.totalApproved || 0
                              : item.offerings.filter((o) => o.source !== "pending-request" && o.emne === filterEmne).reduce((s, o) => s + o.capacity, 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center justify-center">
                          <span className="text-lg font-bold text-orange-600">
                            {filterEmne === "all"
                              ? item.totalPending || 0
                              : item.offerings.filter((o) => o.source === "pending-request" && o.emne === filterEmne).reduce((s, o) => s + o.capacity, 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 min-w-[420px]">
                        {(() => {
                          const ganttStart = ganttDateRange.start.getTime();
                          const ganttEnd   = ganttDateRange.end.getTime();
                          const ganttRange = Math.max(1, ganttEnd - ganttStart);
                          const spanYears  = ganttDateRange.end.getFullYear() - ganttDateRange.start.getFullYear();

                          // Generate month-boundary ticks across the dynamic range
                          const monthTicks: Array<{ label: string; pct: number }> = [];
                          {
                            let d = new Date(ganttDateRange.start.getFullYear(), ganttDateRange.start.getMonth(), 1);
                            while (d.getTime() <= ganttEnd) {
                              const pct = (d.getTime() - ganttStart) / ganttRange * 100;
                              const isJan = d.getMonth() === 0;
                              const label = spanYears >= 1 && isJan
                                ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                                : d.toLocaleDateString("en-US", { month: "short" });
                              if (pct >= 0) monthTicks.push({ label, pct });
                              d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
                            }
                          }
                          const endLabel = ganttDateRange.end.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                          const now = new Date();
                          now.setHours(12, 0, 0, 0);
                          const todayPct = Math.min(100, Math.max(0, (now.getTime() - ganttStart) / ganttRange * 100));
                          const todayLabel = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          const todayInRange = now.getTime() >= ganttStart && now.getTime() <= ganttEnd;

                          const visibleOfferings = item.offerings.filter((o) => {
                            const s = new Date(o.startDate).getTime();
                            const e = new Date(o.endDate).getTime();
                            const inRange = e >= ganttStart && s <= ganttEnd;
                            const matchesEmneFilter = filterEmne === "all" || o.emne === filterEmne;
                            const matchesPeriodFilter = matchesPeriod(o.startDate, o.endDate);
                            return inRange && matchesEmneFilter && matchesPeriodFilter;
                          });

                          return (
                            <div className="w-full select-none">
                              {/* Legend */}
                              <div className="flex items-center justify-end gap-3 mb-2">
                                <span className="flex items-center gap-1 text-xs text-purple-600">
                                  <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                                  Approved
                                </span>
                                <span className="flex items-center gap-1 text-xs text-orange-500">
                                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                                  Requested
                                </span>
                              </div>

                              {/* Timeline */}
                              <div className="relative">
                                {/* Month grid lines */}
                                {monthTicks.map((m) => (
                                  <div
                                    key={m.label}
                                    className="absolute top-0 bottom-5 border-l border-gray-100 pointer-events-none"
                                    style={{ left: `${m.pct}%` }}
                                  />
                                ))}
                                <div className="absolute top-0 bottom-5 border-l border-gray-100 pointer-events-none" style={{ left: "100%" }} />

                                {/* Today line — only if today is within the visible range */}
                                {todayInRange && (
                                  <div
                                    className="absolute top-0 bottom-5 border-l-2 border-blue-400 pointer-events-none z-10"
                                    style={{ left: `${todayPct}%` }}
                                  />
                                )}

                                {/* Bars */}
                                <div className="flex flex-col gap-0.5 pb-5">
                                  {visibleOfferings.length > 0 ? visibleOfferings.map((offering, i) => {
                                    const s = new Date(offering.startDate).getTime();
                                    const e = new Date(offering.endDate).getTime();
                                    const leftPct  = Math.min(100, Math.max(0, (s - ganttStart) / ganttRange * 100));
                                    const rightPct = Math.min(100, Math.max(0, (e - ganttStart) / ganttRange * 100));
                                    const widthPct = Math.max(0.5, rightPct - leftPct);
                                    const isApproved = offering.source !== "pending-request";
                                    return (
                                      <div key={i} className="relative h-3 flex items-center">
                                        <div
                                          title={`${offering.emne ?? ""} · ${new Date(offering.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(offering.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                                          className={`absolute rounded ${isApproved ? "bg-purple-600" : "bg-orange-500"}`}
                                          style={{ left: `${leftPct}%`, width: `${widthPct}%`, height: "3px" }}
                                        />
                                      </div>
                                    );
                                  }) : (
                                    <div className="h-5 flex items-center">
                                      <span className="text-xs text-gray-400 italic">No items in selected period</span>
                                    </div>
                                  )}
                                </div>

                                {/* Month labels row */}
                                <div className="absolute bottom-0 left-0 right-0 h-5">
                                  {monthTicks.map((m) => (
                                    <span
                                      key={m.label}
                                      className="absolute text-[10px] text-gray-400 -translate-x-1/2"
                                      style={{ left: `${m.pct}%` }}
                                    >
                                      {m.label}
                                    </span>
                                  ))}
                                  <span
                                    className="absolute text-[10px] text-gray-400 -translate-x-full"
                                    style={{ left: "100%" }}
                                  >
                                    {endLabel}
                                  </span>
                                  {/* Today label — only if today is within range */}
                                  {todayInRange && (
                                    <span
                                      className="absolute text-[10px] font-semibold text-blue-500 -translate-x-1/2 z-20"
                                      style={{ left: `${todayPct}%` }}
                                    >
                                      {todayLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium mb-1">
                        No available quotas found
                      </p>
                      <p className="text-sm">
                        {searchTerm ||
                        filterStudy !== "all" ||
                        filterProgram !== "all"
                          ? "Try adjusting your filters"
                          : "No praksis places have offered capacity yet"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* My Requests Section */}
      <Card className="p-0 overflow-hidden mb-[50px]">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Quota Requests
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your quota requests and their status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Study / Program
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Praksis Place
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Entities
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Contact
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Requested
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Approved
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Consumed
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Period
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request, index) => {
                  // Mock contact data - rotate through contacts
                  const mockContacts = [
                    { name: "Sarah Johnson", email: "sarah.j@hospital.no" },
                    { name: "Michael Berg", email: "m.berg@clinic.no" },
                    { name: "Anna Olsen", email: "anna.olsen@health.no" },
                    { name: "Lars Hansen", email: "l.hansen@medical.no" },
                  ];
                  
                  // Determine if this is a multi-entity request
                  const hasMultipleEntities = request.entityDistributions && request.entityDistributions.length > 0;
                  const entities = hasMultipleEntities ? request.entityDistributions!.map(entity => ({
                    ...entity,
                    consumedQuota: entity.consumedQuota || getConsumedCountForEntity(request.id, entity.entityId),
                  })) : [
                    {
                      id: 'legacy',
                      entityId: request.departmentId,
                      entityName: request.departmentName,
                      requestedQuota: request.requestedCapacity,
                      approvedQuota: request.approvedCapacity,
                      consumedQuota: getConsumedCount(request.id),
                    }
                  ];
                  
                  return entities!.map((entity, entityIndex) => {
                    const isFirstRow = entityIndex === 0;
                    const rowSpan = entities!.length;
                    const contact = mockContacts[(index + entityIndex) % mockContacts.length];
                    
                    return (
                      <tr
                        key={`${request.id}-${entity.id}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Study / Program - Show only in first row with rowspan */}
                        {isFirstRow && (
                          <td className="px-3 sm:px-6 py-4 align-top" rowSpan={rowSpan}>
                            <div className="text-sm font-medium text-gray-800">
                              {request.studyName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {request.programName}
                            </div>
                            {request.emne && (
                              <div className="text-xs text-gray-400 italic">Emne: {request.emne}</div>
                            )}
                          </td>
                        )}
                        
                        {/* Praksis Place - Show only in first row with rowspan */}
                        {isFirstRow && (
                          <td className="px-3 sm:px-6 py-4 align-top" rowSpan={rowSpan}>
                            <div className="text-sm font-medium text-gray-800">
                              {request.praksisPlaceName}
                            </div>
                          </td>
                        )}
                        
                        {/* Entity Name */}
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-sm font-medium text-blue-700">
                            {entity.entityName}
                          </div>
                        </td>
                        
                        {/* Contact - Different for each entity */}
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800">
                                {entity.contactPersonName || contact.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {entity.contactPersonEmail || contact.email}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setChatContact(entity.contactPersonName ? 
                                { name: entity.contactPersonName, email: entity.contactPersonEmail || '' } : 
                                contact
                              )}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Start chat"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                        
                        {/* Requested - Per entity */}
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center justify-center">
                            <span className="text-lg font-bold text-purple-600">
                              {entity.requestedQuota}
                            </span>
                          </div>
                        </td>
                        
                        {/* Approved - Per entity */}
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center justify-center">
                            {request.status === 'approved' && entity.approvedQuota !== undefined ? (
                              <span className="text-lg font-bold text-green-600">
                                {entity.approvedQuota}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        
                        {/* Consumed - Per entity */}
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center justify-center">
                            {request.status === 'approved' ? (
                              <span className="text-lg font-bold text-blue-600">
                                {entity.consumedQuota || 0}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        
                        {/* Period - Show only in first row with rowspan */}
                        {isFirstRow && (
                          <td className="px-3 sm:px-6 py-4 align-top" rowSpan={rowSpan}>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDateRange(
                                request.startDate,
                                request.endDate,
                              )}
                            </div>
                          </td>
                        )}
                        
                        {/* Status - Per entity row */}
                        {(() => {
                          const entityStatus: 'pending' | 'approved' | 'rejected' =
                            (entity as any).status ||
                            (request.status === 'pending' ? 'pending' :
                             request.status === 'rejected' ? 'rejected' :
                             request.status === 'approved'
                               ? (entity.approvedQuota !== undefined ? (entity.approvedQuota > 0 ? 'approved' : 'rejected') : 'approved')
                               : 'pending');
                          return (
                            <td className="px-3 sm:px-6 py-4">
                              <Badge
                                variant="outline"
                                className={`${getStatusBadgeClass(entityStatus)} flex items-center gap-1 w-fit ${isFirstRow ? '' : 'text-xs'}`}
                              >
                                {isFirstRow && getStatusIcon(entityStatus)}
                                {entityStatus.charAt(0).toUpperCase() + entityStatus.slice(1)}
                              </Badge>
                            </td>
                          );
                        })()}
                        
                        {/* Actions - Show only in first row with rowspan */}
                        {isFirstRow && (
                          <td className="px-3 sm:px-6 py-4 align-top" rowSpan={rowSpan}>
                            <div className="flex items-center justify-center gap-2">
                              {request.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDelete(request)
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setShowApprovalWarning(request)
                                    }
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Approve on behalf of SK"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {onNavigateToPlacement && request.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onNavigateToPlacement(request)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Navigate to Placement"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-1">
                      No quota requests yet
                    </p>
                    <p className="text-sm">
                      {searchTerm ||
                      filterStudy !== "all" ||
                      filterProgram !== "all" ||
                      filterStatus !== "all" ||
                      filterEmne !== "all" ||
                      filterPlace !== "all" ||
                      filterEntity !== "all"
                        ? "Try adjusting your filters"
                        : 'Click "Request Quota" to create your first request'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Request Quota Modal */}
      <RequestQuotaModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSave={onRequestCreate}
        praksisPlaces={praksisPlaces}
        studies={studies}
        existingRequests={quotaRequests}
        currentUserName={currentUserName}
        nodeSlots={nodeSlots}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingRequest}
        onOpenChange={() => setDeletingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Quota Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quota request
              for{" "}
              <span className="font-semibold">
                {deletingRequest?.studyName} /{" "}
                {deletingRequest?.programName}
              </span>{" "}
              at {deletingRequest?.praksisPlaceName}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve/Reject Quota Modal */}
      <ApproveRejectQuotaModal
        isOpen={!!approvingRequest}
        onClose={() => {
          setApprovingRequest(null);
        }}
        request={approvingRequest}
        onApprove={(id, responseNotes, selectedDepartmentId, approvedCapacity, entityApprovals, entityStatuses) => {
          // Find the request
          const request = quotaRequests.find(r => r.id === id);

          // Handle multi-entity approval
          if (request && entityApprovals && request.entityDistributions && request.entityDistributions.length > 0) {
            // Update entity distributions with approved quotas and statuses
            const updatedEntityDistributions = request.entityDistributions.map(entity => ({
              ...entity,
              approvedQuota: entityApprovals[entity.id] || 0,
              status: entityStatuses?.[entity.id] ?? 'approved',
            }));
            
            onRequestUpdate(id, {
              status: 'approved' as const,
              approvedDate: new Date().toISOString(),
              approvedBy: currentUserName,
              responseNotes,
              approvedCapacity,
              entityDistributions: updatedEntityDistributions,
            });
          } else {
            // Legacy single-entity approval
            onRequestUpdate(id, {
              status: 'approved' as const,
              approvedDate: new Date().toISOString(),
              approvedBy: currentUserName,
              responseNotes,
              ...(selectedDepartmentId && {
                departmentId: selectedDepartmentId,
                // Find department name
                departmentName: praksisPlaces
                  .flatMap(p => p.departments)
                  .find(d => d.id === selectedDepartmentId)?.name || '',
              }),
              ...(approvedCapacity && { approvedCapacity }),
            });
          }
          setApprovingRequest(null);
        }}
        onReject={(id, reason, responseNotes) => {
          onRequestUpdate(id, {
            status: 'rejected' as const,
            rejectedDate: new Date().toISOString(),
            rejectedBy: currentUserName,
            rejectionReason: reason,
            responseNotes,
          });
          setApprovingRequest(null);
        }}
        praksisPlace={approvingRequest ? praksisPlaces.find(p => p.id === approvingRequest.praksisPlaceId) : undefined}
      />

      {/* Approval Warning Dialog */}
      <AlertDialog
        open={!!showApprovalWarning}
        onOpenChange={() => setShowApprovalWarning(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Approve on Behalf of Student Coordinator
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div>
                You are about to approve a quota request on behalf of the <strong>Student Coordinator (SK)</strong>.
              </div>
              <div className="text-gray-700">
                Normally, this action should be executed by the Student Coordinator who manages capacity at{" "}
                <span className="font-semibold">
                  {showApprovalWarning?.praksisPlaceName}
                </span>.
              </div>
              <div className="text-gray-800 font-medium">
                Are you sure you want to continue?
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showApprovalWarning) {
                  setApprovingRequest(showApprovalWarning);
                  setShowApprovalWarning(null);
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Continue to Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Contact Dialog */}
      <Dialog open={!!chatContact} onOpenChange={() => setChatContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Chat</DialogTitle>
            <DialogDescription>
              Chat feature coming soon
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <p className="text-gray-700">
              You will be able to start a chat with this user.
            </p>
            {chatContact && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-800">{chatContact.name}</p>
                <p className="text-sm text-gray-600">{chatContact.email}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Overlay */}
      <CapacityPlanningHelpOverlay
        isOpen={isHelpOverlayOpen}
        onClose={() => setIsHelpOverlayOpen(false)}
      />
    </div>
  );
}