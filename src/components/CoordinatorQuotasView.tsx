import { useState, useMemo } from "react";
import { Card } from "./ui/card";
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
  Plus,
  Search,
  X,
  Building2,
  ClipboardCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Check,
  AlertCircle,
  Pencil,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Layers,
} from "lucide-react";
import {
  CoordinatorQuotaRequest,
  EntityDistribution,
  formatReservation,
  getRequestEmner,
  isDeadlineExpired,
} from "../types/coordinatorQuotaRequest";
import { QuotaOffering } from "../types/quotaOffering";
import { PraksisPlace } from "../types/praksisPlace";
import { OrganizationNode } from "../types/organizationStructure";
import { Study, StudyProgram } from "./SettingsView";
import { PlacementTaskState } from "../types/studentPlacement";
import { AddCapacityModal } from "./AddCapacityModal";
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

type NewRequest = Omit<CoordinatorQuotaRequest, "id" | "requestedDate" | "status">;

// What is selected in the left Study → Program → Emne tree
type TreeSelection =
  | { kind: "study"; studyId: string }
  | { kind: "program"; studyId: string; programId: string }
  | { kind: "emne"; studyId: string; programId: string; emneName: string };

// Which add/edit flow is open
type CapacityFlow = {
  mode: "program" | "emne";
  studyId: string;
  programId: string;
  emneName?: string;
  editingRequest?: CoordinatorQuotaRequest;
};

// Rotating mock contacts (no contact data in the prototype yet)
const MOCK_CONTACTS = [
  { name: "Sarah Johnson", email: "sarah.j@hospital.no" },
  { name: "Michael Berg", email: "m.berg@clinic.no" },
  { name: "Anna Olsen", email: "anna.olsen@health.no" },
  { name: "Lars Hansen", email: "l.hansen@medical.no" },
];

interface CoordinatorQuotasViewProps {
  quotaOfferings: QuotaOffering[];
  quotaRequests: CoordinatorQuotaRequest[];
  praksisPlaces: PraksisPlace[];
  studies: Study[];
  currentUserName: string;
  placementTaskStates?: PlacementTaskState[];
  nodeSlots?: Record<string, Record<string, number>>;
  onRequestsCreate: (requests: NewRequest[]) => void;
  onRequestUpdate: (
    id: string,
    updates: Partial<CoordinatorQuotaRequest>,
  ) => void;
  onRequestDelete: (id: string) => void;
  onNavigateToPlacement?: (request: CoordinatorQuotaRequest) => void;
}

export function CoordinatorQuotasView({
  quotaRequests,
  praksisPlaces,
  studies,
  currentUserName,
  placementTaskStates = [],
  nodeSlots = {},
  onRequestsCreate,
  onRequestUpdate,
  onRequestDelete,
}: CoordinatorQuotasViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selection, setSelection] = useState<TreeSelection | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState("all");
  // Praksis place / entity filter (multi-select). No entityId = the whole praksis place.
  const [placeFilters, setPlaceFilters] = useState<Array<{ placeId: string; entityId?: string }>>([]);
  const [flow, setFlow] = useState<CapacityFlow | null>(null);
  const [deletingRequest, setDeletingRequest] =
    useState<CoordinatorQuotaRequest | null>(null);
  const [approvingRequest, setApprovingRequest] =
    useState<CoordinatorQuotaRequest | null>(null);
  const [showApprovalWarning, setShowApprovalWarning] =
    useState<CoordinatorQuotaRequest | null>(null);

  // Chat dialog state
  const [chatContact, setChatContact] = useState<{ name: string; email: string } | null>(null);

  // Help overlay state
  const [isHelpOverlayOpen, setIsHelpOverlayOpen] = useState(false);

  // ── Tree helpers ──────────────────────────────────────────────────────
  const studyKey = (s: Study) => `study:${s.id}`;
  const programKey = (p: StudyProgram) => `program:${p.id}`;
  const emneKey = (p: StudyProgram, emneName: string) => `emne:${p.id}:${emneName}`;

  const query = searchQuery.trim().toLowerCase();
  const matches = (name: string) => name.toLowerCase().includes(query);
  const emneVisible = (name: string) => !query || matches(name);
  const programVisible = (p: StudyProgram) =>
    !query || matches(p.name) || (p.emner ?? []).some((e) => matches(e.name));
  const studyVisible = (s: Study) =>
    !query || matches(s.name) || s.programs.some(programVisible);

  // While searching, everything that matches is expanded
  const isExpanded = (key: string) => !!query || expandedNodes.has(key);

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isSelected = (key: string) => {
    if (!selection) return false;
    if (selection.kind === "study") return key === `study:${selection.studyId}`;
    if (selection.kind === "program") return key === `program:${selection.programId}`;
    return key === `emne:${selection.programId}:${selection.emneName}`;
  };

  // Quota items (requests) of a program, optionally for one emne
  const requestsFor = (programId: string, emneName?: string) =>
    quotaRequests.filter(
      (r) =>
        r.programId === programId &&
        (emneName === undefined || getRequestEmner(r).includes(emneName)),
    );

  const renderTreeRow = (
    key: string,
    level: number,
    label: string,
    icon: React.ReactNode,
    onSelect: () => void,
    hasChildren: boolean,
    count?: number,
  ) => {
    const selected = isSelected(key);
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
          selected ? "bg-[#155dfc] text-white" : "hover:bg-gray-50 text-gray-700"
        }`}
        style={{ paddingLeft: `${12 + level * 24}px` }}
        onClick={onSelect}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => toggleExpand(key, e)}
            className="flex-shrink-0"
          >
            {isExpanded(key) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        {icon}
        <span className="text-sm font-medium truncate flex-1">{label}</span>
        {count !== undefined && count > 0 && (
          <span
            className={`text-xs rounded-full px-1.5 ${
              selected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {count}
          </span>
        )}
      </div>
    );
  };

  const iconClass = (key: string, color: string) =>
    `h-4 w-4 flex-shrink-0 ${isSelected(key) ? "text-white" : color}`;

  // ── Table helpers ─────────────────────────────────────────────────────
  const getConsumedCountForEntity = (requestId: string, entityId: string): number =>
    placementTaskStates
      .flatMap((state) => state.students || [])
      .filter(
        (student) =>
          student.assignedPraksisPlace?.quotaRequestId === requestId &&
          student.assignedPraksisPlace?.entityId === entityId,
      ).length;

  const entityStatus = (
    request: CoordinatorQuotaRequest,
    entity: EntityDistribution,
  ): CoordinatorQuotaRequest["status"] => entity.status ?? request.status;

  const matchesStatusFilter = (request: CoordinatorQuotaRequest) =>
    filterStatus === "all" ||
    (request.entityDistributions?.length
      ? request.entityDistributions.some((e) => entityStatus(request, e) === filterStatus)
      : request.status === filterStatus);

  // ── Praksis place / entity filter ─────────────────────────────────────
  const findNode = (node: OrganizationNode | undefined, id: string): OrganizationNode | undefined => {
    if (!node) return undefined;
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return undefined;
  };

  const collectIds = (node: OrganizationNode): string[] => [node.id, ...node.children.flatMap(collectIds)];

  // Entities below the praksis place root, flattened with their depth for the menu
  const flattenEntities = (node: OrganizationNode, depth = 0): Array<{ node: OrganizationNode; depth: number }> =>
    node.children.flatMap((child) => [{ node: child, depth }, ...flattenEntities(child, depth + 1)]);

  const isPlaceFilterSelected = (placeId: string, entityId?: string) =>
    placeFilters.some((f) => f.placeId === placeId && f.entityId === entityId);

  const togglePlaceFilter = (placeId: string, entityId?: string) =>
    setPlaceFilters((prev) =>
      isPlaceFilterSelected(placeId, entityId)
        ? prev.filter((f) => !(f.placeId === placeId && f.entityId === entityId))
        : [...prev, { placeId, entityId }],
    );

  const placeFilterLabel = (f: { placeId: string; entityId?: string }) => {
    const place = praksisPlaces.find((p) => p.id === f.placeId);
    const entity = f.entityId ? findNode(place?.organizationStructure, f.entityId) : undefined;
    return { place: place?.name ?? f.placeId, entity: entity?.name };
  };

  // Matches the whole praksis place, or the selected entity and everything below it
  const matchesPlaceFilter = (request: CoordinatorQuotaRequest) =>
    placeFilters.length === 0 ||
    placeFilters.some((f) => {
      if (f.placeId !== request.praksisPlaceId) return false;
      if (!f.entityId) return true;
      const root = praksisPlaces.find((p) => p.id === f.placeId)?.organizationStructure;
      const selected = findNode(root, f.entityId);
      const ids = selected ? collectIds(selected) : [f.entityId];
      const requestEntityIds = request.entityDistributions?.length
        ? request.entityDistributions.map((e) => e.entityId)
        : [request.departmentId];
      return requestEntityIds.some((id) => ids.includes(id));
    });

  const matchesFilters = (request: CoordinatorQuotaRequest) =>
    matchesStatusFilter(request) && matchesPlaceFilter(request);

  const getStatusBadgeClass = (status: CoordinatorQuotaRequest["status"]) => {
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

  const getStatusIcon = (status: CoordinatorQuotaRequest["status"]) => {
    switch (status) {
      case "approved":
      case "fulfilled":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const confirmDelete = () => {
    if (deletingRequest) {
      onRequestDelete(deletingRequest.id);
      setDeletingRequest(null);
    }
  };

  const openEdit = (request: CoordinatorQuotaRequest) =>
    setFlow({
      mode: "emne",
      studyId: request.studyId,
      programId: request.programId,
      emneName: getRequestEmner(request)[0],
      editingRequest: request,
    });

  // Entity rows of one quota item (one row for items created on this page)
  const renderRequestRows = (request: CoordinatorQuotaRequest, rowIndex: number) => {
    const entities: EntityDistribution[] = request.entityDistributions?.length
      ? request.entityDistributions
      : [
          {
            id: "legacy",
            entityId: request.departmentId,
            entityName: request.departmentName,
            requestedQuota: request.requestedCapacity,
            approvedQuota: request.approvedCapacity,
          },
        ];
    // The edit form handles single-entity items; older multi-entity items can only be deleted
    const canEdit = entities.length === 1;

    return entities.map((entity, entityIndex) => {
      const status = entityStatus(request, entity);
      const contact = MOCK_CONTACTS[(rowIndex + entityIndex) % MOCK_CONTACTS.length];
      const consumed = entity.consumedQuota ?? getConsumedCountForEntity(request.id, entity.entityId);
      return (
        <tr key={`${request.id}-${entity.id}`} className="hover:bg-gray-50 transition-colors">
          <td className="px-4 py-3 pl-10">
            <div className="text-sm font-medium text-gray-800">{request.praksisPlaceName}</div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm font-medium text-blue-700">{entity.entityName}</div>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
              <div className="min-w-0">
                <div className="text-sm text-gray-800 truncate">
                  {entity.contactPersonName || contact.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {entity.contactPersonEmail || contact.email}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setChatContact(
                    entity.contactPersonName
                      ? { name: entity.contactPersonName, email: entity.contactPersonEmail || "" }
                      : contact,
                  )
                }
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Start chat"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </td>
          {/* Quota: requested / approved / consumed */}
          <td className="px-4 py-3 text-center whitespace-nowrap">
            <span className="text-base font-bold text-purple-600" title="Requested">{entity.requestedQuota}</span>
            <span className="text-gray-400">/</span>
            <span className="text-base font-bold text-green-600" title="Approved">
              {status === "approved" ? entity.approvedQuota ?? 0 : 0}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-base font-bold text-blue-600" title="Consumed">
              {status === "approved" ? consumed : 0}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              {formatReservation(entity, request)}
              {isDeadlineExpired(entity) && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  Expired
                </Badge>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <Badge
              variant="outline"
              className={`${getStatusBadgeClass(status)} flex items-center gap-1 w-fit`}
            >
              {getStatusIcon(status)}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </td>
          <td className="px-4 py-3">
            {entityIndex === 0 && (
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(request)}
                  disabled={!canEdit}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  title={canEdit ? "Edit" : "Edit is not available for multi-entity items"}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingRequest(request)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {request.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApprovalWarning(request)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Approve on behalf of SK"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </td>
        </tr>
      );
    });
  };

  // One table per program; one group of rows per emne
  const renderProgramTable = (study: Study, program: StudyProgram, onlyEmne?: string) => {
    const emner = (program.emner ?? []).filter((e) => !onlyEmne || e.name === onlyEmne);
    const programRequests = requestsFor(program.id);
    // Older items without an emne still belong to the program
    const withoutEmne = onlyEmne
      ? []
      : programRequests.filter((r) => getRequestEmner(r).length === 0);

    const renderEmneGroup = (
      key: string,
      title: string,
      items: CoordinatorQuotaRequest[],
      emneName?: string,
    ) => {
      const visible = items.filter(matchesFilters);
      const totalRequested = items.reduce((sum, r) => sum + r.requestedCapacity, 0);
      const totalApproved = items.reduce((sum, r) => sum + (r.approvedCapacity ?? 0), 0);
      return [
        <tr key={`${key}-header`} className="bg-gray-50 border-t border-gray-200">
          <td colSpan={7} className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-900">{title}</span>
                <span className="text-xs text-gray-500">
                  {items.length} item{items.length === 1 ? "" : "s"} · {totalRequested} requested ·{" "}
                  {totalApproved} approved
                </span>
              </div>
              {emneName && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFlow({ mode: "emne", studyId: study.id, programId: program.id, emneName })
                  }
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              )}
            </div>
          </td>
        </tr>,
        ...(visible.length > 0
          ? visible.flatMap((r, i) => renderRequestRows(r, i))
          : [
              <tr key={`${key}-empty`}>
                <td colSpan={7} className="px-4 py-3 pl-10 text-sm text-gray-400">
                  {items.length > 0 ? "No items match the filters" : "No quota yet"}
                </td>
              </tr>,
            ]),
      ];
    };

    return (
      <Card key={program.id} className="p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">{program.name}</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{study.name}</p>
          </div>
          {/* Program-level add (several emner) — hidden when a single emne is selected */}
          {!onlyEmne && (
            <Button
              onClick={() => setFlow({ mode: "program", studyId: study.id, programId: program.id })}
              disabled={(program.emner ?? []).length === 0}
              className="h-9 gap-2 bg-[#155dfc] hover:bg-[#1147d4] text-white"
            >
              <Plus className="h-4 w-4" />
              Add quota
            </Button>
          )}
        </div>

        {(program.emner ?? []).length === 0 && withoutEmne.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No emner defined for this program. Add them in Settings → Studies & Programs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Emne / Praksis place</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Quota
                    <div className="text-[10px] font-normal normal-case text-gray-400">req / apr / con</div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reservation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {emner.flatMap((e) =>
                  renderEmneGroup(emneKey(program, e.name), e.name, requestsFor(program.id, e.name), e.name),
                )}
                {withoutEmne.length > 0 &&
                  renderEmneGroup(`program:${program.id}:none`, "Without emne", withoutEmne)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  };

  // Resolve the current selection to study/program objects
  const selectedStudy = selection ? studies.find((s) => s.id === selection.studyId) : undefined;
  const selectedProgram =
    selection && selection.kind !== "study"
      ? selectedStudy?.programs.find((p) => p.id === selection.programId)
      : undefined;

  const flowStudy = flow ? studies.find((s) => s.id === flow.studyId) : undefined;
  const flowProgram = flowStudy?.programs.find((p) => p.id === flow?.programId);

  const totalItems = useMemo(() => quotaRequests.length, [quotaRequests]);

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-gray-900 text-2xl">Capacity planning</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalItems} quota item{totalItems === 1 ? "" : "s"} across all studies
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsHelpOverlayOpen(true)}
          className="h-9 gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
      </div>

      {/* Split layout, as on the Praksis places page */}
      <div className="flex gap-6 items-start">
        {/* Left: Study → Program → Emne tree */}
        <div className="w-80 flex-shrink-0 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden sticky top-0 max-h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search studies, programs, emner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white border-gray-200"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {studies.filter(studyVisible).map((study) => (
                <div key={study.id}>
                  {renderTreeRow(
                    studyKey(study),
                    0,
                    study.name,
                    <GraduationCap className={iconClass(studyKey(study), "text-purple-600")} />,
                    () => setSelection({ kind: "study", studyId: study.id }),
                    study.programs.length > 0,
                  )}
                  {isExpanded(studyKey(study)) &&
                    study.programs.filter(programVisible).map((program) => (
                      <div key={program.id}>
                        {renderTreeRow(
                          programKey(program),
                          1,
                          program.name,
                          <BookOpen className={iconClass(programKey(program), "text-blue-600")} />,
                          () => setSelection({ kind: "program", studyId: study.id, programId: program.id }),
                          (program.emner ?? []).length > 0,
                          requestsFor(program.id).length,
                        )}
                        {isExpanded(programKey(program)) &&
                          (program.emner ?? [])
                            .filter((e) => emneVisible(e.name) || matches(program.name) || matches(study.name))
                            .map((e) => (
                              <div key={e.id}>
                                {renderTreeRow(
                                  emneKey(program, e.name),
                                  2,
                                  e.name,
                                  <Layers className={iconClass(emneKey(program, e.name), "text-green-600")} />,
                                  () =>
                                    setSelection({
                                      kind: "emne",
                                      studyId: study.id,
                                      programId: program.id,
                                      emneName: e.name,
                                    }),
                                  false,
                                  requestsFor(program.id, e.name).length,
                                )}
                              </div>
                            ))}
                      </div>
                    ))}
                </div>
              ))}
              {studies.filter(studyVisible).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">
                  {studies.length === 0
                    ? "No studies yet. Add them in Settings → Studies & Programs."
                    : "No matches"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: program tables for the selection */}
        <div className="flex-1 min-w-0 space-y-6 mb-[50px]">
          {!selection || !selectedStudy ? (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 min-h-[400px]">
              <div className="text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium">Select a study, program or emne</p>
                <p className="text-sm text-gray-400 mt-1">Its quota will be shown here</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{selectedStudy.name}</span>
                  {selectedProgram && <> / {selectedProgram.name}</>}
                  {selection.kind === "emne" && <> / {selection.emneName}</>}
                </div>
                <div className="flex items-center gap-3">
                  {/* Praksis place / Entity (cascading, multi-select) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 text-gray-600 max-w-[260px] justify-between bg-gray-100 hover:bg-gray-200 border-gray-200"
                      >
                        <span className="truncate">
                          {placeFilters.length === 0
                            ? "Praksis place / Entity"
                            : `Praksis place / Entity (${placeFilters.length})`}
                        </span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[240px]">
                      <DropdownMenuItem
                        onSelect={() => setPlaceFilters([])}
                        className={placeFilters.length === 0 ? "font-medium text-blue-600" : ""}
                      >
                        All praksis places
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {praksisPlaces.map((place) => {
                        const entities = place.organizationStructure
                          ? flattenEntities(place.organizationStructure)
                          : [];
                        const hasSelection = placeFilters.some((f) => f.placeId === place.id);
                        return (
                          <DropdownMenuSub key={place.id}>
                            <DropdownMenuSubTrigger className={hasSelection ? "font-medium text-blue-600" : ""}>
                              {place.name}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-[240px] max-h-[360px] overflow-y-auto">
                              {/* Keep the menu open so several items can be picked */}
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  togglePlaceFilter(place.id);
                                }}
                                className="gap-2"
                              >
                                <Check
                                  className={`h-4 w-4 ${isPlaceFilterSelected(place.id) ? "opacity-100 text-blue-600" : "opacity-0"}`}
                                />
                                All of {place.name}
                              </DropdownMenuItem>
                              {entities.length > 0 && <DropdownMenuSeparator />}
                              {entities.map(({ node, depth }) => (
                                <DropdownMenuItem
                                  key={node.id}
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    togglePlaceFilter(place.id, node.id);
                                  }}
                                  className="gap-2"
                                  style={{ paddingLeft: `${8 + depth * 16}px` }}
                                >
                                  <Check
                                    className={`h-4 w-4 flex-shrink-0 ${isPlaceFilterSelected(place.id, node.id) ? "opacity-100 text-blue-600" : "opacity-0"}`}
                                  />
                                  <span className="truncate">{node.name}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Select value={filterStatus} onValueChange={(value: string) => setFilterStatus(value)}>
                    <SelectTrigger className="w-[160px] bg-gray-100 border-gray-200">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected praksis place / entity chips */}
              {placeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap -mt-2">
                  <span className="text-xs text-gray-400 font-medium">Showing:</span>
                  {placeFilters.map((f) => {
                    const label = placeFilterLabel(f);
                    return (
                      <span
                        key={`${f.placeId}-${f.entityId ?? "all"}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700"
                      >
                        <Building2 className="h-3 w-3 opacity-70" />
                        <span>{label.place}</span>
                        {label.entity && (
                          <>
                            <span className="text-blue-400">·</span>
                            <span className="font-normal text-blue-500">{label.entity}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => togglePlaceFilter(f.placeId, f.entityId)}
                          className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                          aria-label={`Remove ${label.entity ?? label.place}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPlaceFilters([])}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                </div>
              )}

              {selection.kind === "study" &&
                (selectedStudy.programs.length > 0 ? (
                  selectedStudy.programs.map((p) => renderProgramTable(selectedStudy, p))
                ) : (
                  <Card className="p-8 text-center text-sm text-gray-500">
                    No programs defined for this study. Add them in Settings → Studies & Programs.
                  </Card>
                ))}
              {selection.kind === "program" &&
                selectedProgram &&
                renderProgramTable(selectedStudy, selectedProgram)}
              {selection.kind === "emne" &&
                selectedProgram &&
                renderProgramTable(selectedStudy, selectedProgram, selection.emneName)}
            </>
          )}
        </div>
      </div>

      {/* Add / edit quota flow */}
      {flow && flowStudy && flowProgram && (
        <AddCapacityModal
          mode={flow.mode}
          study={flowStudy}
          program={flowProgram}
          emneName={flow.emneName}
          editingRequest={flow.editingRequest}
          praksisPlaces={praksisPlaces}
          nodeSlots={nodeSlots}
          existingRequests={quotaRequests}
          currentUserName={currentUserName}
          onClose={() => setFlow(null)}
          onSubmit={onRequestsCreate}
          onUpdate={onRequestUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingRequest}
        onOpenChange={() => setDeletingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Quota Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the quota for{" "}
              <span className="font-semibold">
                {deletingRequest?.emne ?? deletingRequest?.programName}
              </span>{" "}
              at {deletingRequest?.praksisPlaceName}
              {deletingRequest?.entityDistributions?.[0] &&
                ` / ${deletingRequest.entityDistributions[0].entityName}`}
              ? This action cannot be undone.
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
