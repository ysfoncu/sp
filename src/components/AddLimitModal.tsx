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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from './ui/utils';
import { AlertOctagon, Check, ChevronDown, CornerLeftUp, Lock, Minus, Trash2 } from 'lucide-react';
import { PraksisPlace } from '../types/praksisPlace';
import { LimitEmneShare, PraksisPlaceLimit, isValidMonthDay } from '../types/praksisLimit';
import { limitBounds, limitPeriodLabel, limitsBelow, parentLimitOf, samePeriod, validateLimit } from '../types/limitUsage';
import { Study, StudyEmne, StudyProgram } from './SettingsView';

// The limit being entered in the dialog
interface LimitForm {
  limit: number;
  limitType: 'yearly' | 'semester';
  periodStart: string;
  periodEnd: string;
  // Selected emner (by emneKey), in the order they were picked, with each one's share of the limit
  shares: Record<string, number>;
}

const emneKey = (programId: string, emneId: string) => `${programId}::${emneId}`;

// Keep a single selected emne in sync with the limit, so there is nothing to distribute by hand
const withAutoShare = (form: LimitForm): LimitForm => {
  const keys = Object.keys(form.shares);
  return keys.length === 1 ? { ...form, shares: { [keys[0]]: form.limit } } : form;
};

interface AddLimitModalProps {
  // The praksis place and the entity the limit is for (an entity has at most one limit)
  place?: PraksisPlace;
  entity: { id: string; name: string };
  // Saved limits — used for the nesting rules (range, room left, period)
  existingLimits: PraksisPlaceLimit[];
  // Opened from a placement: the emne list can't be changed
  fixedEmne?: { programId: string; emneId: string };
  // Studies → programs → emner that can be given a share of a limit
  studies: Study[];
  onClose: () => void;
  // The limit, plus the limits below it when a changed type/period is applied to them
  onSave: (limits: PraksisPlaceLimit[]) => void;
  // When set, the dialog edits this limit
  editingLimit?: PraksisPlaceLimit;
}

export function AddLimitModal({
  place,
  entity,
  existingLimits,
  fixedEmne,
  studies,
  onClose,
  onSave,
  editingLimit,
}: AddLimitModalProps) {
  const root = place?.organizationStructure;
  const placeLimits = existingLimits.filter((l) => l.praksisPlaceId === place?.id);
  const parent = root ? parentLimitOf(entity.id, placeLimits, root) : undefined;

  const [form, setForm] = useState<LimitForm>(() =>
    editingLimit
      ? {
          limit: editingLimit.limit,
          limitType: editingLimit.limitType,
          periodStart: editingLimit.periodStart ?? '01/01',
          periodEnd: editingLimit.periodEnd ?? '12/31',
          shares: Object.fromEntries(editingLimit.emneShares.map((s) => [emneKey(s.programId, s.emneId), s.limit])),
        }
      : {
          limit: 0,
          // A limit under another one usually counts in the same period
          limitType: parent?.limitType ?? 'yearly',
          periodStart: parent?.periodStart ?? '01/01',
          periodEnd: parent?.periodEnd ?? '12/31',
          shares: fixedEmne ? { [emneKey(fixedEmne.programId, fixedEmne.emneId)]: 0 } : {},
        }
  );

  // emneKey → where the emne sits, for labels and for saving
  const emneIndex = new Map<string, { study: Study; program: StudyProgram; emne: StudyEmne }>();
  studies.forEach((study) =>
    study.programs.forEach((program) =>
      (program.emner ?? []).forEach((emne) => emneIndex.set(emneKey(program.id, emne.id), { study, program, emne }))
    )
  );

  const update = (patch: Partial<LimitForm>) => setForm((prev) => withAutoShare({ ...prev, ...patch }));

  // Add or remove a set of emner (one emne, a whole program or a whole study)
  const toggleEmner = (keys: string[]) => {
    const allSelected = keys.every((k) => k in form.shares);
    const shares = { ...form.shares };
    keys.forEach((k) => {
      if (allSelected) delete shares[k];
      else if (!(k in shares)) shares[k] = 0;
    });
    update({ shares });
  };

  const splitEvenly = () => {
    const keys = Object.keys(form.shares);
    const base = Math.floor(form.limit / keys.length);
    const extra = form.limit % keys.length;
    update({ shares: Object.fromEntries(keys.map((k, i) => [k, base + (i < extra ? 1 : 0)])) });
  };

  const distributedTotal = Object.values(form.shares).reduce((sum, n) => sum + n, 0);

  const problem = (() => {
    const p: { limit?: string; emner?: string; distribution?: string; period?: string } = {};
    if (!form.limit || form.limit <= 0) p.limit = 'Set a limit above 0';
    if (Object.keys(form.shares).length === 0) p.emner = 'Select programs or emner';
    else if (form.limit > 0) {
      const left = form.limit - distributedTotal;
      if (left > 0) p.distribution = `${left} of ${form.limit} students not distributed yet`;
      if (left < 0) p.distribution = `${-left} more than the limit of ${form.limit} distributed`;
    }
    // Under another limit the period is the parent's, so only a top limit's own period is checked
    if (!parent && form.limitType === 'yearly' && (!isValidMonthDay(form.periodStart) || !isValidMonthDay(form.periodEnd))) {
      p.period = 'Use MM/DD, e.g. 01/01';
    }
    return p;
  })();
  const isValid = !!place && !problem.limit && !problem.emner && !problem.distribution && !problem.period;

  const emneShares: LimitEmneShare[] = Object.entries(form.shares).flatMap(([k, limit]) => {
    const info = emneIndex.get(k);
    if (info) {
      const { study, program, emne } = info;
      return [{ studyId: study.id, programId: program.id, programName: program.name, emneId: emne.id, emneName: emne.name, limit }];
    }
    // Emne no longer in Settings: keep what was saved
    const saved = editingLimit?.emneShares.find((s) => emneKey(s.programId, s.emneId) === k);
    return saved ? [{ ...saved, limit }] : [];
  });

  // Under another limit, type and period are the parent's
  const period = parent
    ? { limitType: parent.limitType, periodStart: parent.periodStart, periodEnd: parent.periodEnd }
    : { limitType: form.limitType, periodStart: form.periodStart, periodEnd: form.periodEnd };

  const draft: PraksisPlaceLimit = {
    id: editingLimit?.id ?? `limit-${Date.now()}`,
    praksisPlaceId: place?.id ?? '',
    entityId: entity.id,
    entityName: entity.name,
    limit: form.limit,
    limitType: period.limitType,
    ...(period.limitType === 'yearly' && { periodStart: period.periodStart, periodEnd: period.periodEnd }),
    emneShares,
    createdAt: editingLimit?.createdAt ?? new Date().toISOString(),
  };

  const bounds = root ? limitBounds(draft, placeLimits, root) : undefined;
  const ruleErrors = root ? validateLimit(draft, placeLimits, root) : [];
  const boundsFor = (key: string) => bounds?.perEmne.find((e) => e.key === key.replace('::', '|'));

  // Limits below follow this limit's type and period
  const cascaded = root
    ? limitsBelow(entity.id, placeLimits, root)
        .filter((l) => l.id !== draft.id && !samePeriod(l, draft))
        .map((l) => ({
          ...l,
          limitType: draft.limitType,
          periodStart: draft.periodStart,
          periodEnd: draft.periodEnd,
        }))
    : [];

  const handleSave = () => {
    if (!isValid || ruleErrors.length > 0) return;
    onSave([draft, ...cascaded]);
    onClose();
  };

  // "Nursing (all emner)" when a whole program is picked, otherwise "Nursing: Kull 2024 Høst"
  const describeSelection = () =>
    studies
      .flatMap((study) => study.programs)
      .map((program) => {
        const emner = program.emner ?? [];
        const picked = emner.filter((e) => emneKey(program.id, e.id) in form.shares);
        if (picked.length === 0) return null;
        if (picked.length === emner.length) return `${program.name} (all emner)`;
        return `${program.name}: ${picked.map((e) => e.name).join(', ')}`;
      })
      .filter(Boolean)
      .join(' · ');

  const renderEmnePicker = () => {
    const summary = describeSelection();
    const selectionMark = (keys: string[]) => {
      const count = keys.filter((k) => k in form.shares).length;
      if (count > 0 && count < keys.length) return <Minus className="h-4 w-4 flex-shrink-0 text-blue-600" />;
      return <Check className={cn('h-4 w-4 flex-shrink-0', count > 0 ? 'opacity-100 text-blue-600' : 'opacity-0')} />;
    };
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={summary || undefined}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-1.5 text-left text-sm',
              problem.emner ? 'border-red-500' : 'border-input'
            )}
          >
            {summary ? (
              <span className="block truncate font-medium text-gray-900">{summary}</span>
            ) : (
              <span className="text-muted-foreground">Select programs or emner</span>
            )}
            <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[260px]">
          {studies.length === 0 && (
            <div className="px-2 py-3 text-sm text-gray-500 text-center">No studies defined in Settings</div>
          )}
          {studies.map((study) => {
            const studyKeys = study.programs.flatMap((p) => (p.emner ?? []).map((e) => emneKey(p.id, e.id)));
            const hasSelection = studyKeys.some((k) => k in form.shares);
            return (
              <DropdownMenuSub key={study.id}>
                <DropdownMenuSubTrigger className={hasSelection ? 'font-medium text-blue-600' : ''}>
                  <span className="truncate">{study.name}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-[260px] max-h-[360px] overflow-y-auto">
                  {/* preventDefault keeps the menu open so several items can be picked */}
                  <DropdownMenuItem
                    disabled={studyKeys.length === 0}
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleEmner(studyKeys);
                    }}
                    className="gap-2"
                  >
                    {selectionMark(studyKeys)}
                    All programs in {study.name}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {study.programs.map((program) => {
                    const emner = program.emner ?? [];
                    const programKeys = emner.map((e) => emneKey(program.id, e.id));
                    return (
                      <div key={program.id}>
                        <DropdownMenuItem
                          disabled={emner.length === 0}
                          onSelect={(e) => {
                            e.preventDefault();
                            toggleEmner(programKeys);
                          }}
                          className="gap-2 font-medium"
                          title={emner.length === 0 ? 'This program has no emner' : `All emner in ${program.name}`}
                        >
                          {selectionMark(programKeys)}
                          <span className="truncate">{program.name}</span>
                          {emner.length === 0 && <span className="ml-auto text-xs font-normal text-gray-400">no emner</span>}
                        </DropdownMenuItem>
                        {emner.map((emne) => {
                          const k = emneKey(program.id, emne.id);
                          return (
                            <DropdownMenuItem
                              key={k}
                              onSelect={(e) => {
                                e.preventDefault();
                                toggleEmner([k]);
                              }}
                              className="gap-2 pl-6"
                            >
                              {selectionMark([k])}
                              <span className="truncate">{emne.name}</span>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const shareKeys = Object.keys(form.shares);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLimit ? 'Edit limit' : 'Add limit'} · {entity.name}
          </DialogTitle>
          <DialogDescription>
            {place?.name ? `${place.name}. ` : ''}The limit caps {entity.name} and every unit under it, per year or
            semester, split between the emner that can use it.
          </DialogDescription>
        </DialogHeader>

        {!place ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
            Praksis place not found
          </p>
        ) : (
          <div className="space-y-5 py-1">
            {parent && (
              <div className="flex items-start gap-2 rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600">
                <CornerLeftUp className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                <span>
                  Within <span className="font-semibold text-gray-800">{parent.entityName}</span> ({limitPeriodLabel(parent)}):{' '}
                  {parent.emneShares.map((s) => `${s.emneName} ${s.limit}`).join(' · ')}
                  {bounds?.maxTotal !== undefined && (
                    <span className="text-gray-800"> · {Math.max(0, bounds.maxTotal)} left for this unit</span>
                  )}
                </span>
              </div>
            )}

            <div className="grid grid-cols-[120px_1fr] gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Limit <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.limit}
                  onChange={(e) => update({ limit: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  className={cn('text-center', problem.limit && 'border-red-500')}
                />
                {problem.limit && <p className="text-xs text-red-600">{problem.limit}</p>}
                {bounds && (bounds.minTotal > 0 || bounds.maxTotal !== undefined) && (
                  <p
                    className={cn(
                      'text-xs',
                      form.limit < bounds.minTotal || (bounds.maxTotal !== undefined && form.limit > bounds.maxTotal)
                        ? 'text-red-600'
                        : 'text-gray-500'
                    )}
                  >
                    Allowed: {bounds.minTotal}
                    {bounds.maxTotal !== undefined ? `–${Math.max(0, bounds.maxTotal)}` : '+'}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 min-w-0">
                <label className="block text-xs font-semibold text-gray-700">
                  Programs / Emner <span className="text-red-500">*</span>
                </label>
                {fixedEmne ? (
                  // Placement page: the emne comes from the placement and can't be changed
                  <div
                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                    title="Set by the placement"
                  >
                    <Lock className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{describeSelection()}</span>
                  </div>
                ) : (
                  renderEmnePicker()
                )}
                {problem.emner && <p className="text-xs text-red-600">{problem.emner}</p>}
              </div>
            </div>

            {shareKeys.length > 0 && (
              <div className={cn('rounded-md border p-3', problem.distribution ? 'border-red-300' : 'border-gray-200')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Distribute the limit between emner
                    <span className={cn('ml-2 font-normal', problem.distribution ? 'text-red-600' : 'text-green-700')}>
                      {distributedTotal} / {form.limit} distributed
                    </span>
                  </span>
                  {shareKeys.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={splitEvenly}
                      disabled={form.limit <= 0}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700"
                    >
                      Split evenly
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {shareKeys.map((k) => {
                    const info = emneIndex.get(k);
                    if (!info) return null;
                    const eb = boundsFor(k);
                    const share = form.shares[k] ?? 0;
                    const outOfRange = !!eb && (share < eb.min || (eb.max !== undefined && share > eb.max) || (eb.missingInParent && share > 0));
                    const hint = eb
                      ? eb.missingInParent
                        ? `not in ${parent?.entityName}`
                        : [eb.min > 0 && `min ${eb.min}`, eb.max !== undefined && `max ${Math.max(0, eb.max)}`].filter(Boolean).join(' · ')
                      : '';
                    return (
                      <div key={k} className="flex flex-col gap-0.5">
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-md border bg-gray-50 pl-3 pr-1 py-1',
                          outOfRange ? 'border-red-400' : 'border-gray-200'
                        )}
                      >
                        <span className="text-sm text-gray-700">
                          <span className="text-gray-500">{info.program.name} ·</span> {info.emne.name}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={form.shares[k]}
                          disabled={shareKeys.length === 1}
                          title={shareKeys.length === 1 ? 'The only emne gets the whole limit' : undefined}
                          onChange={(e) =>
                            update({ shares: { ...form.shares, [k]: Math.max(0, parseInt(e.target.value, 10) || 0) } })
                          }
                          className="h-7 w-20 text-center bg-white"
                        />
                        {!fixedEmne && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEmner([k])}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                            title="Remove emne"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      {hint && <span className={cn('px-1 text-[11px]', outOfRange ? 'text-red-600' : 'text-gray-500')}>{hint}</span>}
                      </div>
                    );
                  })}
                </div>
                {problem.distribution && <p className="text-xs text-red-600 mt-2">{problem.distribution}</p>}
              </div>
            )}

            <div className="grid grid-cols-[auto_1fr] gap-6">
              {parent ? (
                // Under another limit, type and period are the parent's
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Limit type / Period</label>
                  <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 w-fit">
                    <Lock className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    {limitPeriodLabel(parent)}
                    <span className="text-xs text-gray-500">· set by {parent.entityName}</span>
                  </div>
                </div>
              ) : (
              <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Limit type</label>
                <div className="inline-flex rounded-md border border-gray-200 p-0.5 bg-gray-50">
                  {(['yearly', 'semester'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => update({ limitType: type })}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded transition-colors',
                        form.limitType === type ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {type === 'yearly' ? 'Yearly' : 'Semester'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Period (MM/DD)</label>
                {form.limitType === 'semester' ? (
                  <p className="text-sm text-gray-400 py-1">Not needed for semester</p>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={form.periodStart}
                        onChange={(e) => update({ periodStart: e.target.value })}
                        placeholder="01/01"
                        maxLength={5}
                        className={cn('w-20 text-center', problem.period && !isValidMonthDay(form.periodStart) && 'border-red-500')}
                      />
                      <span className="text-gray-400">–</span>
                      <Input
                        value={form.periodEnd}
                        onChange={(e) => update({ periodEnd: e.target.value })}
                        placeholder="12/31"
                        maxLength={5}
                        className={cn('w-20 text-center', problem.period && !isValidMonthDay(form.periodEnd) && 'border-red-500')}
                      />
                    </div>
                    {problem.period && <p className="text-xs text-red-600">{problem.period}</p>}
                  </>
                )}
              </div>
              </>
              )}
            </div>

            {cascaded.length > 0 && !problem.period && (
              <p className="text-xs text-blue-700">
                Also updates {cascaded.length} limit{cascaded.length === 1 ? '' : 's'} below to {limitPeriodLabel(draft)}
              </p>
            )}

            {ruleErrors.length > 0 && form.limit > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 space-y-1">
                {ruleErrors.map((w) => (
                  <p key={w} className="flex items-start gap-1.5 text-xs text-red-700">
                    <AlertOctagon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isValid || ruleErrors.length > 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {editingLimit ? 'Save changes' : 'Add limit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
