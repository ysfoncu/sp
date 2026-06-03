import { useState, useEffect, useMemo } from 'react';
import { X, Users, AlertTriangle, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Student } from '../types/placementTask';
import { PriorityPlacementApplication } from '../types/priorityPlacement';

interface QuickAssignStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  praksisPlaceName: string;
  departmentName: string;
  availableCapacity: number;
  unassignedStudents: Student[];
  priorityApplications?: PriorityPlacementApplication[];
  onAssign: (studentIds: string[]) => void;
}

export function QuickAssignStudentsModal({
  isOpen,
  onClose,
  praksisPlaceName,
  departmentName,
  availableCapacity,
  unassignedStudents,
  priorityApplications,
  onAssign,
}: QuickAssignStudentsModalProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const priorityMap = useMemo(
    () => new Map((priorityApplications ?? []).map((a) => [a.studentId, a])),
    [priorityApplications],
  );

  const sortedStudents = useMemo(
    () =>
      [...unassignedStudents].sort((a, b) => {
        const apts = priorityMap.get(a.id)?.totalPoints ?? -1;
        const bpts = priorityMap.get(b.id)?.totalPoints ?? -1;
        return bpts - apts;
      }),
    [unassignedStudents, priorityMap],
  );

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedStudentIds(new Set());
    }
  }, [isOpen]);

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        // Only add if we haven't reached capacity
        if (newSet.size < availableCapacity) {
          newSet.add(studentId);
        }
      }
      return newSet;
    });
  };

  const handleAssign = () => {
    if (selectedStudentIds.size > 0) {
      onAssign(Array.from(selectedStudentIds));
      setSelectedStudentIds(new Set());
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedStudentIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  const selectedCount = selectedStudentIds.size;
  const canSelectMore = selectedCount < availableCapacity;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Quick Assign Students
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {praksisPlaceName} - {departmentName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Selection Info Banner */}
          <div className="px-6 pt-4 pb-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2 text-blue-700">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">
                Select up to {availableCapacity} unassigned student{availableCapacity !== 1 ? 's' : ''}{' '}
                ({selectedCount} selected)
              </span>
            </div>
          </div>

          {/* Students List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {sortedStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium mb-1">No unassigned students</p>
                <p className="text-sm">All students have been assigned to praksis places.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedStudents.map((student) => {
                  const isSelected = selectedStudentIds.has(student.id);
                  const isDisabled = !isSelected && !canSelectMore;

                  // Find history records that match this entity
                  const conflictHistory = (student.placementHistory ?? []).filter(
                    (h) =>
                      h.praksisPlaceName?.toLowerCase() === praksisPlaceName.toLowerCase() &&
                      h.unitName?.toLowerCase() === departmentName.toLowerCase()
                  );
                  const hasConflict = conflictHistory.length > 0;

                  return (
                    <label
                      key={student.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200'
                          : isDisabled
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                          : hasConflict
                          ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleToggleStudent(student.id)}
                        className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed flex-shrink-0"
                      />

                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {priorityMap.has(student.id) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-700 text-xs font-semibold flex-shrink-0">
                              <Star className="h-3 w-3" />
                              {priorityMap.get(student.id)!.totalPoints} pts
                            </span>
                          )}
                          {hasConflict && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                          <span className="font-medium text-gray-900 text-sm">
                            {student.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {student.email}
                        </div>

                        {/* Conflict history records */}
                        {hasConflict && (
                          <div className="mt-2 space-y-1">
                            {conflictHistory.map((h) => {
                              const statusColor =
                                h.status === 'current'
                                  ? 'border-l-blue-400 bg-blue-50 text-blue-700'
                                  : h.status === 'upcoming'
                                  ? 'border-l-green-400 bg-green-50 text-green-700'
                                  : 'border-l-amber-400 bg-amber-100 text-amber-800';
                              const label =
                                h.status === 'current' ? 'Current' :
                                h.status === 'upcoming' ? 'Upcoming' : 'Previous';
                              const topLine = [h.year, h.semester, h.emne]
                                .filter(Boolean)
                                .join(' / ');
                              return (
                                <div
                                  key={h.placementId}
                                  className={`border-l-2 pl-2 py-0.5 rounded-sm ${statusColor}`}
                                >
                                  <div className="text-xs font-medium">
                                    {label} · {topLine}
                                  </div>
                                  <div className="text-xs opacity-70">
                                    {h.praksisPlaceName}
                                    {h.unitName && ` / ${h.unitName}`}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Year Badge */}
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {student.year}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedCount === 0}
              className="min-w-[140px]"
            >
              Assign {selectedCount} Student{selectedCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
