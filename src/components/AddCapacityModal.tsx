import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from './ui/utils';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  CoordinatorQuotaRequest,
  EntityDistribution,
  PERMANENT_END_DATE,
  deriveRequestApproval,
  getRequestEmner,
} from '../types/coordinatorQuotaRequest';
import { PraksisPlace } from '../types/praksisPlace';
import { OrganizationNode } from '../types/organizationStructure';
import type { Study, StudyProgram } from './SettingsView';

type NewRequest = Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>;
type StepKey = 'emner' | 'quota' | 'summary';

// One praksis place + entity row of an emne, with its quota settings.
// praksisPlaceId/entityId are empty until picked in the row's dropdown.
interface QuotaRow {
  key: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  entityId: string;
  entityName: string;
  quota: number;
  reservationType: 'permanent' | 'deadline';
  deadline?: string;
  requiresApproval: boolean;
}

interface AddCapacityModalProps {
  // 'program': pick one or more emner first; 'emne': quota for a single emne
  mode: 'program' | 'emne';
  study: Study;
  program: StudyProgram;
  emneName?: string;
  praksisPlaces: PraksisPlace[];
  nodeSlots?: Record<string, Record<string, number>>;
  // Saved quota items — an entity (or its parent/child) can't get quota twice for the same emne
  existingRequests: CoordinatorQuotaRequest[];
  currentUserName: string;
  onClose: () => void;
  onSubmit: (requests: NewRequest[]) => void;
  // Edit mode: only the quota step for this single row
  editingRequest?: CoordinatorQuotaRequest;
  onUpdate?: (id: string, updates: Partial<CoordinatorQuotaRequest>) => void;
}

const STEP_LABELS: Record<StepKey, { title: string; description: string }> = {
  emner: {
    title: 'Emner',
    description: 'Select the emner that should receive quota. Each emne gets its own quota.',
  },
  quota: {
    title: 'Praksis places & quota',
    description: 'For each emne, add praksis places and set their quota. A tab turns green when it is complete.',
  },
  summary: {
    title: 'Summary',
    description: 'Review the quota before adding it.',
  },
};

let rowCounter = 0;
const blankRow = (): QuotaRow => ({
  key: `row-${Date.now()}-${rowCounter++}`,
  praksisPlaceId: '',
  praksisPlaceName: '',
  entityId: '',
  entityName: '',
  quota: 0,
  reservationType: 'permanent',
  requiresApproval: false,
});

// Entities below the praksis place root, flattened with their depth
const flattenEntities = (node: OrganizationNode, depth = 0): Array<{ node: OrganizationNode; depth: number }> =>
  node.children.flatMap((child) => [{ node: child, depth }, ...flattenEntities(child, depth + 1)]);

// True when the node or anything below it contains the search text
const subtreeMatches = (node: OrganizationNode, query: string): boolean =>
  node.name.toLowerCase().includes(query) || node.children.some((c) => subtreeMatches(c, query));

// Name with the matched part in bold
const highlight = (name: string, query: string) => {
  const i = query ? name.toLowerCase().indexOf(query) : -1;
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <span className="font-semibold text-gray-900">{name.slice(i, i + query.length)}</span>
      {name.slice(i + query.length)}
    </>
  );
};

const rowFromRequest = (request: CoordinatorQuotaRequest): QuotaRow => {
  const entity = request.entityDistributions?.[0];
  return {
    key: entity?.id ?? request.id,
    praksisPlaceId: request.praksisPlaceId,
    praksisPlaceName: request.praksisPlaceName,
    entityId: entity?.entityId ?? request.departmentId,
    entityName: entity?.entityName ?? request.departmentName,
    quota: entity?.requestedQuota ?? request.requestedCapacity,
    reservationType: entity?.reservationType ?? 'permanent',
    deadline: entity?.deadline,
    requiresApproval: entity?.requiresApproval ?? true,
  };
};

export function AddCapacityModal({
  mode,
  study,
  program,
  emneName,
  praksisPlaces,
  nodeSlots = {},
  existingRequests,
  currentUserName,
  onClose,
  onSubmit,
  editingRequest,
  onUpdate,
}: AddCapacityModalProps) {
  const editingEmne = editingRequest ? getRequestEmner(editingRequest)[0] ?? '' : '';
  // Editing one row saves directly; adding ends with a summary
  const steps: StepKey[] = editingRequest
    ? ['quota']
    : mode === 'program'
      ? ['emner', 'quota', 'summary']
      : ['quota', 'summary'];

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedEmner, setSelectedEmner] = useState<string[]>(
    editingRequest ? [editingEmne] : emneName ? [emneName] : []
  );
  // Rows are kept per emne — each emne has its own praksis places and quota
  // An emne starts with one blank row so the user can pick a praksis place right away
  const [rowsByEmne, setRowsByEmne] = useState<Record<string, QuotaRow[]>>(
    editingRequest
      ? { [editingEmne]: [rowFromRequest(editingRequest)] }
      : emneName
        ? { [emneName]: [blankRow()] }
        : {}
  );
  const [activeEmne, setActiveEmne] = useState<string>(editingEmne || emneName || '');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notes, setNotes] = useState('');
  // Entity search per praksis place inside the open row dropdown
  const [entitySearch, setEntitySearch] = useState<Record<string, string>>({});

  const step = steps[stepIndex];
  const programEmner = program.emner ?? [];
  const activeRows = rowsByEmne[activeEmne] ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slotMax = (row: QuotaRow) => nodeSlots[row.praksisPlaceId]?.[row.entityId];

  // Entities with quota for an emne at a praksis place: saved items + rows added in this dialog
  const takenEntityIds = (emne: string, placeId: string, exceptRowKey?: string): string[] => [
    ...existingRequests
      .filter(
        (r) =>
          r.id !== editingRequest?.id &&
          r.programId === program.id &&
          r.praksisPlaceId === placeId &&
          getRequestEmner(r).includes(emne),
      )
      .flatMap((r) => (r.entityDistributions?.length ? r.entityDistributions.map((e) => e.entityId) : [r.departmentId])),
    ...(rowsByEmne[emne] ?? [])
      .filter((r) => r.key !== exceptRowKey && r.praksisPlaceId === placeId && r.entityId)
      .map((r) => r.entityId),
  ];

  // Ids from the praksis place root down to the entity (inclusive), or [] if not found
  const pathToEntity = (placeId: string, entityId: string): string[] => {
    const root = praksisPlaces.find((p) => p.id === placeId)?.organizationStructure;
    const walk = (node: NonNullable<typeof root>, path: string[]): string[] | null => {
      const next = [...path, node.id];
      if (node.id === entityId) return next;
      for (const child of node.children) {
        const found = walk(child, next);
        if (found) return found;
      }
      return null;
    };
    return root ? walk(root, []) ?? [] : [];
  };

  // Same entity, or one is a parent/child of the other
  const overlaps = (placeId: string, a: string, b: string) =>
    a === b || pathToEntity(placeId, a).includes(b) || pathToEntity(placeId, b).includes(a);

  // What is still missing on a row, or null when the row is complete
  const rowProblem = (row: QuotaRow): { entity?: string; quota?: string; deadline?: string } | null => {
    const problem: { entity?: string; quota?: string; deadline?: string } = {};
    if (!row.entityId) problem.entity = 'Select a praksis place and entity';
    const max = slotMax(row);
    if (!row.quota || row.quota <= 0) problem.quota = 'Set a quota above 0';
    else if (max !== undefined && row.quota > max) problem.quota = `Max ${max}`;
    if (row.reservationType === 'deadline') {
      if (!row.deadline) problem.deadline = 'Select a deadline';
      else if (new Date(row.deadline) <= today) problem.deadline = 'Deadline must be in the future';
    }
    return problem.entity || problem.quota || problem.deadline ? problem : null;
  };

  // An emne is complete when it has at least one praksis place and every row is set
  const emneComplete = (emne: string) => {
    const rows = rowsByEmne[emne] ?? [];
    return rows.length > 0 && rows.every((r) => !rowProblem(r));
  };
  const allComplete = selectedEmner.length > 0 && selectedEmner.every(emneComplete);
  const totalItems = selectedEmner.reduce(
    (sum, e) => sum + (rowsByEmne[e] ?? []).filter((r) => r.entityId).length,
    0,
  );

  const updateRow = (key: string, patch: Partial<QuotaRow>) =>
    setRowsByEmne((prev) => ({
      ...prev,
      [activeEmne]: (prev[activeEmne] ?? []).map((r) => (r.key === key ? { ...r, ...patch } : r)),
    }));

  const removeRow = (key: string) =>
    setRowsByEmne((prev) => ({
      ...prev,
      [activeEmne]: (prev[activeEmne] ?? []).filter((r) => r.key !== key),
    }));

  const addBlankRow = () =>
    setRowsByEmne((prev) => ({ ...prev, [activeEmne]: [...(prev[activeEmne] ?? []), blankRow()] }));

  // Give an emne one blank row when it has none yet
  const ensureRow = (emne: string) =>
    setRowsByEmne((prev) => ((prev[emne] ?? []).length > 0 ? prev : { ...prev, [emne]: [blankRow()] }));

  // Copy the active emne's rows (with settings) to every other selected emne,
  // skipping rows whose entity (or a parent/child of it) already has quota there
  const copyToOtherEmner = () => {
    const source = rowsByEmne[activeEmne] ?? [];
    const next = { ...rowsByEmne };
    let copied = 0;
    let skipped = 0;
    selectedEmner
      .filter((e) => e !== activeEmne)
      .forEach((e) => {
        const target = (next[e] ?? []).filter((t) => t.entityId);
        const hadBlank = (next[e] ?? []).length !== target.length;
        source.filter((row) => row.entityId).forEach((row) => {
          const taken = [
            ...takenEntityIds(e, row.praksisPlaceId),
            ...target.filter((t) => t.praksisPlaceId === row.praksisPlaceId).map((t) => t.entityId),
          ];
          if (taken.some((id) => overlaps(row.praksisPlaceId, id, row.entityId))) {
            skipped += 1;
          } else {
            target.push({ ...row });
            copied += 1;
          }
        });
        next[e] = target.length > 0 || !hadBlank ? target : next[e] ?? [];
      });
    setRowsByEmne(next);
    setNotice(
      skipped > 0
        ? `Copied ${copied} row${copied === 1 ? '' : 's'}. Skipped ${skipped} that already have quota (or a parent/child with quota) in the other emne.`
        : `Copied ${copied} row${copied === 1 ? '' : 's'} to the other emner.`
    );
  };

  const switchEmne = (emne: string) => {
    setActiveEmne(emne);
    ensureRow(emne);
    setNotice('');
  };

  const handleNext = () => {
    if (step === 'emner' && selectedEmner.length === 0) {
      setError('Select at least one emne');
      return;
    }
    if (step === 'quota' && !allComplete) return;
    setError('');
    if (step === 'emner') {
      const first = selectedEmner.includes(activeEmne) ? activeEmne : selectedEmner[0] ?? '';
      setActiveEmne(first);
      ensureRow(first);
    }
    setStepIndex((i) => i + 1);
  };

  const buildEntity = (row: QuotaRow, id: string): EntityDistribution => ({
    id,
    entityId: row.entityId,
    entityName: row.entityName,
    requestedQuota: row.quota,
    reservationType: row.reservationType,
    deadline: row.reservationType === 'deadline' ? row.deadline : undefined,
    requiresApproval: row.requiresApproval,
    // Entities that don't need praksis-place approval are reserved immediately
    ...(row.requiresApproval
      ? { status: 'pending' as const, approvedQuota: undefined }
      : { status: 'approved' as const, approvedQuota: row.quota }),
  });

  const endDateFor = (row: QuotaRow) =>
    row.reservationType === 'deadline' && row.deadline ? row.deadline : PERMANENT_END_DATE;

  const handleSubmit = () => {
    if (!allComplete) return;

    if (editingRequest) {
      const row = rowsByEmne[editingEmne][0];
      const original = editingRequest.entityDistributions?.[0];
      let entity = buildEntity(row, original?.id ?? `entity-${Date.now()}`);
      // Keep the praksis place's decision when quota and approval setting are unchanged
      const decisionStillValid =
        row.requiresApproval &&
        original?.status &&
        original.status !== 'pending' &&
        original.requiresApproval !== false &&
        original.requestedQuota === row.quota;
      if (decisionStillValid) {
        entity = { ...entity, status: original!.status, approvedQuota: original!.approvedQuota };
      }
      const { status, approvedCapacity } = deriveRequestApproval([entity]);
      onUpdate?.(editingRequest.id, {
        entityDistributions: [entity],
        requestedCapacity: row.quota,
        endDate: endDateFor(row),
        status,
        approvedCapacity,
      });
      onClose();
      return;
    }

    const startDate = format(new Date(), 'yyyy-MM-dd');
    const stamp = Date.now();
    // One request per emne × praksis place/entity
    const requests: NewRequest[] = selectedEmner.flatMap((emne, ei) =>
      (rowsByEmne[emne] ?? []).map((row, ri) => ({
        placementId: '',
        praksisPlaceId: row.praksisPlaceId,
        praksisPlaceName: row.praksisPlaceName,
        entityDistributions: [buildEntity(row, `entity-${stamp}-${ei}-${ri}`)],
        departmentId: row.entityId,
        departmentName: row.entityName,
        universityId: study.universityId,
        universityName: study.universityName,
        studyId: study.id,
        studyName: study.name,
        programId: program.id,
        programName: program.name,
        emne,
        emner: [emne],
        requestedCapacity: row.quota,
        startDate,
        endDate: endDateFor(row),
        requestedBy: currentUserName,
        notes: notes.trim() || undefined,
      }))
    );
    onSubmit(requests);
    onClose();
  };

  const isLastStep = stepIndex === steps.length - 1;

  // ── Praksis place / entity dropdown of a row (cascading, like the page filter) ──
  const renderEntityPicker = (row: QuotaRow, invalid: boolean) => (
    <DropdownMenu onOpenChange={(open) => !open && setEntitySearch({})}>
      <DropdownMenuTrigger asChild disabled={!!editingRequest}>
        <button
          type="button"
          className={cn(
            'flex w-full min-w-[220px] items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-1.5 text-left text-sm disabled:cursor-default disabled:opacity-100',
            invalid ? 'border-red-500' : 'border-input'
          )}
        >
          {row.entityId ? (
            <span className="min-w-0">
              <span className="block truncate font-medium text-gray-900">{row.entityName}</span>
              <span className="block truncate text-xs text-gray-500">{row.praksisPlaceName}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select praksis place / entity</span>
          )}
          {!editingRequest && <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        {praksisPlaces.map((place) => {
          const allEntities = place.organizationStructure ? flattenEntities(place.organizationStructure) : [];
          const query = (entitySearch[place.id] ?? '').trim().toLowerCase();
          // While searching, keep matching entities plus their parents (for context)
          const entities = query ? allEntities.filter(({ node }) => subtreeMatches(node, query)) : allEntities;
          // Entities with quota for this emne elsewhere — they, their parents and children are unavailable
          const taken = takenEntityIds(activeEmne, place.id, row.key);
          return (
            <DropdownMenuSub key={place.id}>
              <DropdownMenuSubTrigger className={row.praksisPlaceId === place.id ? 'font-medium text-blue-600' : ''}>
                {place.name}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[280px] p-0">
                {allEntities.length > 0 && (
                  // Keys typed here must not reach the menu's type-ahead navigation
                  <div
                    className="sticky top-0 z-10 bg-popover p-2 border-b border-gray-100"
                    onKeyDown={(e) => {
                      if (e.key !== 'Escape') e.stopPropagation();
                    }}
                  >
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        value={entitySearch[place.id] ?? ''}
                        onChange={(e) => setEntitySearch((prev) => ({ ...prev, [place.id]: e.target.value }))}
                        placeholder={`Search in ${place.name}`}
                        className="h-8 pl-8 text-sm"
                      />
                    </div>
                  </div>
                )}
                <div className="max-h-[320px] overflow-y-auto p-1">
                {allEntities.length === 0 && (
                  <DropdownMenuItem disabled>No entities defined</DropdownMenuItem>
                )}
                {allEntities.length > 0 && entities.length === 0 && (
                  <div className="px-2 py-3 text-sm text-gray-500 text-center">No entities match "{entitySearch[place.id]}"</div>
                )}
                {entities.map(({ node, depth }) => {
                  const unavailable = taken.some((id) => overlaps(place.id, id, node.id));
                  const selected = row.praksisPlaceId === place.id && row.entityId === node.id;
                  // Shown only because something below it matches
                  const contextOnly = !!query && !node.name.toLowerCase().includes(query);
                  return (
                    <DropdownMenuItem
                      key={node.id}
                      disabled={unavailable}
                      onSelect={() =>
                        updateRow(row.key, {
                          praksisPlaceId: place.id,
                          praksisPlaceName: place.name,
                          entityId: node.id,
                          entityName: node.name,
                        })
                      }
                      className="gap-2"
                      style={{ paddingLeft: `${8 + depth * 16}px` }}
                      title={unavailable ? `${node.name} (or a parent/child) already has quota for ${activeEmne}` : undefined}
                    >
                      <Check className={cn('h-4 w-4 flex-shrink-0', selected ? 'opacity-100 text-blue-600' : 'opacity-0')} />
                      <span className={cn('truncate', contextOnly && 'text-gray-400')}>{highlight(node.name, query)}</span>
                    </DropdownMenuItem>
                  );
                })}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ── Quota rows of the active emne ───────────────────────────────────
  const renderRows = () => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Praksis place / Entity</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
              Quota <span className="text-red-500">*</span>
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Reservation</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Approval by praksis place</th>
            {!editingRequest && <th className="w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {activeRows.map((row) => {
            const problem = rowProblem(row);
            const max = slotMax(row);
            return (
              <tr key={`${activeEmne}-${row.key}`} className="bg-white align-top">
                <td className="px-4 py-3">
                  {renderEntityPicker(row, !!problem?.entity)}
                  {problem?.entity && <p className="text-xs text-red-600 mt-1">{problem.entity}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={max ?? 999}
                      value={row.quota}
                      onChange={(e) => updateRow(row.key, { quota: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className={cn('w-20 text-center', problem?.quota && 'border-red-500')}
                    />
                    {max !== undefined && <span className="text-xs text-gray-400">max {max}</span>}
                  </div>
                  {problem?.quota && <p className="text-xs text-red-600 mt-1">{problem.quota}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <div className="inline-flex rounded-md border border-gray-200 p-0.5 bg-gray-50">
                      {(['permanent', 'deadline'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateRow(row.key, { reservationType: type })}
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded transition-colors',
                            row.reservationType === type
                              ? 'bg-white text-purple-700 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          )}
                        >
                          {type === 'permanent' ? 'Permanent' : 'Until deadline'}
                        </button>
                      ))}
                    </div>
                    {row.reservationType === 'deadline' && (
                      <div className="space-y-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !row.deadline && 'text-muted-foreground',
                                problem?.deadline && 'border-red-500'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {row.deadline ? format(new Date(row.deadline), 'PPP') : <span>Pick a deadline</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={row.deadline ? new Date(row.deadline) : undefined}
                              onSelect={(date: Date | undefined) =>
                                updateRow(row.key, { deadline: date ? format(date, 'yyyy-MM-dd') : undefined })
                              }
                              disabled={(date: Date) => date <= today}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {problem?.deadline && <p className="text-xs text-red-600">{problem.deadline}</p>}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <Switch
                      checked={row.requiresApproval}
                      onCheckedChange={(checked: boolean) => updateRow(row.key, { requiresApproval: checked })}
                    />
                    {row.requiresApproval ? 'Required' : 'Not required'}
                  </label>
                  {!row.requiresApproval && (
                    <p className="text-xs text-gray-500 mt-1">Reserved immediately without approval</p>
                  )}
                </td>
                {!editingRequest && (
                  <td className="px-2 py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(row.key)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRequest ? 'Edit quota' : 'Add quota'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {study.name} / {program.name}
              {(editingRequest?.emne ?? emneName) && ` / ${editingRequest?.emne ?? emneName}`}
            </span>
          </DialogTitle>
          <DialogDescription>{STEP_LABELS[step].description}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        {steps.length > 1 && (
          <div className="flex items-center justify-center gap-2 py-2">
            {steps.map((key, i) => (
              <div key={key} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                      i === stepIndex && 'bg-purple-600 text-white',
                      i < stepIndex && 'bg-green-600 text-white',
                      i > stepIndex && 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {i + 1}
                  </div>
                  <span className={cn('text-sm', i === stepIndex ? 'font-medium text-gray-900' : 'text-gray-500')}>
                    {STEP_LABELS[key].title}
                  </span>
                </div>
                {i < steps.length - 1 && <div className="w-10 h-px bg-gray-300 mx-3" />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="py-2">
          {/* ── Emner (program mode) ─────────────────────────────────── */}
          {step === 'emner' && (
            <div className="space-y-2">
              <Label>Emner in {program.name}</Label>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {programEmner.map((e) => (
                  <label key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50">
                    <Checkbox
                      checked={selectedEmner.includes(e.name)}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        setSelectedEmner((prev) =>
                          checked === true ? [...prev, e.name] : prev.filter((n) => n !== e.name)
                        );
                        setError('');
                      }}
                    />
                    {e.name}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">{selectedEmner.length} selected</p>
            </div>
          )}

          {/* ── Praksis places & quota: one tab per emne ─────────────── */}
          {step === 'quota' && (
            <div className="space-y-4">
              {/* Emne tabs — green when complete, red while something is missing */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                {selectedEmner.map((emne) => {
                  const complete = emneComplete(emne);
                  const count = rowsByEmne[emne]?.length ?? 0;
                  return (
                    <button
                      key={emne}
                      type="button"
                      onClick={() => switchEmne(emne)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors',
                        complete
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : 'border-red-300 bg-red-50 text-red-700',
                        emne === activeEmne && (complete ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500')
                      )}
                    >
                      {complete ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {emne}
                      <span className="text-xs font-normal opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>

              <>
                {activeRows.length > 0 ? (
                  renderRows()
                ) : (
                  <p className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-6 text-center">
                    No praksis places added for {activeEmne}
                  </p>
                )}
                {/* The add action always sits under the list, empty or not */}
                {!editingRequest && (
                        <div className="flex items-center justify-between">
                          <Button type="button" variant="outline" onClick={addBlankRow} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add praksis place
                          </Button>
                          {selectedEmner.length > 1 && activeRows.some((r) => r.entityId) && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={copyToOtherEmner}
                              className="gap-2 text-gray-600"
                              title="Adds these praksis places and settings to the other emner"
                            >
                              <Copy className="h-4 w-4" />
                              Copy to other emner
                            </Button>
                          )}
                        </div>
                      )}
                {notice && <p className="text-xs text-gray-600">{notice}</p>}
              </>
            </div>
          )}

          {/* ── Summary ─────────────────────────────────────────────── */}
          {step === 'summary' && (() => {
            const allRows = selectedEmner.flatMap((e) => rowsByEmne[e] ?? []);
            const totalQuota = allRows.reduce((sum, r) => sum + r.quota, 0);
            const reserved = allRows.filter((r) => !r.requiresApproval).length;
            const awaiting = allRows.length - reserved;
            return (
              <div className="space-y-4">
                {/* Totals */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Quota items', value: allRows.length, className: 'text-gray-900' },
                    { label: 'Total places', value: totalQuota, className: 'text-purple-600' },
                    { label: 'Reserved immediately', value: reserved, className: 'text-green-600' },
                    { label: 'Awaiting approval', value: awaiting, className: 'text-yellow-600' },
                  ].map((t) => (
                    <div key={t.label} className="border border-gray-200 rounded-lg px-4 py-3">
                      <div className={cn('text-2xl font-bold', t.className)}>{t.value}</div>
                      <div className="text-xs text-gray-500">{t.label}</div>
                    </div>
                  ))}
                </div>

                {/* One section per emne */}
                {selectedEmner.map((emne) => {
                  const rows = rowsByEmne[emne] ?? [];
                  return (
                    <div key={emne} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">{emne}</span>
                        <span className="text-xs text-gray-500">
                          {rows.length} item{rows.length === 1 ? '' : 's'} · {rows.reduce((s2, r) => s2 + r.quota, 0)} places
                        </span>
                      </div>
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-100">
                          {rows.map((row) => (
                            <tr key={row.key} className="text-sm">
                              <td className="px-4 py-2">
                                <div className="font-medium text-gray-900">{row.entityName}</div>
                                <div className="text-xs text-gray-500">{row.praksisPlaceName}</div>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className="font-bold text-purple-600">{row.quota}</span>
                                <span className="text-xs text-gray-500"> places</span>
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                {row.reservationType === 'deadline' && row.deadline
                                  ? `Until ${format(new Date(row.deadline), 'PPP')}`
                                  : 'Permanent'}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                                    row.requiresApproval
                                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                      : 'bg-green-50 text-green-700 border-green-200'
                                  )}
                                >
                                  {row.requiresApproval ? 'Awaiting approval' : 'Reserved immediately'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                {/* Optional notes, saved on every quota item */}
                <div className="space-y-2">
                  <Label htmlFor="capacity-notes">
                    Notes <span className="text-gray-500 text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    id="capacity-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional information for the praksis places..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">{notes.length}/500 characters</p>
                </div>
              </div>
            );
          })()}
        </div>

        <DialogFooter className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-3">
            {stepIndex > 0 && (
              <Button type="button" variant="outline" onClick={() => setStepIndex((i) => i - 1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {step === 'quota' && !allComplete && (
              <span className="text-xs text-red-600">
                Every emne needs at least one praksis place with a quota
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!allComplete}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {editingRequest ? 'Save' : `Add ${totalItems} quota item${totalItems === 1 ? '' : 's'}`}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={step === 'quota' && !allComplete}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
