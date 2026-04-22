import { useState, useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import {
  Calendar as CalendarIcon,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Trash2,
  AlertCircle,
  ClipboardCheck,
} from 'lucide-react';
import { CoordinatorQuotaRequest, EntityDistribution } from '../types/coordinatorQuotaRequest';
import { PraksisPlace } from '../types/praksisPlace';
import { format } from 'date-fns';
import { HierarchicalOrganizationSelector } from './HierarchicalOrganizationSelector';

export interface Study {
  id: string;
  name: string;
  programs: { id: string; name: string }[];
}

interface RequestQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (
    request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>
  ) => void;
  placement?: {
    id: string;
    studyId: string;
    studyName: string;
    programId: string;
    programName: string;
    universityId: string;
    universityName: string;
    startDate: string;
    endDate: string;
  };
  existingQuotas?: Array<{
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
  }>;
  praksisPlaces: PraksisPlace[];
  currentUserName: string;
  existingRequests: CoordinatorQuotaRequest[];
  studies?: Study[];
  onSave?: (request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => void;
  editingRequest?: CoordinatorQuotaRequest;
  onUpdate?: (requestId: string, updates: Partial<CoordinatorQuotaRequest>) => void;
  nodeSlots?: Record<string, Record<string, number>>;
}

export function RequestQuotaModal({
  isOpen,
  onClose,
  onSubmit,
  placement,
  existingQuotas: _existingQuotas,
  praksisPlaces,
  currentUserName,
  existingRequests,
  studies,
  onSave,
  editingRequest,
  onUpdate,
  nodeSlots = {},
}: RequestQuotaModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedPraksisPlaceId, setSelectedPraksisPlaceId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [emne, setEmne] = useState<string>('');
  const [entityDistributions, setEntityDistributions] = useState<EntityDistribution[]>([]);

  const dialogContentRef = useRef<HTMLDivElement>(null);
  const totalSteps = 3;

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedPraksisPlaceId('');
      setStartDate(undefined);
      setEndDate(undefined);
      setNotes('');
      setErrors({});
      setSelectedStudyId('');
      setSelectedProgramId('');
      setEmne('');
      setEntityDistributions([]);
    } else {
      setCurrentStep(1);
      if (placement?.startDate && placement?.endDate) {
        setStartDate(new Date(placement.startDate));
        setEndDate(new Date(placement.endDate));
      }
      if (editingRequest) {
        setSelectedPraksisPlaceId(editingRequest.praksisPlaceId);
        setStartDate(new Date(editingRequest.startDate));
        setEndDate(new Date(editingRequest.endDate));
        setNotes(editingRequest.notes || '');
        if (!placement) {
          setSelectedStudyId(editingRequest.studyId);
          setSelectedProgramId(editingRequest.programId);
          setEmne(editingRequest.emne || '');
        }
        if (editingRequest.entityDistributions && editingRequest.entityDistributions.length > 0) {
          setEntityDistributions(editingRequest.entityDistributions);
        } else if (editingRequest.departmentId && editingRequest.departmentName) {
          setEntityDistributions([{
            id: `entity-${Date.now()}`,
            entityId: editingRequest.departmentId,
            entityName: editingRequest.departmentName,
            requestedQuota: editingRequest.requestedCapacity,
          }]);
        }
      }
    }
  }, [isOpen, placement, editingRequest]);

  const availablePrograms = studies?.find((s) => s.id === selectedStudyId)?.programs || [];

  const handleRemoveEntity = (id: string) => {
    setEntityDistributions(entityDistributions.filter((e) => e.id !== id));
  };

  const handleUpdateEntity = (id: string, field: keyof EntityDistribution, value: any) => {
    setEntityDistributions(
      entityDistributions.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const getTotalRequestedQuota = () =>
    entityDistributions.reduce((sum, e) => sum + (e.requestedQuota || 0), 0);

  const getStatusBadgeClass = (status: CoordinatorQuotaRequest['status']) => {
    switch (status) {
      case 'approved':  return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':   return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':  return 'bg-red-100 text-red-700 border-red-200';
      case 'fulfilled': return 'bg-blue-100 text-blue-700 border-blue-200';
      default:          return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!placement) {
        if (!selectedStudyId) newErrors.study = 'Please select a study';
        if (!selectedProgramId) newErrors.program = 'Please select a program';
      }
      if (!startDate) newErrors.startDate = 'Please select a start date';
      if (!endDate) newErrors.endDate = 'Please select an end date';
      if (startDate && endDate && endDate <= startDate)
        newErrors.endDate = 'End date must be after start date';
      if (!selectedPraksisPlaceId)
        newErrors.praksisPlace = 'Please select a praksis place';
    }

    if (step === 2) {
      if (entityDistributions.length === 0) {
        newErrors.entities = 'Please add at least one entity distribution';
      } else {
        let hasInvalid = false;
        entityDistributions.forEach((entity, index) => {
          if (!entity.entityId || !entity.entityName) {
            newErrors[`entity-${index}`] = 'Please select an entity';
            hasInvalid = true;
          }
          if (!entity.requestedQuota || entity.requestedQuota <= 0) {
            newErrors[`entity-quota-${index}`] = 'Quota must be greater than 0';
            hasInvalid = true;
          }
        });
        if (hasInvalid) newErrors.entities = 'Please fix entity distribution errors';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validateStep(2)) return;

    const selectedPlace = praksisPlaces.find((p) => p.id === selectedPraksisPlaceId);
    if (!selectedPlace || !startDate || !endDate) return;

    let studyId, studyName, programId, programName, universityId, universityName;
    if (placement) {
      ({ studyId, studyName, programId, programName, universityId, universityName } = placement);
    } else {
      const selectedStudy = studies?.find((s) => s.id === selectedStudyId);
      const selectedProgram = selectedStudy?.programs.find((p) => p.id === selectedProgramId);
      studyId = selectedStudyId;
      studyName = selectedStudy?.name || '';
      programId = selectedProgramId;
      programName = selectedProgram?.name || '';
      universityId = 'U1';
      universityName = 'Oslo University';
    }

    const totalRequestedCapacity = getTotalRequestedQuota();
    const firstEntity = entityDistributions[0] || {
      entityId: '',
      entityName: 'Multiple entities',
      requestedQuota: totalRequestedCapacity,
    };

    const request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'> = {
      placementId: placement?.id ?? '',
      praksisPlaceId: selectedPlace.id,
      praksisPlaceName: selectedPlace.name,
      entityDistributions,
      departmentId: firstEntity.entityId,
      departmentName: firstEntity.entityName,
      universityId,
      universityName,
      studyId,
      studyName,
      programId,
      programName,
      emne: emne.trim() || undefined,
      requestedCapacity: totalRequestedCapacity,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      requestedBy: currentUserName,
      notes: notes.trim() || undefined,
    };

    if (editingRequest) {
      onUpdate?.(editingRequest.id, request);
    } else {
      onSubmit?.(request);
      onSave?.(request);
    }
    onClose();
  };

  const getStepInfo = () => {
    if (currentStep === 1) return {
      title: 'Step 1: Request Details',
      description: 'Fill in the request details and select a praksis place to see existing requests',
    };
    if (currentStep === 2) return {
      title: 'Step 2: Entity Distribution',
      description: 'Distribute the quota across departments within the selected praksis place',
    };
    return {
      title: 'Step 3: Summary & Notes',
      description: 'Review your request and add any additional notes',
    };
  };

  const stepInfo = getStepInfo();

  // Active existing requests for the selected place (endDate > today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeRequestsForPlace = existingRequests.filter(
    (r) => r.praksisPlaceId === selectedPraksisPlaceId && new Date(r.endDate) > today
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <div ref={dialogContentRef}>
          <DialogHeader>
            <DialogTitle>{editingRequest ? 'Edit Quota Request' : 'Request Quota'}</DialogTitle>
            <DialogDescription>{stepInfo.description}</DialogDescription>
          </DialogHeader>

          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            {Array.from({ length: totalSteps }, (_, i) => {
              const stepNum = i + 1;
              const isActive = currentStep === stepNum;
              const isCompleted = currentStep > stepNum;
              return (
                <div key={i} className="flex items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    isActive && 'bg-purple-600 text-white',
                    isCompleted && 'bg-green-600 text-white',
                    !isActive && !isCompleted && 'bg-gray-200 text-gray-600'
                  )}>
                    {stepNum}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={cn('w-12 h-1 mx-1 transition-colors', isCompleted ? 'bg-green-600' : 'bg-gray-200')} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-6 py-4">

            {/* ── Step 1: 2-column — form left, existing requests right ─────── */}
            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-6 items-start">

                {/* Left column: form */}
                <div className="space-y-4">
                  {/* Request Context banner */}
                  {placement && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1 space-y-0.5">
                          <h3 className="font-semibold text-sm text-blue-900">Request Context</h3>
                          <div className="text-sm text-blue-800">
                            <div><span className="font-medium">University:</span> {placement.universityName}</div>
                            <div><span className="font-medium">Study:</span> {placement.studyName}</div>
                            <div><span className="font-medium">Program:</span> {placement.programName}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. Praksis Place */}
                  <h3 className="font-semibold text-sm text-gray-900">Praksis Place</h3>
                  <div className="space-y-2">
                    <Label htmlFor="praksisPlace">
                      Praksis Place <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedPraksisPlaceId}
                      onValueChange={(value) => {
                        setSelectedPraksisPlaceId(value);
                        setEntityDistributions([]);
                        setErrors((prev) => ({ ...prev, praksisPlace: '' }));
                      }}
                    >
                      <SelectTrigger id="praksisPlace" className={cn(errors.praksisPlace && 'border-red-500')}>
                        <SelectValue placeholder="Select praksis place" />
                      </SelectTrigger>
                      <SelectContent>
                        {praksisPlaces.map((place) => (
                          <SelectItem key={place.id} value={place.id}>{place.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.praksisPlace && (
                      <p className="text-sm text-red-600">{errors.praksisPlace}</p>
                    )}
                  </div>

                  {/* 2. Placement Period */}
                  <h3 className="font-semibold text-sm text-gray-900 pt-1">Placement Period</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Date <span className="text-red-500">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !startDate && 'text-muted-foreground',
                              errors.startDate && 'border-red-500'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setStartDate(date);
                              setErrors((prev) => ({ ...prev, startDate: '' }));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>End Date <span className="text-red-500">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !endDate && 'text-muted-foreground',
                              errors.endDate && 'border-red-500'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              setEndDate(date);
                              setErrors((prev) => ({ ...prev, endDate: '' }));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
                    </div>
                  </div>

                  {/* 3. Academic Information (only when no placement context) */}
                  {!placement && studies && (
                    <>
                      <h3 className="font-semibold text-sm text-gray-900 pt-1">Academic Information</h3>

                      <div className="space-y-2">
                        <Label htmlFor="study">Study <span className="text-red-500">*</span></Label>
                        <Select
                          value={selectedStudyId}
                          onValueChange={(value) => {
                            setSelectedStudyId(value);
                            setSelectedProgramId('');
                            setErrors((prev) => ({ ...prev, study: '' }));
                          }}
                        >
                          <SelectTrigger id="study" className={cn(errors.study && 'border-red-500')}>
                            <SelectValue placeholder="Select study" />
                          </SelectTrigger>
                          <SelectContent>
                            {studies.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.study && <p className="text-sm text-red-600">{errors.study}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="program">Program <span className="text-red-500">*</span></Label>
                        <Select
                          value={selectedProgramId}
                          onValueChange={(value) => {
                            setSelectedProgramId(value);
                            setErrors((prev) => ({ ...prev, program: '' }));
                          }}
                          disabled={!selectedStudyId}
                        >
                          <SelectTrigger id="program" className={cn(errors.program && 'border-red-500')}>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePrograms.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.program && <p className="text-sm text-red-600">{errors.program}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emne">Emne <span className="text-gray-500 text-xs">(Optional)</span></Label>
                        <Input
                          id="emne"
                          value={emne}
                          onChange={(e) => setEmne(e.target.value)}
                          placeholder="Enter course or subject name"
                          maxLength={100}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Right column: existing requests */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Existing Requests</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Active requests (end date in the future)
                    </p>
                  </div>

                  {!selectedPraksisPlaceId ? (
                    <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center bg-gray-50">
                      <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-400">
                        Select a praksis place to see existing requests
                      </p>
                    </div>
                  ) : activeRequestsForPlace.length === 0 ? (
                    <div className="border border-gray-200 rounded-lg p-10 text-center bg-gray-50">
                      <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500 font-medium">No active requests</p>
                      <p className="text-xs text-gray-400 mt-1">
                        No quota requests have been made for this praksis place yet
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Study / Program</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Entity</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Req · Apr · Con</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Period</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {activeRequestsForPlace.map((request) => {
                            const hasEntityDist =
                              request.entityDistributions && request.entityDistributions.length > 0;
                            const entities = hasEntityDist
                              ? request.entityDistributions!
                              : [{
                                  id: 'legacy',
                                  entityId: request.departmentId,
                                  entityName: request.departmentName,
                                  requestedQuota: request.requestedCapacity,
                                  approvedQuota: request.approvedCapacity,
                                  consumedQuota: 0,
                                }];
                            const rowSpan = entities.length;

                            return entities.map((entity, entityIndex) => {
                              const isFirst = entityIndex === 0;
                              return (
                                <tr key={`${request.id}-${entity.id}`} className="hover:bg-gray-50 transition-colors">
                                  {isFirst && (
                                    <td className="px-3 py-2 align-top text-xs" rowSpan={rowSpan}>
                                      <div className="font-medium text-gray-800">{request.studyName}</div>
                                      <div className="text-gray-500">{request.programName}</div>
                                    </td>
                                  )}

                                  <td className="px-3 py-2 text-xs font-medium text-blue-700">
                                    {entity.entityName}
                                  </td>

                                  <td className="px-3 py-2 text-center">
                                    <span className="text-xs font-bold text-purple-600">{entity.requestedQuota ?? '-'}</span>
                                    <span className="text-xs text-gray-400"> · </span>
                                    <span className="text-xs font-bold text-green-600">
                                      {request.status === 'approved' && entity.approvedQuota !== undefined
                                        ? entity.approvedQuota
                                        : '-'}
                                    </span>
                                    <span className="text-xs text-gray-400"> · </span>
                                    <span className="text-xs font-bold text-blue-600">
                                      {entity.consumedQuota ?? 0}
                                    </span>
                                  </td>

                                  {isFirst && (
                                    <td className="px-3 py-2 align-top text-xs text-gray-600 whitespace-nowrap" rowSpan={rowSpan}>
                                      <div>{format(new Date(request.startDate), 'MMM d, yy')}</div>
                                      <div>{format(new Date(request.endDate), 'MMM d, yy')}</div>
                                    </td>
                                  )}

                                  {isFirst && (
                                    <td className="px-3 py-2 align-top" rowSpan={rowSpan}>
                                      <Badge variant="outline" className={cn('text-xs', getStatusBadgeClass(request.status))}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                      </Badge>
                                    </td>
                                  )}
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 2: Entity Distribution ──────────────────────────────────── */}
            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-6 items-start">

                {/* Left: tree */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-gray-900">Add Entities</h3>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {praksisPlaces.find((p) => p.id === selectedPraksisPlaceId)?.name}
                    </Label>
                    <HierarchicalOrganizationSelector
                      praksisPlaces={praksisPlaces}
                      selectedPraksisPlaceId={selectedPraksisPlaceId}
                      selectedOrganizationNodeId={null}
                      onPraksisPlaceSelect={() => {}}
                      onOrganizationNodeSelect={() => {}}
                      addedEntityIds={entityDistributions.map((e) => e.entityId)}
                      onAddEntity={(nodeId, nodeName, quantity) => {
                        const exists = entityDistributions.some((e) => e.entityId === nodeId);
                        if (!exists) {
                          const newEntity: EntityDistribution = {
                            id: `entity-${Date.now()}`,
                            entityId: nodeId,
                            entityName: nodeName,
                            requestedQuota: quantity,
                          };
                          setEntityDistributions([...entityDistributions, newEntity]);
                          setErrors((prev) => ({ ...prev, entities: '' }));
                        }
                      }}
                      disabled={false}
                      showOptionalLabel={false}
                      skipPlaceSelection={true}
                      nodeSlots={nodeSlots}
                      expandFirstLevel={true}
                    />
                  </div>
                </div>

                {/* Right: entity distribution table */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-900">
                    Entity Distributions <span className="text-red-500">*</span>
                  </h3>

                  {errors.entities && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-800">{errors.entities}</p>
                      </div>
                    </div>
                  )}

                  {entityDistributions.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Selected Entities ({entityDistributions.length})
                      </Label>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Entity Name</th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Max</th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Quota</th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 w-16">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {entityDistributions.map((entity, index) => (
                              <tr key={entity.id} className="bg-white hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {entity.entityName || 'Not selected'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {(() => {
                                    const slotMax = nodeSlots[selectedPraksisPlaceId]?.[entity.entityId];
                                    return slotMax !== undefined ? (
                                      <span className="text-sm font-semibold text-orange-600">{slotMax}</span>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {(() => {
                                    const slotMax = nodeSlots[selectedPraksisPlaceId]?.[entity.entityId];
                                    const exceedsMax = slotMax !== undefined && (entity.requestedQuota || 0) > slotMax;
                                    return (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            min="1"
                                            max={slotMax ?? 999}
                                            value={entity.requestedQuota || ''}
                                            onChange={(e) => {
                                              let val = parseInt(e.target.value, 10) || 0;
                                              if (slotMax !== undefined) val = Math.min(val, slotMax);
                                              handleUpdateEntity(entity.id, 'requestedQuota', val);
                                              setErrors((prev) => ({ ...prev, [`entity-quota-${index}`]: '' }));
                                            }}
                                            placeholder="0"
                                            className={cn('w-16 text-center', (errors[`entity-quota-${index}`] || exceedsMax) && 'border-red-500')}
                                          />
                                        </div>
                                        {exceedsMax && <p className="text-xs text-red-600">Max {slotMax}</p>}
                                        {errors[`entity-quota-${index}`] && !exceedsMax && (
                                          <p className="text-xs text-red-600">{errors[`entity-quota-${index}`]}</p>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveEntity(entity.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-purple-900">Total Requested Quota</span>
                          <span className="text-xl font-bold text-purple-600">{getTotalRequestedQuota()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">No entities added yet</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Use the tree on the left to add entities
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 3: Summary & Notes ───────────────────────────────────────── */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-900">Request Summary</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-blue-700">Study</Label>
                      <p className="text-sm font-medium text-blue-900">
                        {placement ? placement.studyName : studies?.find((s) => s.id === selectedStudyId)?.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700">Program</Label>
                      <p className="text-sm font-medium text-blue-900">
                        {placement ? placement.programName : availablePrograms.find((p) => p.id === selectedProgramId)?.name}
                      </p>
                    </div>
                  </div>

                  {emne && (
                    <div>
                      <Label className="text-xs text-blue-700">Emne</Label>
                      <p className="text-sm font-medium text-blue-900">{emne}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-blue-700">Period</Label>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                      {startDate && format(startDate, 'PPP')}
                      <span className="text-blue-600">→</span>
                      {endDate && format(endDate, 'PPP')}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-blue-700">Praksis Place</Label>
                    <p className="text-sm font-medium text-blue-900">
                      {praksisPlaces.find((p) => p.id === selectedPraksisPlaceId)?.name}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-blue-700">Entity Distributions</Label>
                    <div className="space-y-1 mt-1">
                      {entityDistributions.map((entity) => (
                        <div key={entity.id} className="flex items-center justify-between text-sm bg-white rounded px-2 py-1">
                          <span className="text-gray-800">{entity.entityName}</span>
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                            {entity.requestedQuota}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-300">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-blue-700">Total Quota</Label>
                      <span className="text-xl font-bold text-purple-600">{getTotalRequestedQuota()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Notes <span className="text-gray-500 text-xs">(Optional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional information or special requirements..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">{notes.length}/500 characters</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              {currentStep < totalSteps ? (
                <Button type="button" onClick={handleNext} className="flex items-center gap-1">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
                  {editingRequest ? 'Update Request' : 'Submit Request'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
