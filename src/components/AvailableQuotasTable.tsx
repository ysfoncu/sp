import { useMemo, useState } from "react";
import { Clock, UserPlus, Plus, AlertTriangle, Check, Pencil, Trash2, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";
import { Student } from "../types/placementTask";
import { PraksisPlace } from "../types/praksisPlace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrossPlacementData {
  placementId: string;
  placementTitle: string;
  students: Student[];
}

export interface EntityQuotaItem {
  entityId: string;
  entityName: string;
  requestedCapacity: number;
  approvedCapacity: number;
  crossPlacementConsumed: number;
  assignedCount: number;
  availableCount: number;
  assignedStudents: Student[];
}

export interface QuotaRequestItem {
  requestId: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  isMultiEntity: boolean;
  entities: EntityQuotaItem[];
  departmentId: string;
  departmentName: string;
  approvedCapacity: number;
  pendingCapacity: number;
  crossPlacementConsumed: number;
  assignedCount: number;
  availableCount: number;
  requestedCapacity: number;
  assignedStudents: Student[];
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  startDate: string;
  endDate: string;
}

// Grouped hierarchy types
interface GroupedRequest {
  requestId: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  startDate: string;
  endDate: string;
  entities: QuotaRequestItem[];
  totalRequested: number;
  totalApproved: number;
  totalAssigned: number;
  totalAvailable: number;
}

interface GroupedPlace {
  praksisPlaceId: string;
  praksisPlaceName: string;
  requests: GroupedRequest[];
  totalRequested: number;
  totalApproved: number;
  totalAssigned: number;
  totalAvailable: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvailableQuotasTableProps {
  coordinatorQuotaRequests: CoordinatorQuotaRequest[];
  students: Student[];
  crossPlacementData?: CrossPlacementData[];
  praksisPlaces: PraksisPlace[];
  placementId: string;
  studyId?: string;
  programId?: string;
  emne?: string;
  startDate?: string;
  endDate?: string;
  isPublished?: boolean;
  readOnly?: boolean;
  onQuickAssign: (quotaInfo: {
    requestId: string;
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
    availableCapacity: number;
    entityId?: string;
  }) => void;
  onRequestMoreQuotas?: () => void;
  onApproveRequest?: (requestId: string, approvedCapacity: number, entityId?: string) => void;
  onEditRequest?: (requestId: string) => void;
  onDeleteRequest?: (requestId: string, entityId?: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function placementWithinQuotaDates(
  placementStart: string, placementEnd: string,
  quotaStart: string, quotaEnd: string
): boolean {
  const ps = new Date(placementStart); ps.setHours(0, 0, 0, 0);
  const pe = new Date(placementEnd);   pe.setHours(0, 0, 0, 0);
  const qs = new Date(quotaStart);     qs.setHours(0, 0, 0, 0);
  const qe = new Date(quotaEnd);       qe.setHours(0, 0, 0, 0);
  return ps >= qs && pe <= qe;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function processQuotaRequests(
  coordinatorRequests: CoordinatorQuotaRequest[],
  students: Student[],
  crossPlacementData: CrossPlacementData[],
  ctx: { placementId: string; studyId?: string; programId?: string; emne?: string; startDate?: string; endDate?: string; }
): QuotaRequestItem[] {
  const crossPlacementStudents = crossPlacementData.flatMap((d) => d.students);
  if (!ctx.studyId || !ctx.programId || !ctx.startDate || !ctx.endDate) return [];

  const items: QuotaRequestItem[] = [];

  for (const request of coordinatorRequests) {
    if (request.studyId !== ctx.studyId || request.programId !== ctx.programId) continue;
    if (ctx.emne && request.emne && request.emne !== ctx.emne) continue;
    if (request.status !== 'approved' && request.status !== 'pending') continue;
    if (!placementWithinQuotaDates(ctx.startDate, ctx.endDate, request.startDate, request.endDate)) continue;

    if (request.entityDistributions && request.entityDistributions.length > 0) {
      for (const entity of request.entityDistributions) {
        const entityAssignedStudents = students.filter(
          (s) =>
            s.assignedPraksisPlace?.placeId === request.praksisPlaceId &&
            s.assignedPraksisPlace?.entityId === entity.entityId &&
            s.assignedPraksisPlace?.quotaRequestId === request.id
        );
        const entityAssignedCount = entityAssignedStudents.length;
        const crossPlacementConsumed = crossPlacementStudents.filter(
          (s) =>
            s.assignedPraksisPlace?.placeId === request.praksisPlaceId &&
            s.assignedPraksisPlace?.entityId === entity.entityId &&
            s.assignedPraksisPlace?.quotaRequestId === request.id
        ).length;
        // Per-entity approval: entity.approvedQuota set means this entity was individually approved.
        // Falls back to requestedQuota for whole-request approvals (legacy path).
        const entityExplicitlyApproved = entity.approvedQuota !== undefined;
        const entityApprovedCapacity = entityExplicitlyApproved
          ? entity.approvedQuota!
          : request.status === 'approved' ? entity.requestedQuota : 0;
        const entityAvailableCount = Math.max(0, entityApprovedCapacity - crossPlacementConsumed - entityAssignedCount);

        // Status is per-entity: approved if this entity's quota was set, regardless of parent status
        const entityStatus: QuotaRequestItem['status'] =
          entityExplicitlyApproved || request.status === 'approved' ? 'approved' : 'pending';
        const approvedCapacity = entityStatus === 'approved' ? entityApprovedCapacity : 0;
        const pendingCapacity  = entityStatus === 'pending'  ? entity.requestedQuota : 0;

        items.push({
          requestId: request.id,
          praksisPlaceId: request.praksisPlaceId,
          praksisPlaceName: request.praksisPlaceName,
          departmentId: entity.entityId,
          departmentName: entity.entityName,
          approvedCapacity,
          pendingCapacity,
          crossPlacementConsumed,
          assignedCount: entityAssignedCount,
          availableCount: entityAvailableCount,
          requestedCapacity: entity.requestedQuota,
          assignedStudents: entityAssignedStudents,
          status: entityStatus,
          startDate: request.startDate,
          endDate: request.endDate,
          isMultiEntity: true,
          entities: [{
            entityId: entity.entityId,
            entityName: entity.entityName,
            requestedCapacity: entity.requestedQuota,
            approvedCapacity,
            crossPlacementConsumed,
            assignedCount: entityAssignedCount,
            availableCount: entityAvailableCount,
            assignedStudents: entityAssignedStudents,
          }],
        });
      }
    } else {
      const assignedStudents = students.filter(
        (s) =>
          s.assignedPraksisPlace?.placeId === request.praksisPlaceId &&
          s.assignedPraksisPlace?.departmentId === request.departmentId &&
          s.assignedPraksisPlace?.quotaRequestId === request.id
      );
      const assignedCount = assignedStudents.length;
      const crossPlacementConsumed = crossPlacementStudents.filter(
        (s) =>
          s.assignedPraksisPlace?.placeId === request.praksisPlaceId &&
          s.assignedPraksisPlace?.departmentId === request.departmentId &&
          s.assignedPraksisPlace?.quotaRequestId === request.id
      ).length;
      let approvedCapacity = 0;
      let pendingCapacity = 0;
      if (request.status === 'approved') approvedCapacity = request.approvedCapacity ?? request.requestedCapacity;
      else if (request.status === 'pending') pendingCapacity = request.requestedCapacity;
      const availableCount = Math.max(0, approvedCapacity - crossPlacementConsumed - assignedCount);

      items.push({
        requestId: request.id,
        praksisPlaceId: request.praksisPlaceId,
        praksisPlaceName: request.praksisPlaceName,
        departmentId: request.departmentId,
        departmentName: request.departmentName,
        approvedCapacity,
        pendingCapacity,
        crossPlacementConsumed,
        assignedCount,
        availableCount,
        requestedCapacity: request.requestedCapacity,
        assignedStudents,
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate,
        isMultiEntity: false,
        entities: [{
          entityId: request.departmentId,
          entityName: request.departmentName,
          requestedCapacity: request.requestedCapacity,
          approvedCapacity,
          crossPlacementConsumed,
          assignedCount,
          availableCount,
          assignedStudents,
        }],
      });
    }
  }

  return items.sort((a, b) => {
    const n = a.praksisPlaceName.localeCompare(b.praksisPlaceName);
    return n !== 0 ? n : a.departmentName.localeCompare(b.departmentName);
  });
}

function groupQuotaItems(items: QuotaRequestItem[]): GroupedPlace[] {
  const placeMap = new Map<string, GroupedPlace>();

  for (const item of items) {
    if (!placeMap.has(item.praksisPlaceId)) {
      placeMap.set(item.praksisPlaceId, {
        praksisPlaceId: item.praksisPlaceId,
        praksisPlaceName: item.praksisPlaceName,
        requests: [],
        totalRequested: 0,
        totalApproved: 0,
        totalAssigned: 0,
        totalAvailable: 0,
      });
    }
    const place = placeMap.get(item.praksisPlaceId)!;

    let reqGroup = place.requests.find(r => r.requestId === item.requestId);
    if (!reqGroup) {
      reqGroup = {
        requestId: item.requestId,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
        entities: [],
        totalRequested: 0,
        totalApproved: 0,
        totalAssigned: 0,
        totalAvailable: 0,
      };
      place.requests.push(reqGroup);
    }

    reqGroup.entities.push(item);
    reqGroup.totalRequested  += item.requestedCapacity;
    reqGroup.totalApproved   += item.approvedCapacity;
    reqGroup.totalAssigned   += item.assignedCount;
    reqGroup.totalAvailable  += item.availableCount;

    place.totalRequested  += item.requestedCapacity;
    place.totalApproved   += item.approvedCapacity;
    place.totalAssigned   += item.assignedCount;
    place.totalAvailable  += item.availableCount;
  }

  return Array.from(placeMap.values());
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AvailableQuotasTable({
  coordinatorQuotaRequests,
  students,
  crossPlacementData = [],
  praksisPlaces: _praksisPlaces,
  placementId,
  studyId,
  programId,
  emne,
  startDate,
  endDate,
  isPublished = false,
  readOnly = false,
  onQuickAssign,
  onRequestMoreQuotas,
  onApproveRequest,
  onEditRequest,
  onDeleteRequest,
}: AvailableQuotasTableProps) {
  const [warningDialogRequest, setWarningDialogRequest] = useState<QuotaRequestItem | null>(null);
  const [approvalDialogRequest, setApprovalDialogRequest] = useState<QuotaRequestItem | null>(null);
  const [approvedQuantity, setApprovedQuantity] = useState<number>(0);
  const [showPublishWarning, setShowPublishWarning] = useState(false);
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState<QuotaRequestItem | null>(null);

  const [detailItem, setDetailItem] = useState<QuotaRequestItem | null>(null);

  const quotaItems = useMemo(
    () => processQuotaRequests(coordinatorQuotaRequests, students, crossPlacementData, {
      placementId, studyId, programId, emne, startDate, endDate,
    }),
    [coordinatorQuotaRequests, students, crossPlacementData, placementId, studyId, programId, emne, startDate, endDate]
  );

  const groupedPlaces = useMemo(() => groupQuotaItems(quotaItems), [quotaItems]);

  const totalApprovedCapacity   = quotaItems.reduce((s, q) => s + q.approvedCapacity, 0);
  const totalPendingCapacity    = quotaItems.reduce((s, q) => s + q.pendingCapacity, 0);
  const totalConsumed           = quotaItems.reduce((s, q) => s + q.crossPlacementConsumed, 0);
  const totalAssigned           = quotaItems.reduce((s, q) => s + q.assignedCount, 0);
  const totalAvailable          = quotaItems.reduce((s, q) => s + q.availableCount, 0);
  const totalRequested          = quotaItems.reduce((s, q) => s + q.requestedCapacity, 0);
  const hasPendingRequests    = quotaItems.some(q => q.status === 'pending');
  const allQuotasFullyAssigned = quotaItems.length > 0 && totalAvailable === 0 && !hasPendingRequests;

  const handleWarningClick = (quota: QuotaRequestItem) => setWarningDialogRequest(quota);

  const handleProceedToApproval = () => {
    if (warningDialogRequest) {
      setApprovedQuantity(warningDialogRequest.requestedCapacity);
      setApprovalDialogRequest(warningDialogRequest);
      setWarningDialogRequest(null);
    }
  };

  const handleConfirmApproval = () => {
    if (approvalDialogRequest && onApproveRequest) {
      // Pass departmentId as entityId so the handler can update only this entity's approvedQuota
      onApproveRequest(
        approvalDialogRequest.requestId,
        approvedQuantity,
        approvalDialogRequest.isMultiEntity ? approvalDialogRequest.departmentId : undefined,
      );
      setApprovalDialogRequest(null);
      setApprovedQuantity(0);
    }
  };

  // ─── Empty / loading states ───────────────────────────────────────────────

  if (!studyId || !programId || !startDate || !endDate) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">Complete Placement Details</h3>
        <p className="text-xs text-gray-500">Fill out the placement metadata above to view available quotas</p>
      </div>
    );
  }

  if (quotaItems.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
          <Plus className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Quota Requests Yet</h3>
        <p className="text-xs text-gray-500 mb-4">Request quotas from praksis places to start assigning students</p>
        {onRequestMoreQuotas && (
          <Button onClick={onRequestMoreQuotas} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Request Quota
          </Button>
        )}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-lg border border-gray-200">

      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Available Quotas</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {quotaItems.length} request{quotaItems.length !== 1 ? 's' : ''} · {totalAvailable} available
          </p>
        </div>
        {onRequestMoreQuotas && !readOnly && (
          <Button
            onClick={onRequestMoreQuotas}
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-7 text-xs px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Request
          </Button>
        )}
      </div>

      {/* All quotas fully assigned banner */}
      {allQuotasFullyAssigned && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-amber-800">All quotas fully assigned</p>
          {onRequestMoreQuotas && (
            <Button onClick={onRequestMoreQuotas} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-6 text-xs px-2">
              <Plus className="h-3 w-3 mr-1" />
              Request More
            </Button>
          )}
        </div>
      )}

      {/* Grouped list: Place → Request → Entities */}
      <div>
        {groupedPlaces.map((place, placeIdx) => (
          <div key={place.praksisPlaceId} className={placeIdx > 0 ? 'border-t-2 border-gray-100' : ''}>

            {/* ── Place header ── */}
            <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{place.praksisPlaceName}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {place.requests.reduce((n, r) => n + r.entities.length, 0)} unit{place.requests.reduce((n, r) => n + r.entities.length, 0) !== 1 ? 's' : ''}
                  {' · '}
                  {place.requests.length} request{place.requests.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className={`text-sm font-semibold ${place.totalAvailable > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {place.totalAvailable} avail
                </p>
                <p className="text-[10px] text-gray-400">{place.totalApproved} approved</p>
              </div>
            </div>

            {/* ── Requests within this place ── */}
            {place.requests.map((reqGroup, reqIdx) => {
              const isPendingReq = reqGroup.status === 'pending';
              const showRequestHeader = place.requests.length > 1;

              return (
                <div key={reqGroup.requestId}>

                  {/* Request sub-header — only when place has multiple requests */}
                  {showRequestHeader && (
                    <div className={`flex items-center gap-2 px-4 py-1.5 ${reqIdx === 0 ? 'border-t border-gray-100' : 'border-t border-dashed border-gray-200'}`}>
                      <div className="flex-1 h-px bg-gray-100" />
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isPendingReq && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 bg-amber-50 text-amber-700 border-amber-200">
                            <Clock className="h-2 w-2 mr-0.5" />
                            Pending
                          </Badge>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">
                          {fmtDate(reqGroup.startDate)} – {fmtDate(reqGroup.endDate)}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}

                  {/* ── Entity rows ── */}
                  {reqGroup.entities.map((entity) => {
                    const rowKey = `${entity.requestId}-${entity.departmentId}`;
                    const isPending = entity.status === 'pending';
                    const hasAvailability = entity.availableCount > 0;
                    const isFull = !isPending && entity.approvedCapacity > 0 && entity.availableCount === 0;

                    return (
                      <div
                        key={rowKey}
                        className={`px-4 py-2.5 flex items-center gap-2 transition-colors cursor-pointer ${
                          isPending ? 'bg-amber-100/70 hover:bg-amber-100' : isFull ? 'bg-gray-50/40 hover:bg-gray-100/60' : 'hover:bg-blue-50/40'
                        }`}
                        onClick={() => setDetailItem(entity)}
                      >
                        {/* Entity name */}
                        <div className="flex-1 min-w-0 flex items-center gap-1.5 pl-2">
                          <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                          <p className="text-sm text-gray-800 truncate">{entity.departmentName}</p>
                          {isFull && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 bg-gray-100 text-gray-400 border-gray-200 flex-shrink-0">
                              Full
                            </Badge>
                          )}
                          <Info className="h-3 w-3 text-gray-300 flex-shrink-0 ml-0.5" />
                        </div>

                        {/* Stats */}
                        {isPending ? (
                          <div className="flex-shrink-0 text-xs text-right">
                            <span className="font-bold text-amber-700">{entity.requestedCapacity}</span>
                            <span className="text-gray-400 ml-0.5 text-[10px]"> req</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* req / apr */}
                            <div className="flex flex-col items-center leading-none">
                              <span className="text-xs font-semibold text-gray-800">
                                {entity.requestedCapacity}
                                <span className="text-gray-300 mx-0.5">/</span>
                                {entity.approvedCapacity}
                              </span>
                              <span className="text-[9px] text-gray-400 mt-0.5">req·apr</span>
                            </div>
                            <span className="text-gray-200 text-sm leading-none">|</span>
                            {/* con / avail / asgn */}
                            <div className="flex flex-col items-center leading-none">
                              <span className="text-xs font-semibold">
                                <span className={entity.crossPlacementConsumed > 0 ? 'text-orange-500' : 'text-gray-300'}>
                                  {entity.crossPlacementConsumed}
                                </span>
                                <span className="text-gray-300 mx-0.5">/</span>
                                <span className={entity.availableCount > 0 ? 'text-green-600' : 'text-gray-400'}>
                                  {entity.availableCount}
                                </span>
                                <span className="text-gray-300 mx-0.5">/</span>
                                <span className="text-blue-600">{entity.assignedCount}</span>
                              </span>
                              <span className="text-[9px] text-gray-400 mt-0.5">con·avail·asgn</span>
                            </div>
                          </div>
                        )}

                        {/* Action */}
                        {!readOnly && (isPending ? (
                          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {onEditRequest && (
                              <button
                                onClick={() => onEditRequest(entity.requestId)}
                                className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {onDeleteRequest && (
                              <button
                                onClick={() => setDeleteConfirmRequest(entity)}
                                className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleWarningClick(entity)}
                              className="h-6 w-6 flex items-center justify-center rounded text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                              title="Approve request"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!hasAvailability}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (!isPublished) {
                                setShowPublishWarning(true);
                              } else {
                                if (!entity.departmentId || !entity.departmentName) {
                                  toast.error('Cannot assign students: Department information is missing');
                                  return;
                                }
                                onQuickAssign({
                                  requestId: entity.requestId,
                                  praksisPlaceId: entity.praksisPlaceId,
                                  praksisPlaceName: entity.praksisPlaceName,
                                  departmentId: entity.departmentId,
                                  departmentName: entity.departmentName,
                                  availableCapacity: entity.availableCount,
                                  entityId: entity.departmentId,
                                });
                              }
                            }}
                            className={`h-7 w-7 p-0 flex-shrink-0 ml-[5px] ${hasAvailability ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : ''}`}
                            title="Assign students"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 rounded-b-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Total</span>
          <div className="flex items-center gap-3 text-gray-600">
            <span>
              <span className="font-semibold text-gray-800">{totalRequested}</span>
              <span className="text-gray-300 mx-0.5">/</span>
              <span className="font-semibold text-gray-800">{totalApprovedCapacity}</span>
              <span className="text-gray-400 ml-1">req·apr</span>
            </span>
            <span className="text-gray-200">|</span>
            <span>
              <span className={`font-semibold ${totalConsumed > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{totalConsumed}</span>
              <span className="text-gray-300 mx-0.5">/</span>
              <span className={`font-semibold ${totalAvailable > 0 ? 'text-green-600' : 'text-gray-400'}`}>{totalAvailable}</span>
              <span className="text-gray-300 mx-0.5">/</span>
              <span className="font-semibold text-blue-600">{totalAssigned}</span>
              <span className="text-gray-400 ml-1">con·avail·asgn</span>
            </span>
            {totalPendingCapacity > 0 && (
              <>
                <span className="text-gray-200">|</span>
                <span>
                  <span className="font-semibold text-amber-700">{totalPendingCapacity}</span>
                  <span className="text-gray-400 ml-1">pending</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Dialogs ──────────────────────────────────────────────────────── */}

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open: boolean) => !open && setDetailItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{detailItem?.praksisPlaceName}</DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-700 mt-0.5">
              {detailItem?.departmentName}
            </DialogDescription>
          </DialogHeader>

          {detailItem && (() => {
            const item = detailItem;
            const perPlacement = crossPlacementData.map((d) => {
              const count = d.students.filter((s) =>
                s.assignedPraksisPlace?.quotaRequestId === item.requestId &&
                (item.isMultiEntity
                  ? s.assignedPraksisPlace?.entityId === item.departmentId
                  : s.assignedPraksisPlace?.departmentId === item.departmentId)
              ).length;
              return { ...d, count };
            }).filter((d) => d.count > 0);

            return (
              <div className="space-y-4">
                {/* Capacity + dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Capacity</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.requestedCapacity} requested
                      {item.approvedCapacity > 0 && (
                        <span className="text-gray-400 font-normal"> / {item.approvedCapacity} approved</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Period</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {fmtDate(item.startDate)} – {fmtDate(item.endDate)}
                    </p>
                  </div>
                </div>

                {/* Assignment breakdown */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assignment breakdown</p>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    {/* This placement */}
                    <div className="flex items-center justify-between px-3 py-2 bg-blue-50/60 border-b border-gray-100">
                      <span className="text-sm text-gray-700">This placement</span>
                      <span className="text-sm font-semibold text-blue-600">{item.assignedCount} assigned</span>
                    </div>

                    {/* Cross-placement rows */}
                    {perPlacement.length > 0 ? (
                      perPlacement.map((d) => (
                        <div key={d.placementId} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-700 truncate mr-2">{d.placementTitle}</span>
                          <span className="text-sm font-semibold text-orange-500 flex-shrink-0">{d.count} consumed</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-400 italic">No consumption in other placements</div>
                    )}
                  </div>
                </div>

                {/* Summary row */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 text-sm">
                  <span className="text-gray-600">Total used</span>
                  <span className="font-semibold text-gray-900">
                    {item.crossPlacementConsumed + item.assignedCount}
                    {item.approvedCapacity > 0 && <span className="text-gray-400 font-normal"> / {item.approvedCapacity}</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-1 text-sm">
                  <span className="text-gray-600">Available for this placement</span>
                  <span className={`font-semibold ${item.availableCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {item.availableCount}
                  </span>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailItem(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <Dialog open={!!warningDialogRequest} onOpenChange={() => setWarningDialogRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-lg">Pending Approval</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Requests should be answered by SK (Contact Person). For the sake of demo, click approve button below to approve the request.
            </DialogDescription>
          </DialogHeader>
          {warningDialogRequest && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Praksis Place:</span>
                <span className="font-medium text-gray-900">{warningDialogRequest.praksisPlaceName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium text-gray-900">{warningDialogRequest.departmentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Requested Capacity:</span>
                <span className="font-medium text-purple-600">{warningDialogRequest.requestedCapacity}</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setWarningDialogRequest(null)}>Cancel</Button>
            <Button onClick={handleProceedToApproval} className="bg-green-600 hover:bg-green-700 text-white">
              <Check className="h-4 w-4 mr-2" />
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={!!approvalDialogRequest} onOpenChange={() => setApprovalDialogRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-lg">Approve Quota Request</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Set the approved capacity for this quota request.
            </DialogDescription>
          </DialogHeader>
          {approvalDialogRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Praksis Place:</span>
                  <span className="font-medium text-gray-900">{approvalDialogRequest.praksisPlaceName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-gray-900">{approvalDialogRequest.departmentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requested:</span>
                  <span className="font-medium text-purple-600">{approvalDialogRequest.requestedCapacity}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="approvedCapacity">Approved Capacity</Label>
                <Input
                  id="approvedCapacity"
                  type="number"
                  min="0"
                  max={approvalDialogRequest.requestedCapacity}
                  value={approvedQuantity}
                  onChange={(e) => setApprovedQuantity(Number(e.target.value))}
                  className="text-lg font-medium"
                />
                <p className="text-xs text-gray-500">Enter a value between 0 and {approvalDialogRequest.requestedCapacity}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setApprovalDialogRequest(null)}>Cancel</Button>
            <Button
              onClick={handleConfirmApproval}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={approvedQuantity < 0 || (approvalDialogRequest ? approvedQuantity > approvalDialogRequest.requestedCapacity : false)}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Warning Dialog */}
      <Dialog open={showPublishWarning} onOpenChange={setShowPublishWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Placement First</DialogTitle>
            <DialogDescription className="text-base pt-2">
              You should publish placement to collect custom requests from students. Use publish button located above.
              <br /><br />
              <strong>Note:</strong> This is the default workflow for demo. In real app you will be able to change the workflow.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowPublishWarning(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmRequest} onOpenChange={() => setDeleteConfirmRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-lg">Delete Quota Request</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to delete this quota request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirmRequest && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Praksis Place:</span>
                <span className="font-medium text-gray-900">{deleteConfirmRequest.praksisPlaceName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium text-gray-900">{deleteConfirmRequest.departmentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Requested Capacity:</span>
                <span className="font-medium text-purple-600">{deleteConfirmRequest.requestedCapacity}</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmRequest(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (deleteConfirmRequest && onDeleteRequest) {
                  onDeleteRequest(
                    deleteConfirmRequest.requestId,
                    deleteConfirmRequest.isMultiEntity ? deleteConfirmRequest.departmentId : undefined,
                  );
                  setDeleteConfirmRequest(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
