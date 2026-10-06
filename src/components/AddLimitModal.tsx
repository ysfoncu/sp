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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from './ui/utils';
import { Lock, Search, X } from 'lucide-react';
import { PraksisPlace } from '../types/praksisPlace';
import { LimitEmneShare, PraksisPlaceLimit, usePlacePeriod } from '../types/praksisLimit';
import { findNode, isLowestUnit, limitPeriodLabel } from '../types/limitUsage';
import { Study, StudyEmne, StudyProgram } from './SettingsView';

const emneKey = (programId: string, emneId: string) => `${programId}::${emneId}`;

interface AddLimitModalProps {
  // The praksis place and the unit the limit is for (a unit has at most one limit)
  place?: PraksisPlace;
  entity: { id: string; name: string };
  // Kept so callers can pass every saved limit; units don't depend on each other
  existingLimits?: PraksisPlaceLimit[];
  // Opened from a placement: this emne is pinned to the top
  fixedEmne?: { programId: string; emneId: string };
  // Studies → programs → emner a unit can take students from
  studies: Study[];
  onClose: () => void;
  onSave: (limits: PraksisPlaceLimit[]) => void;
  // When set, the dialog edits this limit
  editingLimit?: PraksisPlaceLimit;
}

interface EmneRow {
  study: Study;
  program: StudyProgram;
  emne: StudyEmne;
  key: string;
}

// One number per emne: how many students of that emne the unit takes per period. 0 = not taken.
export function AddLimitModal({ place, entity, fixedEmne, studies, onClose, onSave, editingLimit }: AddLimitModalProps) {
  const period = usePlacePeriod(place?.id);
  const node = place?.organizationStructure ? findNode(place.organizationStructure, entity.id) : null;
  const canHaveLimit = !node || isLowestUnit(node);

  // emneKey → students
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries((editingLimit?.emneShares ?? []).map((s) => [emneKey(s.programId, s.emneId), s.limit]))
  );

  // Finding emner in a long list: search, narrow by study and program, or review what is set
  const [query, setQuery] = useState('');
  const [studyId, setStudyId] = useState('all');
  const [programId, setProgramId] = useState('all');
  const [view, setView] = useState<'all' | 'set'>('all');

  const rows: EmneRow[] = studies.flatMap((study) =>
    study.programs.flatMap((program) =>
      (program.emner ?? []).map((emne) => ({ study, program, emne, key: emneKey(program.id, emne.id) }))
    )
  );
  const knownKeys = new Set(rows.map((r) => r.key));
  // Emner saved on the limit that are no longer in Settings stay listed so they can be set to 0
  const orphaned = (editingLimit?.emneShares ?? []).filter((s) => !knownKeys.has(emneKey(s.programId, s.emneId)));

  const valueOf = (key: string) => values[key] ?? 0;
  const total = Object.values(values).reduce((sum, n) => sum + n, 0);
  const setCount = Object.values(values).filter((n) => n > 0).length;
  const isValid = !!place && canHaveLimit && total > 0;

  const programOptions = studies
    .filter((s) => studyId === 'all' || s.id === studyId)
    .flatMap((study) => study.programs.filter((p) => (p.emner ?? []).length > 0).map((program) => ({ study, program })));

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (studyId === 'all' || r.study.id === studyId) &&
      (programId === 'all' || r.program.id === programId) &&
      (view === 'all' || valueOf(r.key) > 0) &&
      (!q || [r.emne.name, r.program.name, r.study.name].some((t) => t.toLowerCase().includes(q)))
  );
  const isFixed = (key: string) => !!fixedEmne && key === emneKey(fixedEmne.programId, fixedEmne.emneId);
  const pinned = filtered.filter((r) => isFixed(r.key));
  const filtering = studyId !== 'all' || programId !== 'all' || q !== '';
  const shownOrphans = orphaned.filter(
    (s) => !filtering && (view === 'all' || valueOf(emneKey(s.programId, s.emneId)) > 0)
  );
  // Emner with a number that the current filter hides
  const hiddenSet = rows.filter((r) => valueOf(r.key) > 0 && !filtered.includes(r)).length;

  // Program groups, in the order the studies list them
  const groups: { program: StudyProgram; study: Study; items: EmneRow[] }[] = [];
  filtered
    .filter((r) => !isFixed(r.key))
    .forEach((r) => {
      const last = groups[groups.length - 1];
      if (last && last.program.id === r.program.id) last.items.push(r);
      else groups.push({ program: r.program, study: r.study, items: [r] });
    });

  const clearFilters = () => {
    setQuery('');
    setStudyId('all');
    setProgramId('all');
    setView('all');
  };

  const handleSave = () => {
    if (!isValid) return;
    const emneShares: LimitEmneShare[] = [
      ...rows.flatMap(({ study, program, emne, key }) =>
        valueOf(key) > 0
          ? [{ studyId: study.id, programId: program.id, programName: program.name, emneId: emne.id, emneName: emne.name, limit: valueOf(key) }]
          : []
      ),
      ...orphaned.flatMap((s) => {
        const limit = valueOf(emneKey(s.programId, s.emneId));
        return limit > 0 ? [{ ...s, limit }] : [];
      }),
    ];
    onSave([
      {
        id: editingLimit?.id ?? `limit-${Date.now()}`,
        praksisPlaceId: place!.id,
        entityId: entity.id,
        entityName: entity.name,
        limit: emneShares.reduce((sum, s) => sum + s.limit, 0),
        limitType: period.limitType,
        ...(period.limitType === 'yearly' && { periodStart: period.periodStart }),
        emneShares,
        createdAt: editingLimit?.createdAt ?? new Date().toISOString(),
      },
    ]);
    onClose();
  };

  const emneRow = (key: string, label: React.ReactNode) => (
    <div
      key={key}
      className={cn('flex items-center justify-between gap-3 px-3 py-1.5', valueOf(key) > 0 && 'bg-purple-50/40')}
    >
      <span className="truncate text-sm text-gray-800">{label}</span>
      <Input
        type="number"
        min={0}
        value={valueOf(key)}
        // Typing replaces the 0 instead of appending to it
        onFocus={(e) => e.target.select()}
        onChange={(e) => setValues((prev) => ({ ...prev, [key]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
        className={cn('h-8 w-20 flex-shrink-0 text-center', valueOf(key) > 0 && 'border-purple-300 font-semibold')}
      />
    </div>
  );

  const groupHeader = (label: string, hint?: string) => (
    <div className="sticky top-0 z-10 flex items-baseline gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {hint && <span className="truncate text-[11px] text-gray-400">{hint}</span>}
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLimit ? 'Edit capacity' : 'Add capacity'} · {entity.name}
          </DialogTitle>
          <DialogDescription>
            {place?.name ? `${place.name}. ` : ''}How many students of each emne {entity.name} takes. Emnes left at 0 are
            not taken.
          </DialogDescription>
        </DialogHeader>

        {!place ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
            Praksis place not found
          </p>
        ) : !canHaveLimit ? (
          <p className="text-sm text-gray-600 border border-dashed border-gray-200 rounded-lg p-6 text-center">
            Capacity is set on the lowest units. Set it on the units under {entity.name}.
          </p>
        ) : (
          <div className="space-y-3 py-1">
            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search emne, program or study…"
                  className="h-9 pl-8 pr-8"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={studyId}
                  onValueChange={(v) => {
                    setStudyId(v);
                    setProgramId('all');
                  }}
                >
                  <SelectTrigger className="h-9 border-gray-300 bg-white">
                    <SelectValue placeholder="All studies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All studies</SelectItem>
                    {studies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger className="h-9 border-gray-300 bg-white">
                    <SelectValue placeholder="All programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All programs</SelectItem>
                    {programOptions.map(({ study, program }) => (
                      <SelectItem key={program.id} value={program.id}>
                        {studyId === 'all' ? `${program.name} · ${study.name}` : program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
                  {(
                    [
                      ['all', 'All emner'],
                      ['set', `With capacity (${setCount})`],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setView(id)}
                      className={cn(
                        'rounded px-3 py-1 text-xs font-medium transition-colors',
                        view === id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="whitespace-nowrap text-xs text-gray-500">
                  {filtered.length + shownOrphans.length} of {rows.length + orphaned.length} emner
                  {(filtering || view === 'set') && (
                    <button type="button" onClick={clearFilters} className="ml-2 text-blue-600 hover:underline">
                      Clear filters
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* Emner */}
            <div className="h-[300px] overflow-y-auto rounded-md border border-gray-200">
              {rows.length === 0 && orphaned.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-gray-500">No emner defined in Settings</p>
              ) : filtered.length === 0 && shownOrphans.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-gray-500">
                  {view === 'set' && !filtering ? 'No emner have capacity yet' : 'No emner match the filter'}
                  <div>
                    <button type="button" onClick={clearFilters} className="mt-1 text-blue-600 hover:underline">
                      Clear filters
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {pinned.length > 0 && (
                    <div>
                      {groupHeader('This placement')}
                      <div className="divide-y divide-gray-100">
                        {pinned.map((r) =>
                          emneRow(
                            r.key,
                            <>
                              <span className="text-gray-500">{r.program.name} ·</span> {r.emne.name}
                            </>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {groups.map(({ program, study, items }) => (
                    <div key={program.id}>
                      {groupHeader(program.name, study.name)}
                      <div className="divide-y divide-gray-100">{items.map((r) => emneRow(r.key, r.emne.name))}</div>
                    </div>
                  ))}
                  {shownOrphans.length > 0 && (
                    <div>
                      {groupHeader('Removed from Settings')}
                      <div className="divide-y divide-gray-100">
                        {shownOrphans.map((s) =>
                          emneRow(
                            emneKey(s.programId, s.emneId),
                            <span className="text-gray-500">
                              {s.programName} · {s.emneName}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {hiddenSet > 0 && (
              <p className="text-xs text-gray-500">
                {hiddenSet} more emne{hiddenSet === 1 ? ' has' : 's have'} capacity outside this filter.
              </p>
            )}

            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                title={`Set for ${place.name}. Change it on the Capacity tab.`}
              >
                <Lock className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                {limitPeriodLabel(period)}
              </div>
              <p className="whitespace-nowrap text-sm text-gray-700">
                {setCount} emne{setCount === 1 ? '' : 's'} · Total{' '}
                <span className="font-semibold text-purple-600">{total}</span> students
              </p>
            </div>
            {total === 0 && <p className="text-xs text-red-600">Set at least one emne above 0</p>}
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isValid} className="bg-purple-600 hover:bg-purple-700">
            {editingLimit ? 'Save changes' : 'Add capacity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
