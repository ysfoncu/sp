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
} from 'lucide-react';
import { CoordinatorQuotaRequest, EntityDistribution } from '../types/coordinatorQuotaRequest';
import { PraksisPlace } from '../types/praksisPlace';
import { format } from 'date-fns';
import { HierarchicalOrganizationSelector } from './HierarchicalOrganizationSelector';

// Study type for compatibility with CoordinatorQuotasView
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
  // Legacy prop names for backward compatibility
  onSave?: (request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => void;
  // Edit mode
  editingRequest?: CoordinatorQuotaRequest;
  onUpdate?: (requestId: string, updates: Partial<CoordinatorQuotaRequest>) => void;
}

export function RequestQuotaModal({
  isOpen,
  onClose,
  onSubmit,
  placement,
  existingQuotas: _existingQuotas,
  praksisPlaces,
  currentUserName,
  existingRequests: _existingRequests,
  studies,
  onSave,
  editingRequest,
  onUpdate,
}: RequestQuotaModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedPraksisPlaceId, setSelectedPraksisPlaceId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for study/program selection when no placement is provided
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [emne, setEmne] = useState<string>('');

  // NEW: Entity distributions state
  const [entityDistributions, setEntityDistributions] = useState<EntityDistribution[]>([]);

  // Ref for scrolling to bottom
  const dialogContentRef = useRef<HTMLDivElement>(null);

  // Total number of steps is always 3
  const totalSteps = 3;

  // Reset form when modal opens/closes
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
      // Auto-populate dates from placement if available
      if (placement?.startDate && placement?.endDate) {
        setStartDate(new Date(placement.startDate));
        setEndDate(new Date(placement.endDate));
      }
      // If editing a request, populate fields with existing data
      if (editingRequest) {
        setSelectedPraksisPlaceId(editingRequest.praksisPlaceId);
        setStartDate(new Date(editingRequest.startDate));
        setEndDate(new Date(editingRequest.endDate));
        setNotes(editingRequest.notes || '');
        // If placement is not provided, populate study and program
        if (!placement) {
          setSelectedStudyId(editingRequest.studyId);
          setSelectedProgramId(editingRequest.programId);
          setEmne(editingRequest.emne || '');
        }
        // Load entity distributions if available, otherwise create from legacy fields
        if (editingRequest.entityDistributions && editingRequest.entityDistributions.length > 0) {
          setEntityDistributions(editingRequest.entityDistributions);
        } else if (editingRequest.departmentId && editingRequest.departmentName) {
          // Create a single distribution from legacy fields
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

  // Get available programs for selected study
  const availablePrograms =
    studies?.find((s) => s.id === selectedStudyId)?.programs || [];

  // Remove entity distribution
  const handleRemoveEntity = (id: string) => {
    setEntityDistributions(entityDistributions.filter((e) => e.id !== id));
  };

  // Update entity distribution
  const handleUpdateEntity = (id: string, field: keyof EntityDistribution, value: any) => {
    setEntityDistributions(
      entityDistributions.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      )
    );
  };

  // Calculate total requested quota
  const getTotalRequestedQuota = () => {
    return entityDistributions.reduce((sum, e) => sum + (e.requestedQuota || 0), 0);
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Step 1: Study/Program selection + Dates
      if (!placement) {
        if (!selectedStudyId) {
          newErrors.study = 'Please select a study';
        }
        if (!selectedProgramId) {
          newErrors.program = 'Please select a program';
        }
      }
      if (!startDate) {
        newErrors.startDate = 'Please select a start date';
      }
      if (!endDate) {
        newErrors.endDate = 'Please select an end date';
      }
      if (startDate && endDate && endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (step === 2) {
      // Step 2: Praksis Place and Entity distributions
      if (!selectedPraksisPlaceId) {
        newErrors.praksisPlace = 'Please select a praksis place';
      }
      if (entityDistributions.length === 0) {
        newErrors.entities = 'Please add at least one entity distribution';
      } else {
        // Validate each entity distribution
        let hasInvalidEntity = false;
        entityDistributions.forEach((entity, index) => {
          if (!entity.entityId || !entity.entityName) {
            newErrors[`entity-${index}`] = 'Please select an entity';
            hasInvalidEntity = true;
          }
          if (!entity.requestedQuota || entity.requestedQuota <= 0) {
            newErrors[`entity-quota-${index}`] = 'Quota must be greater than 0';
            hasInvalidEntity = true;
          }
        });
        if (hasInvalidEntity) {
          newErrors.entities = 'Please fix entity distribution errors';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  // Handle back step
  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validateStep(2)) {
      return;
    }

    const selectedPlace = praksisPlaces.find(
      (p) => p.id === selectedPraksisPlaceId
    );

    if (!selectedPlace || !startDate || !endDate) {
      return;
    }

    // Get study and program info
    let studyId, studyName, programId, programName, universityId, universityName;
    
    if (placement) {
      studyId = placement.studyId;
      studyName = placement.studyName;
      programId = placement.programId;
      programName = placement.programName;
      universityId = placement.universityId;
      universityName = placement.universityName;
    } else {
      const selectedStudy = studies?.find((s) => s.id === selectedStudyId);
      const selectedProgram = selectedStudy?.programs.find((p) => p.id === selectedProgramId);
      studyId = selectedStudyId;
      studyName = selectedStudy?.name || '';
      programId = selectedProgramId;
      programName = selectedProgram?.name || '';
      universityId = 'U1'; // Oslo University
      universityName = 'Oslo University';
    }

    // Calculate total requested capacity
    const totalRequestedCapacity = getTotalRequestedQuota();

    // For backward compatibility, use the first entity or create a default entry
    const firstEntity = entityDistributions[0] || {
      entityId: '',
      entityName: 'Multiple entities',
      requestedQuota: totalRequestedCapacity,
    };

    const request: Omit<
      CoordinatorQuotaRequest,
      'id' | 'requestedDate' | 'status'
    > = {
      placementId: placement?.id ?? '',
      praksisPlaceId: selectedPlace.id,
      praksisPlaceName: selectedPlace.name,
      // Entity distributions (NEW)
      entityDistributions: entityDistributions,
      // Legacy fields for backward compatibility
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

  // Get step title and description
  const getStepInfo = () => {
    if (currentStep === 1) {
      return {
        title: 'Step 1: Select Study, Program & Period',
        description: 'Choose the study, program, and time period for this quota request',
      };
    }
    if (currentStep === 2) {
      return {
        title: 'Step 2: Select Praksis Place & Entities',
        description: 'Choose the praksis place and distribute quota across entities',
      };
    }
    return {
      title: 'Step 3: Summary & Notes',
      description: 'Review your request and add any additional notes',
    };
  };

  const stepInfo = getStepInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <div ref={dialogContentRef}>
          <DialogHeader>
            <DialogTitle>{editingRequest ? 'Edit Quota Request' : 'Request Quota'}</DialogTitle>
            <DialogDescription>
              {stepInfo.description}
            </DialogDescription>
          </DialogHeader>

          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            {Array.from({ length: totalSteps }, (_, i) => {
              const stepNum = i + 1;
              const isActive = currentStep === stepNum;
              const isCompleted = currentStep > stepNum;
              return (
                <div key={i} className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                      isActive && 'bg-purple-600 text-white',
                      isCompleted && 'bg-green-600 text-white',
                      !isActive && !isCompleted && 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {stepNum}
                  </div>
                  {i < totalSteps - 1 && (
                    <div
                      className={cn(
                        'w-12 h-1 mx-1 transition-colors',
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-6 py-4">
            {/* Request Context - show if placement exists */}
            {placement && currentStep === 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-sm text-blue-900">
                      Request Context
                    </h3>
                    <div className="text-sm text-blue-800 space-y-0.5">
                      <div>
                        <span className="font-medium">University:</span>{' '}
                        {placement.universityName}
                      </div>
                      <div>
                        <span className="font-medium">Study:</span>{' '}
                        {placement.studyName}
                      </div>
                      <div>
                        <span className="font-medium">Program:</span>{' '}
                        {placement.programName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Study/Program Selection + Dates */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {!placement && studies && (
                  <>
                    <h3 className="font-semibold text-sm text-gray-900">
                      Academic Information
                    </h3>
                    
                    {/* Study Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="study">
                        Study <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedStudyId}
                        onValueChange={(value: string) => {
                          setSelectedStudyId(value);
                          setSelectedProgramId('');
                          setErrors((prev) => ({ ...prev, study: '' }));
                        }}
                      >
                        <SelectTrigger
                          id="study"
                          className={cn(errors.study && 'border-red-500')}
                        >
                          <SelectValue placeholder="Select study" />
                        </SelectTrigger>
                        <SelectContent>
                          {studies.map((study) => (
                            <SelectItem key={study.id} value={study.id}>
                              {study.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.study && (
                        <p className="text-sm text-red-600">{errors.study}</p>
                      )}
                    </div>

                    {/* Program Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="program">
                        Program <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedProgramId}
                        onValueChange={(value: string) => {
                          setSelectedProgramId(value);
                          setErrors((prev) => ({ ...prev, program: '' }));
                        }}
                        disabled={!selectedStudyId}
                      >
                        <SelectTrigger
                          id="program"
                          className={cn(errors.program && 'border-red-500')}
                        >
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrograms.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.program && (
                        <p className="text-sm text-red-600">{errors.program}</p>
                      )}
                    </div>

                    {/* Emne (Course/Subject) */}
                    <div className="space-y-2">
                      <Label htmlFor="emne">
                        Emne <span className="text-gray-500 text-xs">(Optional)</span>
                      </Label>
                      <Input
                        id="emne"
                        type="text"
                        value={emne}
                        onChange={(e) => setEmne(e.target.value)}
                        placeholder="Enter course or subject name"
                        maxLength={100}
                      />
                    </div>
                  </>
                )}

                <h3 className="font-semibold text-sm text-gray-900 pt-2">
                  Placement Period
                </h3>

                {/* Period - Start Date & End Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Start Date <span className="text-red-500">*</span>
                    </Label>
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
                          {startDate ? (
                            format(startDate, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date: Date | undefined) => {
                            setStartDate(date);
                            setErrors((prev) => ({ ...prev, startDate: '' }));
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                      <p className="text-sm text-red-600">{errors.startDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      End Date <span className="text-red-500">*</span>
                    </Label>
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
                          {endDate ? (
                            format(endDate, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date: Date | undefined) => {
                            setEndDate(date);
                            setErrors((prev) => ({ ...prev, endDate: '' }));
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-sm text-red-600">{errors.endDate}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Praksis Place & Entity Distributions */}
            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-6 items-start">

                {/* Left column: Praksis Place selector + hierarchy tree */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-gray-900">
                    Praksis Place
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="praksisPlace">
                      Praksis Place <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedPraksisPlaceId}
                      onValueChange={(value: string) => {
                        setSelectedPraksisPlaceId(value);
                        setEntityDistributions([]);
                        setErrors((prev) => ({ ...prev, praksisPlace: '' }));
                      }}
                    >
                      <SelectTrigger
                        id="praksisPlace"
                        className={cn(errors.praksisPlace && 'border-red-500')}
                      >
                        <SelectValue placeholder="Select praksis place" />
                      </SelectTrigger>
                      <SelectContent>
                        {praksisPlaces.map((place) => (
                          <SelectItem key={place.id} value={place.id}>
                            {place.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.praksisPlace && (
                      <p className="text-sm text-red-600">{errors.praksisPlace}</p>
                    )}
                  </div>

                  {selectedPraksisPlaceId && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Add Entity to Distribution
                      </Label>
                      <HierarchicalOrganizationSelector
                        praksisPlaces={praksisPlaces}
                        selectedPraksisPlaceId={selectedPraksisPlaceId}
                        selectedOrganizationNodeId={null}
                        onPraksisPlaceSelect={() => {}}
                        onOrganizationNodeSelect={() => {}}
                        addedEntityIds={entityDistributions.map((e) => e.entityId)}
                        onAddEntity={(nodeId, nodeName, quantity) => {
                          const exists = entityDistributions.some(e => e.entityId === nodeId);
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
                      />
                    </div>
                  )}
                </div>

                {/* Right column: Entity Distributions table */}
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
                                  <div className="flex justify-center">
                                    <Input
                                      type="number"
                                      min="1"
                                      max="999"
                                      value={entity.requestedQuota || ''}
                                      onChange={(e) => {
                                        handleUpdateEntity(entity.id, 'requestedQuota', parseInt(e.target.value, 10) || 0);
                                        setErrors((prev) => ({ ...prev, [`entity-quota-${index}`]: '' }));
                                      }}
                                      placeholder="0"
                                      className={cn("w-20 text-center", errors[`entity-quota-${index}`] && 'border-red-500')}
                                    />
                                  </div>
                                  {errors[`entity-quota-${index}`] && (
                                    <p className="text-xs text-red-600 mt-1">{errors[`entity-quota-${index}`]}</p>
                                  )}
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
                          <span className="text-sm font-semibold text-purple-900">
                            Total Requested Quota
                          </span>
                          <span className="text-xl font-bold text-purple-600">
                            {getTotalRequestedQuota()}
                          </span>
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
                            Select a praksis place and use the tree to add entities
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Step 3: Summary & Notes */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-900">
                  Request Summary
                </h3>

                {/* Summary Card */}
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
                      <span className="text-xl font-bold text-purple-600">
                        {getTotalRequestedQuota()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
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
                  <p className="text-xs text-gray-500">
                    {notes.length}/500 characters
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Navigation */}
          <DialogFooter className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-purple-600 hover:bg-purple-700"
                >
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