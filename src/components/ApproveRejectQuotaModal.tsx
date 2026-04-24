import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Calendar, Building2, GraduationCap, Users, FileText, AlertCircle, X } from 'lucide-react';
import { CoordinatorQuotaRequest } from '../types/coordinatorQuotaRequest';
import { PraksisPlace } from '../types/praksisPlace';
import { HierarchicalOrganizationSelector } from './HierarchicalOrganizationSelector';

interface ApproveRejectQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: CoordinatorQuotaRequest | null;
  onApprove: (id: string, responseNotes?: string, selectedDepartmentId?: string, approvedCapacity?: number, entityApprovals?: Record<string, number>, entityStatuses?: Record<string, 'approved' | 'rejected'>) => void;
  onReject: (id: string, reason: string, responseNotes?: string) => void;
  praksisPlace?: PraksisPlace;
}

export function ApproveRejectQuotaModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  praksisPlace,
}: ApproveRejectQuotaModalProps) {
  const [responseNotes, setResponseNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectFields, setShowRejectFields] = useState(false);
  const [error, setError] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [approvedCapacity, setApprovedCapacity] = useState('');
  const [selectedOrganizationNodeId, setSelectedOrganizationNodeId] = useState<string | null>(null);
  const [selectedOrganizationNodeName, setSelectedOrganizationNodeName] = useState<string | null>(null);
  // State for multi-entity approval
  const [entityApprovals, setEntityApprovals] = useState<Record<string, number>>({});
  const [entityRejections, setEntityRejections] = useState<Record<string, boolean>>({});

  // Check if department needs to be selected
  const needsDepartmentSelection = request && (!request.departmentId || request.departmentName === 'To be assigned by SK');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setResponseNotes('');
      setRejectionReason('');
      setShowRejectFields(false);
      setError('');
      setSelectedDepartmentId('');
      setApprovedCapacity('');
      setSelectedOrganizationNodeId(null);
      setSelectedOrganizationNodeName(null);
      setEntityApprovals({});
      setEntityRejections({});
    } else if (request) {
      // Set default approved capacity to the requested capacity
      setApprovedCapacity(String(request.requestedCapacity));
      
      if (request.departmentId && request.departmentName !== 'To be assigned by SK') {
        // If department is already set, use it
        setSelectedDepartmentId(request.departmentId);
        setSelectedOrganizationNodeId(request.departmentId);
        setSelectedOrganizationNodeName(request.departmentName);
      }

      // Initialize entity approvals for multi-entity requests
      if (request.entityDistributions && request.entityDistributions.length > 0) {
        const initialApprovals: Record<string, number> = {};
        const initialRejections: Record<string, boolean> = {};
        request.entityDistributions.forEach(entity => {
          initialApprovals[entity.id] = entity.approvedQuota ?? entity.requestedQuota;
          initialRejections[entity.id] = entity.status === 'rejected';
        });
        setEntityApprovals(initialApprovals);
        setEntityRejections(initialRejections);
      }
    }
  }, [isOpen, request]);

  if (!request) {
    return null;
  }

  const handleApprove = () => {
    // Handle multi-entity approval
    if (request.entityDistributions && request.entityDistributions.length > 0) {
      // Check if all entities are rejected
      const allRejected = request.entityDistributions.every(entity => entityRejections[entity.id]);
      if (allRejected) {
        setError('All entities are rejected. Use the Reject button to reject the entire request.');
        return;
      }

      // Validate non-rejected entities have approval values > 0
      const nonRejectedEntities = request.entityDistributions.filter(e => !entityRejections[e.id]);
      const allNonRejectedHaveValues = nonRejectedEntities.every(
        entity => entityApprovals[entity.id] !== undefined && entityApprovals[entity.id] > 0
      );

      if (!allNonRejectedHaveValues) {
        setError('Please enter approval quantities (greater than 0) for all non-rejected entities');
        return;
      }

      // Build final approvals (rejected entities get 0)
      const finalApprovals: Record<string, number> = {};
      request.entityDistributions.forEach(entity => {
        finalApprovals[entity.id] = entityRejections[entity.id] ? 0 : (entityApprovals[entity.id] || 0);
      });

      // Build entity statuses
      const entityStatuses: Record<string, 'approved' | 'rejected'> = {};
      request.entityDistributions.forEach(entity => {
        entityStatuses[entity.id] = entityRejections[entity.id] ? 'rejected' : 'approved';
      });

      // Calculate total approved capacity (only non-rejected)
      const totalApproved = nonRejectedEntities.reduce((sum, entity) => sum + (finalApprovals[entity.id] || 0), 0);

      if (totalApproved > request.requestedCapacity) {
        setError(`Total approved capacity (${totalApproved}) cannot exceed requested capacity (${request.requestedCapacity})`);
        return;
      }

      onApprove(
        request.id,
        responseNotes.trim() || undefined,
        undefined,
        totalApproved,
        finalApprovals,
        entityStatuses
      );
      onClose();
      return;
    }

    // Legacy single-entity approval
    // Validate department selection if needed
    if (needsDepartmentSelection && !selectedDepartmentId) {
      setError('Please select a department before approving');
      return;
    }

    // Validate approved capacity
    const capacity = parseInt(approvedCapacity);
    if (!approvedCapacity || isNaN(capacity) || capacity <= 0) {
      setError('Please enter a valid capacity (must be greater than 0)');
      return;
    }

    if (capacity > request.requestedCapacity) {
      setError(`Approved capacity cannot exceed the requested capacity (${request.requestedCapacity})`);
      return;
    }
    
    onApprove(
      request.id, 
      responseNotes.trim() || undefined,
      needsDepartmentSelection ? selectedDepartmentId : undefined,
      capacity
    );
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    onReject(request.id, rejectionReason.trim(), responseNotes.trim() || undefined);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Quota Request</DialogTitle>
          <DialogDescription>
            Review the details and approve or reject this capacity request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request From Section */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Request From
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">University</Label>
                <p className="font-medium text-gray-800">{request.universityName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Study</Label>
                <p className="font-medium text-gray-800">{request.studyName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Study Program</Label>
                <p className="font-medium text-gray-800">{request.programName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Requested By</Label>
                <p className="font-medium text-gray-800">{request.requestedBy}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-600">Requested On</Label>
                <p className="font-medium text-gray-800">{formatDateTime(request.requestedDate)}</p>
              </div>
            </div>
          </div>

          {/* Request For Section */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Request For
              </h3>
            </div>
            
            {/* Display multi-entity requests */}
            {request.entityDistributions && request.entityDistributions.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <Label className="text-gray-600">Praksis Place</Label>
                  <p className="font-medium text-gray-800">{request.praksisPlaceName}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-600">Entity Distributions</Label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Entity</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Requested</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Approve</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Reject</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {request.entityDistributions.map((entity) => {
                          const isRejected = !!entityRejections[entity.id];
                          return (
                            <tr key={entity.id} className={isRejected ? 'bg-red-50' : 'hover:bg-gray-50'}>
                              <td className="px-3 py-2 font-medium text-gray-800">
                                <span className={isRejected ? 'line-through text-gray-400' : ''}>{entity.entityName}</span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`font-bold ${isRejected ? 'text-gray-400' : 'text-purple-600'}`}>{entity.requestedQuota}</span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max={entity.requestedQuota}
                                  value={isRejected ? '' : (entityApprovals[entity.id] ?? '')}
                                  disabled={isRejected}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setEntityApprovals({
                                      ...entityApprovals,
                                      [entity.id]: value
                                    });
                                    setError('');
                                  }}
                                  className={`w-20 text-center ${isRejected ? 'opacity-40 cursor-not-allowed' : ''}`}
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEntityRejections({ ...entityRejections, [entity.id]: !isRejected });
                                    setError('');
                                  }}
                                  title={isRejected ? 'Undo rejection' : 'Reject this entity'}
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
                                    isRejected
                                      ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                                      : 'border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50'
                                  }`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <span className="text-xs text-gray-600">Requested</span>
                        <p className="text-lg font-bold text-purple-600">{request.requestedCapacity}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-gray-600">To Approve</span>
                        <p className="text-lg font-bold text-green-600">
                          {request.entityDistributions.reduce((sum, entity) =>
                            entityRejections[entity.id] ? sum : sum + (entityApprovals[entity.id] || 0), 0
                          )}
                        </p>
                      </div>
                      {Object.values(entityRejections).some(Boolean) && (
                        <div className="text-center">
                          <span className="text-xs text-gray-600">Rejected</span>
                          <p className="text-lg font-bold text-red-500">
                            {request.entityDistributions.filter(e => entityRejections[e.id]).length}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Department</Label>
                  <p className="font-medium text-gray-800">{request.departmentName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Number of Places</Label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-600">
                      {request.requestedCapacity}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Period Section */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Period
              </h3>
            </div>
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
              <div className="text-sm">
                <Label className="text-gray-600">Start Date</Label>
                <p className="font-medium text-gray-800">{formatDate(request.startDate)}</p>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-sm">
                <Label className="text-gray-600">End Date</Label>
                <p className="font-medium text-gray-800">{formatDate(request.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Request Notes */}
          {request.notes && (
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Request Notes
                </h3>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 italic">&quot;{request.notes}&quot;</p>
              </div>
            </div>
          )}

          {/* Response Section */}
          {!showRejectFields ? (
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-800">Your Response</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="response-notes">
                  Response Notes <span className="text-gray-500">(Optional)</span>
                </Label>
                <Textarea
                  id="response-notes"
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Add any notes or comments for the requesting coordinator..."
                  rows={3}
                />
              </div>
              {needsDepartmentSelection && !request.departmentId && (
                <div className="space-y-2">
                  <Label>
                    Organization Unit <span className="text-red-500">*</span>
                  </Label>
                  {praksisPlace && (
                    <HierarchicalOrganizationSelector
                      praksisPlaces={[praksisPlace]}
                      selectedPraksisPlaceId={praksisPlace.id}
                      selectedOrganizationNodeId={selectedOrganizationNodeId}
                      onPraksisPlaceSelect={() => {
                        // Praksis place is fixed in this context
                      }}
                      onOrganizationNodeSelect={(nodeId, nodeName) => {
                        setSelectedOrganizationNodeId(nodeId);
                        setSelectedOrganizationNodeName(nodeName);
                        if (nodeId) {
                          setSelectedDepartmentId(nodeId);
                        } else {
                          setSelectedDepartmentId('');
                        }
                        setError('');
                      }}
                      disabled={false}
                      placeholder="Select organization unit"
                      showOptionalLabel={false}
                      skipPlaceSelection={true}
                    />
                  )}
                  {error && !selectedDepartmentId && <p className="text-sm text-red-500">{error}</p>}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="approved-capacity">
                  Approved Capacity <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  <Input
                    id="approved-capacity"
                    value={approvedCapacity}
                    onChange={(e) => {
                      setApprovedCapacity(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter the approved capacity"
                    type="number"
                    min="1"
                    max={request.requestedCapacity}
                  />
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>
                      You can approve a different capacity than requested. Maximum: {request.requestedCapacity} place{request.requestedCapacity !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {approvedCapacity && parseInt(approvedCapacity) !== request.requestedCapacity && parseInt(approvedCapacity) > 0 && (
                    <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-800">
                        You are approving <strong>{approvedCapacity}</strong> place{parseInt(approvedCapacity) !== 1 ? 's' : ''} instead of the requested <strong>{request.requestedCapacity}</strong>.
                      </p>
                    </div>
                  )}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-800">Rejection Details</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      setError('');
                    }}
                    placeholder="Please provide a reason for rejection (e.g., insufficient capacity, timing conflict, etc.)"
                    rows={2}
                    className={error ? 'border-red-500' : ''}
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejection-notes">
                    Additional Notes <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <Textarea
                    id="rejection-notes"
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Add any suggestions or alternative options..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!showRejectFields ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectFields(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Request
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectFields(false);
                  setRejectionReason('');
                  setError('');
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Rejection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}