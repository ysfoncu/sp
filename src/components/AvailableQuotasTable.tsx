import { useMemo, useState, Fragment } from "react";
import { Clock, UserPlus, Plus, ChevronDown, ChevronRight, User, AlertTriangle, Check, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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

// Entity-level quota item (for multi-entity requests)
export interface EntityQuotaItem {
  entityId: string;
  entityName: string;
  requestedCapacity: number;
  approvedCapacity: number;
  assignedCount: number;
  availableCount: number;
  assignedStudents: Student[];
}

// Grouped quota request item (parent request with potentially multiple entities)
export interface QuotaRequestItem {
  // From the request
  requestId: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  
  // Multi-entity support
  isMultiEntity: boolean; // true if request has entityDistributions
  entities: EntityQuotaItem[]; // Array of entities (departments/units)
  
  // Legacy single-entity fields (for backward compatibility)
  departmentId: string;
  departmentName: string;
  
  // Capacity tracking (aggregated across all entities)
  approvedCapacity: number; // Total approvedCapacity across all entities
  pendingCapacity: number; // Total pendingCapacity across all entities
  assignedCount: number; // Total assigned across all entities
  availableCount: number; // Total available across all entities
  requestedCapacity: number; // Total requested across all entities
  
  // Assigned students list (all students across all entities)
  assignedStudents: Student[];
  
  // Request metadata
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  startDate: string;
  endDate: string;
}

interface AvailableQuotasTableProps {
  // Data sources
  coordinatorQuotaRequests: CoordinatorQuotaRequest[];
  students: Student[];
  praksisPlaces: PraksisPlace[];

  // Placement context for filtering
  placementId: string;
  studyId?: string;
  programId?: string;
  emne?: string;
  startDate?: string;
  endDate?: string;

  // Publication status
  isPublished?: boolean;

  // Actions
  onQuickAssign: (quotaInfo: {
    requestId: string;
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
    availableCapacity: number;
    entityId?: string; // For multi-entity requests
  }) => void;

  onRequestMoreQuotas?: () => void;
  onApproveRequest?: (requestId: string, approvedCapacity: number) => void;
  onEditRequest?: (requestId: string) => void;
  onDeleteRequest?: (requestId: string) => void;
}

// Helper: Check if placement dates are within quota request dates
function placementWithinQuotaDates(
  placementStart: string,
  placementEnd: string,
  quotaStart: string,
  quotaEnd: string
): boolean {
  const ps = new Date(placementStart);
  const pe = new Date(placementEnd);
  const qs = new Date(quotaStart);
  const qe = new Date(quotaEnd);

  ps.setHours(0, 0, 0, 0);
  pe.setHours(0, 0, 0, 0);
  qs.setHours(0, 0, 0, 0);
  qe.setHours(0, 0, 0, 0);

  // Placement must be completely within quota date range
  return ps >= qs && pe <= qe;
}

// Helper: Filter and transform coordinator quota requests
function processQuotaRequests(
  coordinatorRequests: CoordinatorQuotaRequest[],
  students: Student[],
  placementContext: {
    placementId: string;
    studyId?: string;
    programId?: string;
    emne?: string;
    startDate?: string;
    endDate?: string;
  }
): QuotaRequestItem[] {
  // Return empty if missing required context
  if (
    !placementContext.studyId ||
    !placementContext.programId ||
    !placementContext.startDate ||
    !placementContext.endDate
  ) {
    return [];
  }

  const items: QuotaRequestItem[] = [];

  for (const request of coordinatorRequests) {
    // Filter 1: Match study + program
    if (
      request.studyId !== placementContext.studyId ||
      request.programId !== placementContext.programId
    ) {
      continue;
    }

    // Filter 2: Match emne (if provided in both)
    if (placementContext.emne && request.emne && request.emne !== placementContext.emne) {
      continue;
    }

    // Filter 3: Only show approved or pending
    if (request.status !== 'approved' && request.status !== 'pending') {
      continue;
    }

    // Filter 4: Placement dates must be within quota request dates
    if (
      !placementWithinQuotaDates(
        placementContext.startDate,
        placementContext.endDate,
        request.startDate,
        request.endDate
      )
    ) {
      continue;
    }

    // Handle multi-entity requests - create separate row for each entity
    if (request.entityDistributions && request.entityDistributions.length > 0) {
      for (const entity of request.entityDistributions) {
        // Calculate assigned students for this specific entity
        const entityAssignedStudents = students.filter(
          (s) =>
            s.assignedPraksisPlace?.placeId === request.praksisPlaceId &&
            s.assignedPraksisPlace?.entityId === entity.entityId &&
            s.assignedPraksisPlace?.quotaRequestId === request.id
        );

        const entityAssignedCount = entityAssignedStudents.length;
        const entityApprovedCapacity = entity.approvedQuota ?? 0;
        const entityAvailableCount = Math.max(0, entityApprovedCapacity - entityAssignedCount);
        
        let pendingCapacity = 0;
        let approvedCapacity = 0;
        
        if (request.status === 'approved') {
          approvedCapacity = entityApprovedCapacity;
        } else if (request.status === 'pending') {
          pendingCapacity = entity.requestedQuota;
        }

        items.push({
          requestId: request.id,
          praksisPlaceId: request.praksisPlaceId,
          praksisPlaceName: request.praksisPlaceName,
          departmentId: entity.entityId,
          departmentName: entity.entityName,
          approvedCapacity: approvedCapacity,
          pendingCapacity: pendingCapacity,
          assignedCount: entityAssignedCount,
          availableCount: entityAvailableCount,
          requestedCapacity: entity.requestedQuota,
          assignedStudents: entityAssignedStudents,
          status: request.status,
          startDate: request.startDate,
          endDate: request.endDate,
          isMultiEntity: true,
          entities: [{
            entityId: entity.entityId,
            entityName: entity.entityName,
            requestedCapacity: entity.requestedQuota,
            approvedCapacity: approvedCapacity,
            assignedCount: entityAssignedCount,
            availableCount: entityAvailableCount,
            assignedStudents: entityAssignedStudents,
          }],
        });
      }
    } else {
      // Legacy single-entity request
      const assignedStudents = students.filter(
        (s) =>
          s.assignedPraksisPlace?.placeId === request.praksisPlaceId &&
          s.assignedPraksisPlace?.departmentId === request.departmentId &&
          s.assignedPraksisPlace?.quotaRequestId === request.id
      );

      const assignedCount = assignedStudents.length;
      
      let approvedCapacity = 0;
      let pendingCapacity = 0;
      
      if (request.status === 'approved') {
        approvedCapacity = request.approvedCapacity ?? request.requestedCapacity;
      } else if (request.status === 'pending') {
        pendingCapacity = request.requestedCapacity;
      }

      const availableCount = Math.max(0, approvedCapacity - assignedCount);

      items.push({
        requestId: request.id,
        praksisPlaceId: request.praksisPlaceId,
        praksisPlaceName: request.praksisPlaceName,
        departmentId: request.departmentId,
        departmentName: request.departmentName,
        approvedCapacity: approvedCapacity,
        pendingCapacity: pendingCapacity,
        assignedCount: assignedCount,
        availableCount: availableCount,
        requestedCapacity: request.requestedCapacity,
        assignedStudents: assignedStudents,
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate,
        isMultiEntity: false,
        entities: [{
          entityId: request.departmentId,
          entityName: request.departmentName,
          requestedCapacity: request.requestedCapacity,
          approvedCapacity: approvedCapacity,
          assignedCount: assignedCount,
          availableCount: availableCount,
          assignedStudents: assignedStudents,
        }],
      });
    }
  }

  // Sort by praksis place name, then department name
  return items.sort((a, b) => {
    const nameCompare = a.praksisPlaceName.localeCompare(b.praksisPlaceName);
    if (nameCompare !== 0) return nameCompare;
    return a.departmentName.localeCompare(b.departmentName);
  });
}

// Helper: Calculate chart data for a specific quota request
function calculateQuotaChartData(
  quota: QuotaRequestItem,
  placementStartDate: string,
  placementEndDate: string
) {
  const startDate = new Date(placementStartDate);
  const endDate = new Date(placementEndDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const chartData = [];
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const interval = Math.max(1, Math.ceil(totalDays / 12)); // Show ~12 data points

  for (let i = 0; i <= totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    // Simple logic: if current date is within quota date range, show capacity
    const quotaStart = new Date(quota.startDate);
    const quotaEnd = new Date(quota.endDate);
    quotaStart.setHours(0, 0, 0, 0);
    quotaEnd.setHours(0, 0, 0, 0);

    let approvedCount = 0;
    let inReviewCount = 0;

    if (currentDate >= quotaStart && currentDate <= quotaEnd) {
      if (quota.status === 'approved') {
        approvedCount = quota.approvedCapacity;
      } else if (quota.status === 'pending') {
        inReviewCount = quota.pendingCapacity;
      }
    }

    // Add data points at intervals to keep chart readable
    if (i % interval === 0 || i === totalDays) {
      chartData.push({
        day: i,
        approved: approvedCount,
        inReview: inReviewCount,
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
  }

  return chartData;
}

export default function AvailableQuotasTable({
  coordinatorQuotaRequests,
  students,
  praksisPlaces,
  placementId,
  studyId,
  programId,
  emne,
  startDate,
  endDate,
  isPublished = false,
  onQuickAssign,
  onRequestMoreQuotas,
  onApproveRequest,
  onEditRequest,
  onDeleteRequest,
}: AvailableQuotasTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [warningDialogRequest, setWarningDialogRequest] = useState<QuotaRequestItem | null>(null);
  const [approvalDialogRequest, setApprovalDialogRequest] = useState<QuotaRequestItem | null>(null);
  const [approvedQuantity, setApprovedQuantity] = useState<number>(0);
  const [showPublishWarning, setShowPublishWarning] = useState(false);
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState<QuotaRequestItem | null>(null);

  // Process quota requests based on placement context
  const quotaItems = useMemo(
    () =>
      processQuotaRequests(
        coordinatorQuotaRequests,
        students,
        {
          placementId,
          studyId,
          programId,
          emne,
          startDate,
          endDate,
        }
      ),
    [coordinatorQuotaRequests, students, placementId, studyId, programId, emne, startDate, endDate]
  );

  // Calculate summary stats
  const totalApprovedCapacity = quotaItems.reduce((sum, q) => sum + q.approvedCapacity, 0);
  const totalPendingCapacity = quotaItems.reduce((sum, q) => sum + q.pendingCapacity, 0);
  const totalAssigned = quotaItems.reduce((sum, q) => sum + q.assignedCount, 0);
  const totalAvailable = quotaItems.reduce((sum, q) => sum + q.availableCount, 0);
  const hasPendingRequests = quotaItems.some(q => q.status === 'pending');

  // Toggle row expansion
  const toggleRow = (requestId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  // Check if all quotas are fully assigned
  const allQuotasFullyAssigned = quotaItems.length > 0 && totalAvailable === 0 && !hasPendingRequests;

  // Handle opening warning dialog
  const handleWarningClick = (quota: QuotaRequestItem) => {
    setWarningDialogRequest(quota);
  };

  // Handle opening approval dialog
  const handleProceedToApproval = () => {
    if (warningDialogRequest) {
      setApprovedQuantity(warningDialogRequest.requestedCapacity);
      setApprovalDialogRequest(warningDialogRequest);
      setWarningDialogRequest(null);
    }
  };

  // Handle final approval
  const handleConfirmApproval = () => {
    if (approvalDialogRequest && onApproveRequest) {
      onApproveRequest(approvalDialogRequest.requestId, approvedQuantity);
      setApprovalDialogRequest(null);
      setApprovedQuantity(0);
    }
  };

  // Show empty state if no placement context
  if (!studyId || !programId || !startDate || !endDate) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Complete Placement Details
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Fill out the placement metadata above to view available quotas
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no quota requests
  if (quotaItems.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Quota Requests Yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Request quotas from praksis places to start assigning students
          </p>
          {onRequestMoreQuotas && (
            <Button
              onClick={onRequestMoreQuotas}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Quota
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Available Quotas
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {quotaItems.length} quota request{quotaItems.length !== 1 ? 's' : ''} • {totalAvailable} available placement{totalAvailable !== 1 ? 's' : ''}
            </p>
          </div>
          {onRequestMoreQuotas && (
            <Button
              onClick={onRequestMoreQuotas}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request More Quotas
            </Button>
          )}
        </div>
      </div>

      {/* All quotas fully assigned message */}
      {allQuotasFullyAssigned && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">
                  All quotas are fully assigned
                </p>
                <p className="text-sm text-amber-700">
                  Request more quotas to assign additional students
                </p>
              </div>
            </div>
            {onRequestMoreQuotas && (
              <Button
                onClick={onRequestMoreQuotas}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request More
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10"></th>
              <th className="w-12"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Praksis Place
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                Approved
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned 
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotaItems.map((quota, index) => {
              const isExpanded = expandedRows.has(quota.requestId + '-' + quota.departmentId);
              const hasAssignedStudents = quota.assignedStudents.length > 0;
              const hasAvailability = quota.availableCount > 0;
              const isPending = quota.status === 'pending';

              // Calculate chart data for this quota
              const chartData = startDate && endDate
                ? calculateQuotaChartData(quota, startDate, endDate)
                : [];
              
              const rowKey = `${quota.requestId}-${quota.departmentId}`;

              return (
                <Fragment key={rowKey}>
                  <tr className="hover:bg-gray-50">
                    {/* Expand/Collapse Icon */}
                    <td className="px-6 py-4">
                      {hasAssignedStudents && (
                        <button
                          onClick={() => toggleRow(quota.requestId + '-' + quota.departmentId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </td>

                    {/* Warning Icon for Pending Requests */}
                    <td className="px-3 py-4">
                      {isPending && (
                        <button
                          onClick={() => handleWarningClick(quota)}
                          className="text-amber-500 hover:text-amber-600 transition-colors"
                          title="Approval pending"
                        >
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </button>
                      )}
                    </td>

                    {/* Praksis Place */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {quota.praksisPlaceName}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {quota.departmentName}
                      </div>
                    </td>

                    {/* Pending Requests */}
                    <td className="px-6 py-4 text-center">
                      {quota.status === 'pending' ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {quota.pendingCapacity}
                        </Badge>
                      ) : quota.status === 'approved' ? (
                        <span className="text-sm font-medium text-gray-900">
                          {quota.requestedCapacity}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">0</span>
                      )}
                    </td>

                    {/* Approved Requests */}
                    <td className="px-6 py-4 text-center bg-green-50">
                      {quota.approvedCapacity > 0 ? (
                        <span className="text-sm font-semibold text-green-700">
                          {quota.approvedCapacity}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">0</span>
                      )}
                    </td>

                    {/* Assigned Students */}
                    <td className="px-6 py-4 text-center">
                      {quota.assignedCount > 0 ? (
                        <button
                          onClick={() => toggleRow(quota.requestId + '-' + quota.departmentId)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {quota.assignedCount}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">0</span>
                      )}
                    </td>

                    {/* Available Capacity */}
                    <td className="px-6 py-4 text-center">
                      {quota.availableCount > 0 ? (
                        <span className="text-sm font-medium text-green-600">
                          {quota.availableCount}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">0</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      {isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          {onEditRequest && (
                            <button
                              onClick={() => onEditRequest(quota.requestId)}
                              className="text-gray-600 hover:text-blue-600 transition-colors"
                              title="Edit request"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {onDeleteRequest && (
                            <button
                              onClick={() => setDeleteConfirmRequest(quota)}
                              className="text-gray-600 hover:text-red-600 transition-colors"
                              title="Delete request"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!hasAvailability}
                          onClick={() => {
                            if (!isPublished) {
                              setShowPublishWarning(true);
                            } else {
                              // Validate that we have valid department info before proceeding
                              if (!quota.departmentId || !quota.departmentName) {
                                console.error('[QuickAssign] Invalid quota data - missing department:', quota);
                                toast.error('Cannot assign students: Department information is missing');
                                return;
                              }
                              
                              onQuickAssign({
                                requestId: quota.requestId,
                                praksisPlaceId: quota.praksisPlaceId,
                                praksisPlaceName: quota.praksisPlaceName,
                                departmentId: quota.departmentId,
                                departmentName: quota.departmentName,
                                availableCapacity: quota.availableCount,
                                entityId: quota.departmentId, // Pass entityId (same as departmentId for each row)
                              });
                            }
                          }}
                          className={
                            hasAvailability
                              ? "text-blue-600 border-blue-600 hover:bg-blue-50"
                              : ""
                          }
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded row - Show assigned students + chart */}
                  {isExpanded && hasAssignedStudents && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          {/* Assigned Students List */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                              Assigned Students ({quota.assignedStudents.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {quota.assignedStudents.map((student) => (
                                <div
                                  key={student.id}
                                  className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3"
                                >
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {student.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {student.email}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Chart */}
                          {chartData.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3">
                                Capacity Timeline
                              </h4>
                              
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Capacity:</span>
          <div className="flex items-center gap-6">
            <span className="text-gray-900">
              <span className="font-medium">{totalApprovedCapacity}</span> approved
            </span>
            {totalPendingCapacity > 0 && (
              <span className="text-amber-700">
                <span className="font-medium">{totalPendingCapacity}</span> pending
              </span>
            )}
            <span className="text-gray-900">
              <span className="font-medium">{totalAssigned}</span> assigned
            </span>
            <span className="text-green-600">
              <span className="font-medium">{totalAvailable}</span> available
            </span>
          </div>
        </div>
      </div>

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
            <Button
              variant="outline"
              onClick={() => setWarningDialogRequest(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToApproval}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
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
                <p className="text-xs text-gray-500">
                  Enter a value between 0 and {approvalDialogRequest.requestedCapacity}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setApprovalDialogRequest(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApproval}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={approvedQuantity < 0 || (approvalDialogRequest && approvedQuantity > approvalDialogRequest.requestedCapacity)}
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
            <Button
              onClick={() => setShowPublishWarning(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
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
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmRequest(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmRequest && onDeleteRequest) {
                  onDeleteRequest(deleteConfirmRequest.requestId);
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