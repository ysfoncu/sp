import { useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Clock, Gauge, Info, Pencil, UserPlus, X } from 'lucide-react';
import { Student } from '../types/placementTask';
import { PlaceProfileTree } from '../types/profileUsage';
import { profileAudienceLabel } from '../types/placementProfile';
import { SetPlacesDialog } from './SetPlacesDialog';

interface AvailableProfilesPanelProps {
  trees: PlaceProfileTree[];
  students: Student[];
  emne?: string;
  hasPlacementDetails: boolean;
  readOnly: boolean;
  // Starts placing students on this entity: the students are then picked in the Students table
  onStartAssign: (profileId: string) => void;
  // The entity students are being placed on now, if any
  assignTargetId?: string | null;
  // Takes a student off the entity (the page offers an Undo); not offered once the assignments are published
  onRemoveStudent?: (studentId: string) => void;
  // Students are ticked in the table: the + of a card then chooses that entity for them
  selectedCount?: number;
  pickedEntityId?: string | null;
  // Opens Praksis places, where profiles are made
  onOpenProfiles?: () => void;
}

// Left panel of a placement task: the profiles that fit the placement's program and emne, with the
// places left on each
export default function AvailableProfilesPanel({
  trees,
  students,
  emne,
  hasPlacementDetails,
  readOnly,
  onStartAssign,
  assignTargetId,
  onRemoveStudent,
  selectedCount = 0,
  pickedEntityId = null,
  onOpenProfiles,
}: AvailableProfilesPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // The students placed on each entity, grouped once instead of by a filter for every entity
  const assignedByEntity = useMemo(() => {
    const map = new Map<string, Student[]>();
    students.forEach((s) => {
      const a = s.assignedPraksisPlace;
      if (!a) return;
      const key = `${a.placeId}|${a.entityId ?? a.departmentId}`;
      map.set(key, [...(map.get(key) ?? []), s]);
    });
    return map;
  }, [students]);
  const [settingPlaces, setSettingPlaces] = useState<string | null>(null); // entity id whose places are being set

  if (!hasPlacementDetails) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">Complete Placement Details</h3>
        <p className="text-xs text-gray-500">Fill out the placement details above to see the available entities</p>
      </div>
    );
  }

  if (trees.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
          <Gauge className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No entity for {emne ?? 'this emne'}</h3>
        <p className="text-xs text-gray-500 mb-4">
          Entities are made per praksis place. Add an entity for this program and emne under Praksis places to
          start assigning students.
        </p>
        {onOpenProfiles && (
          <Button onClick={onOpenProfiles} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Go to Praksis places
          </Button>
        )}
      </div>
    );
  }

  const nodes = trees.flatMap((t) => t.nodes);
  const totalRemaining = nodes.reduce((sum, n) => sum + n.remaining, 0);
  const totalPlaces = nodes.reduce((sum, n) => sum + n.places, 0);
  // Students ticked and no + pressed first: the + of a card chooses the entity for the ticked students
  const choosing = selectedCount > 0 && !assignTargetId;
  const unitOf = (s: Student) => s.assignedPraksisPlace?.entityId ?? s.assignedPraksisPlace?.departmentId;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Available entities</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {emne} · {totalRemaining} of {totalPlaces} places left
        </p>
        {choosing && (
          <p className="mt-2 rounded bg-indigo-50 px-2 py-1.5 text-xs text-indigo-900" role="status">
            <span className="font-semibold">{selectedCount} student{selectedCount !== 1 ? 's' : ''} selected.</span> Press + on an entity to choose it for them, or use "Choose praksis place" in the bar below.
          </p>
        )}
      </div>

      {trees.map((tree, placeIdx) => (
        <div key={tree.praksisPlaceId} className={placeIdx > 0 ? 'border-t-2 border-gray-100' : ''}>
          <div className="bg-gray-50 px-4 py-2.5">
            <p className="text-sm font-bold text-gray-900 truncate">{tree.praksisPlaceName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {tree.nodes.length} entit{tree.nodes.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>

          {tree.nodes.map((node) => {
            const { profile } = node;
            // Students of this placement placed on this entity
            const assigned = assignedByEntity.get(`${tree.praksisPlaceId}|${profile.id}`) ?? [];
            const percent = node.places > 0 ? Math.min(100, ((node.places - node.remaining) / node.places) * 100) : 100;
            const isOpen = expanded.has(profile.id);
            return (
              <div
                key={profile.id}
                className={`py-3 px-4 border-t border-gray-100 ${
                  assignTargetId === profile.id
                    ? 'bg-blue-50 ring-1 ring-inset ring-blue-300'
                    : choosing && pickedEntityId === profile.id
                    ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-400'
                    : ''
                }`}
                aria-current={assignTargetId === profile.id || (choosing && pickedEntityId === profile.id) ? 'true' : undefined}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {profile.name}
                      {assignTargetId === profile.id && (
                        <span className="ml-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Placing here</span>
                      )}
                      {choosing && pickedEntityId === profile.id && (
                        <span className="ml-2 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Chosen</span>
                      )}
                    </p>
                    <p className="truncate text-[11px] text-gray-500">
                      {profileAudienceLabel(profile)}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px] h-5 px-1.5 bg-white text-gray-600 border-gray-200">
                      {node.periodLabel}
                    </Badge>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm">
                      <span className={`font-semibold ${node.remaining > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {node.remaining}
                      </span>
                      <span className="text-gray-400"> / {node.places}</span>
                    </p>
                    {node.over > 0 ? (
                      <p className="text-[10px] font-medium text-red-600">{node.over} over</p>
                    ) : (
                      <p className="text-[10px] text-gray-400">left</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSettingPlaces(profile.id)}
                    className="h-7 w-7 p-0 flex-shrink-0 text-gray-500 hover:text-gray-900"
                    title="Set places"
                    aria-label={`Set places for ${profile.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!readOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartAssign(profile.id)}
                      data-assign-target={profile.id}
                      aria-pressed={assignTargetId === profile.id || (choosing && pickedEntityId === profile.id)}
                      className={`h-7 w-7 p-0 flex-shrink-0 ${
                        assignTargetId === profile.id
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white'
                          : choosing
                          ? pickedEntityId === profile.id
                            ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:text-white'
                            : 'text-indigo-700 border-indigo-300 hover:bg-indigo-50'
                          : node.remaining > 0 ? 'text-green-600 border-green-200 hover:bg-green-50' : ''
                      }`}
                      title={
                        assignTargetId === profile.id
                          ? `Placing students on ${profile.name}`
                          : choosing
                          ? `Choose ${profile.name} for the ${selectedCount} selected student${selectedCount !== 1 ? 's' : ''}`
                          : `Place students on ${profile.name}`
                      }
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div
                  className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden"
                  role="progressbar"
                  aria-label={`${profile.name}: ${Math.max(0, node.places - node.remaining)} of ${node.places} places taken`}
                  aria-valuemin={0}
                  aria-valuemax={Math.max(1, node.places)}
                  aria-valuenow={Math.min(Math.max(1, node.places), Math.max(0, node.places - node.remaining))}
                >
                  <div
                    className={`h-full rounded-full ${node.remaining === 0 ? 'bg-gray-400' : 'bg-blue-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-500">
                  <button
                    type="button"
                    onClick={() => toggle(profile.id)}
                    disabled={assigned.length === 0}
                    className="flex items-center gap-0.5 hover:text-gray-800 disabled:hover:text-gray-500"
                  >
                    {assigned.length > 0 &&
                      (isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
                    {node.used} placed here
                  </button>
                  {node.usedElsewhere > 0 && (
                    <span className="text-orange-500">{node.usedElsewhere} used in other placements</span>
                  )}
                </div>
                {isOpen && assigned.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 pl-4">
                    {assigned.map((s) => (
                      <li key={s.id} className="group flex items-center gap-1 text-xs text-gray-700">
                        <span className="flex-1 truncate">{s.name}</span>
                        {!readOnly && onRemoveStudent && (
                          <button
                            type="button"
                            onClick={() => onRemoveStudent(s.id)}
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:bg-red-50 focus-visible:text-red-600"
                            title={`Take ${s.name} off ${profile.name}`}
                            aria-label={`Take ${s.name} off ${profile.name}`}
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Entities are made on the Praksis places page, not here */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 rounded-b-lg flex items-start gap-2 text-xs text-gray-500">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
        <p>
          Can't see an entity you expected for {emne ?? 'this emne'}? An entity needs a program and emner before it is offered here. Add or complete it under{' '}
          {onOpenProfiles ? (
            <button type="button" onClick={onOpenProfiles} className="text-blue-600 hover:underline">
              Praksis places → Entities
            </button>
          ) : (
            'Praksis places → Entities'
          )}
          .
        </p>
      </div>
      {(() => {
        const node = trees.flatMap((t) => t.nodes).find((n) => n.profile.id === settingPlaces);
        return node ? (
          <SetPlacesDialog entity={node.profile} placed={node.used + node.usedElsewhere} periodLabel={node.periodLabel} onClose={() => setSettingPlaces(null)} />
        ) : null;
      })()}
    </div>
  );
}
