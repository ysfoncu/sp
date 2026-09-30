import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertOctagon, ChevronDown, ChevronRight, Clock, Gauge, Info, Pencil, UserPlus } from 'lucide-react';
import { Student } from '../types/placementTask';
import { PlaceLimitTree } from '../types/limitUsage';

interface AvailableLimitsPanelProps {
  trees: PlaceLimitTree[];
  students: Student[];
  emne?: string;
  hasPlacementDetails: boolean;
  isPublished: boolean;
  readOnly: boolean;
  onQuickAssign: (quotaInfo: {
    requestId: string;
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
    availableCapacity: number;
    entityId?: string;
  }) => void;
  // Students can only be assigned after the first publish
  onPublishRequired: () => void;
  // Opens Praksis places, where limits are added
  onOpenLimits?: () => void;
  // Edit a limit right here, without leaving the placement
  onEditLimit?: (limitId: string) => void;
  // Limits that break the nesting rules, with the reasons
  violations?: Map<string, string[]>;
}

// Left panel of a placement task: the (nested) Praksis place limits the placement's emne can use
export default function AvailableLimitsPanel({
  trees,
  students,
  emne,
  hasPlacementDetails,
  isPublished,
  readOnly,
  onQuickAssign,
  onPublishRequired,
  onOpenLimits,
  onEditLimit,
  violations,
}: AvailableLimitsPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!hasPlacementDetails) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">Complete Placement Details</h3>
        <p className="text-xs text-gray-500">Fill out the placement details above to see the available limits</p>
      </div>
    );
  }

  if (trees.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
          <Gauge className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No limit for {emne ?? 'this emne'}</h3>
        <p className="text-xs text-gray-500 mb-4">
          Limits are defined per praksis place. Add a limit that includes this emne under Praksis places →
          Limits to start assigning students.
        </p>
        {onOpenLimits && (
          <Button onClick={onOpenLimits} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Go to Praksis places
          </Button>
        )}
      </div>
    );
  }

  const topNodes = trees.flatMap((t) => t.nodes.filter((n) => n.depth === 0));
  const totalRemaining = topNodes.reduce((sum, n) => sum + n.remaining, 0);
  const totalCapacity = topNodes.reduce((sum, n) => sum + n.share, 0);
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
        <h3 className="text-sm font-semibold text-gray-900">Available limits</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {emne} · {totalRemaining} of {totalCapacity} places left
        </p>
      </div>

      {trees.map((tree, placeIdx) => (
        <div key={tree.praksisPlaceId} className={placeIdx > 0 ? 'border-t-2 border-gray-100' : ''}>
          <div className="bg-gray-50 px-4 py-2.5">
            <p className="text-sm font-bold text-gray-900 truncate">{tree.praksisPlaceName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {tree.nodes.length} limit{tree.nodes.length !== 1 ? 's' : ''} · {tree.units.length} unit
              {tree.units.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {tree.nodes.map((node) => {
            const { limit } = node;
            // Students of this placement inside this limit's subtree
            const assigned = students.filter((s) => {
              if (s.assignedPraksisPlace?.placeId !== tree.praksisPlaceId) return false;
              const unit = tree.units.find((u) => u.id === unitOf(s));
              return !!unit && unit.limitPath.includes(limit.entityId);
            });
            const usedTotal = node.share - node.remaining;
            const percent = node.share > 0 ? Math.min(100, (usedTotal / node.share) * 100) : 100;
            const isOpen = expanded.has(limit.id);
            const capped = node.effectiveRemaining < node.remaining;
            return (
              <div
                key={limit.id}
                className="py-3 pr-4 border-t border-gray-100"
                style={{ paddingLeft: `${16 + node.depth * 16}px` }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-1 text-sm font-medium text-gray-800">
                      <span className="truncate">{limit.entityName}</span>
                      {violations?.has(limit.id) && (
                        <span title={violations.get(limit.id)!.join('\n')} className="flex-shrink-0">
                          <AlertOctagon className="h-3.5 w-3.5 text-red-600" />
                        </span>
                      )}
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
                      <span className="text-gray-400"> / {node.share}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">left</p>
                  </div>
                  {onEditLimit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditLimit(limit.id)}
                      className="h-7 w-7 p-0 flex-shrink-0 text-gray-500 hover:text-gray-900"
                      title="Edit limit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!readOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={node.effectiveRemaining === 0}
                      onClick={() => {
                        if (!isPublished) {
                          onPublishRequired();
                          return;
                        }
                        onQuickAssign({
                          requestId: limit.id,
                          praksisPlaceId: tree.praksisPlaceId,
                          praksisPlaceName: tree.praksisPlaceName,
                          departmentId: limit.entityId,
                          departmentName: limit.entityName,
                          availableCapacity: node.effectiveRemaining,
                          entityId: limit.entityId,
                        });
                      }}
                      className={`h-7 w-7 p-0 flex-shrink-0 ${
                        node.effectiveRemaining > 0 ? 'text-green-600 border-green-200 hover:bg-green-50' : ''
                      }`}
                      title={
                        node.effectiveRemaining > 0
                          ? `Assign students to ${limit.entityName}`
                          : `Full: ${node.limitingName} limit reached`
                      }
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${node.remaining === 0 ? 'bg-gray-400' : 'bg-blue-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {violations?.get(limit.id)?.map((r) => (
                  <p key={r} className="mt-1.5 text-[11px] text-red-600">{r}</p>
                ))}
                {capped && (
                  <p className="mt-1.5 text-[11px] text-amber-700">
                    Capped by {node.limitingName}: {node.effectiveRemaining} left
                  </p>
                )}
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-500">
                  <button
                    type="button"
                    onClick={() => toggle(limit.id)}
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
                      <li key={s.id} className="text-xs text-gray-700 truncate">
                        {s.name}
                        {s.assignedPraksisPlace && unitOf(s) !== limit.entityId && (
                          <span className="text-gray-400"> · {s.assignedPraksisPlace.departmentName}</span>
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

      {/* Limits are added on the Praksis places page, not here */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 rounded-b-lg flex items-start gap-2 text-xs text-gray-500">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
        <p>
          Can't see a limit you expected for {emne ?? 'this emne'}? Add it under{' '}
          {onOpenLimits ? (
            <button type="button" onClick={onOpenLimits} className="text-blue-600 hover:underline">
              Praksis places → Limits
            </button>
          ) : (
            'Praksis places → Limits'
          )}
          .
        </p>
      </div>
    </div>
  );
}
