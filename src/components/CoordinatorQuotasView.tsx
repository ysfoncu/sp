import { useState, useMemo } from "react";
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
  const [filterPlace, setFilterPlace] = useState("all");
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

  // Oslo University ID (must match the universityId in studies data)
  const OSLO_UNIVERSITY_ID = "U1";

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
        item.studyName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.programName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStudy =
        filterStudy === "all" || item.studyId === filterStudy;
      const matchesProgram =
        filterProgram === "all" ||
        item.programId === filterProgram;

      return matchesSearch && matchesStudy && matchesProgram;
    });
  }, [
    studyProgramDistribution,
    searchTerm,
    filterStudy,
    filterProgram,
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
      const matchesPlace =
        filterPlace === "all" ||
        request.praksisPlaceId === filterPlace;

      return (
        matchesSearch &&
        matchesStudy &&
        matchesProgram &&
        matchesStatus &&
        matchesPlace
      );
    });
  }, [
    quotaRequests,
    searchTerm,
    filterStudy,
    filterProgram,
    filterStatus,
    filterPlace,
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
              className="justify-start text-gray-600"
            >
              <Search className="h-4 w-4 mr-2" />
              Search quotas and requests...
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-gray-600 max-w-[260px] justify-between"
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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
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

            {(filterStudy !== "all" || filterProgram !== "all" || filterStatus !== "all") && (
              <button
                type="button"
                onClick={() => { setFilterStudy("all"); setFilterProgram("all"); setFilterStatus("all"); }}
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
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center justify-center">
                          <span className="text-lg font-bold text-purple-600">
                            {item.totalApproved || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center justify-center">
                          <span className="text-lg font-bold text-orange-600">
                            {item.totalPending || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 min-w-[420px]">
                        {(() => {
                          const ganttYear = new Date().getFullYear();
                          const ganttStart = new Date(ganttYear, 0, 1).getTime();
                          const ganttEnd = new Date(ganttYear, 11, 31, 23, 59, 59).getTime();
                          const ganttRange = ganttEnd - ganttStart;

                          const monthTicks = Array.from({ length: 12 }, (_, i) => {
                            const d = new Date(ganttYear, i, 1);
                            return {
                              label: i === 0 ? 'Jan 1' : d.toLocaleDateString('en-US', { month: 'short' }),
                              pct: (d.getTime() - ganttStart) / ganttRange * 100,
                              isFirst: i === 0,
                            };
                          });

                          const now = new Date();
                          now.setHours(12, 0, 0, 0);
                          const todayPct = Math.min(100, Math.max(0, (now.getTime() - ganttStart) / ganttRange * 100));
                          const todayLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                          const visibleOfferings = item.offerings.filter((o) => {
                            const s = new Date(o.startDate).getTime();
                            const e = new Date(o.endDate).getTime();
                            return e >= ganttStart && s <= ganttEnd;
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
                                {/* Month grid lines (behind bars) */}
                                {monthTicks.map((m) => (
                                  <div
                                    key={m.label}
                                    className="absolute top-0 bottom-5 border-l border-gray-100 pointer-events-none"
                                    style={{ left: `${m.pct}%` }}
                                  />
                                ))}
                                {/* Dec 31 right edge */}
                                <div className="absolute top-0 bottom-5 border-l border-gray-100 pointer-events-none" style={{ left: '100%' }} />

                                {/* Today line */}
                                <div
                                  className="absolute top-0 bottom-5 border-l-2 border-blue-400 pointer-events-none z-10"
                                  style={{ left: `${todayPct}%` }}
                                />

                                {/* Bars */}
                                <div className="flex flex-col gap-0.5 pb-5">
                                  {visibleOfferings.length > 0 ? visibleOfferings.map((offering, i) => {
                                    const s = new Date(offering.startDate).getTime();
                                    const e = new Date(offering.endDate).getTime();
                                    const leftPct = Math.min(100, Math.max(0, (s - ganttStart) / ganttRange * 100));
                                    const rightPct = Math.min(100, Math.max(0, (e - ganttStart) / ganttRange * 100));
                                    const widthPct = Math.max(0.5, rightPct - leftPct);
                                    const isApproved = offering.source !== 'pending-request';
                                    return (
                                      <div key={i} className="relative h-3 flex items-center">
                                        <div
                                          title={`${offering.emne ?? ''} · ${new Date(offering.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(offering.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                          className={`absolute rounded ${isApproved ? 'bg-purple-600' : 'bg-orange-500'}`}
                                          style={{ left: `${leftPct}%`, width: `${widthPct}%`, height: '3px' }}
                                        />
                                      </div>
                                    );
                                  }) : (
                                    <div className="h-5 flex items-center">
                                      <span className="text-xs text-gray-400 italic">No items in current year</span>
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
                                    style={{ left: '100%' }}
                                  >
                                    Dec 31
                                  </span>
                                  {/* Today label */}
                                  <span
                                    className="absolute text-[10px] font-semibold text-blue-500 -translate-x-1/2 z-20"
                                    style={{ left: `${todayPct}%` }}
                                  >
                                    {todayLabel}
                                  </span>
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
                  const entities = hasMultipleEntities ? request.entityDistributions.map(entity => ({
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
                      filterPlace !== "all"
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