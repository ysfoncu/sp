import { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Student } from '../types/placementTask';

interface QuickAssignStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  praksisPlaceName: string;
  departmentName: string;
  availableCapacity: number;
  unassignedStudents: Student[];
  onAssign: (studentIds: string[]) => void;
}

export function QuickAssignStudentsModal({
  isOpen,
  onClose,
  praksisPlaceName,
  departmentName,
  availableCapacity,
  unassignedStudents,
  onAssign,
}: QuickAssignStudentsModalProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

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
            {unassignedStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium mb-1">No unassigned students</p>
                <p className="text-sm">All students have been assigned to praksis places.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unassignedStudents.map((student) => {
                  const isSelected = selectedStudentIds.has(student.id);
                  const isDisabled = !isSelected && !canSelectMore;

                  return (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200'
                          : isDisabled
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleToggleStudent(student.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                      />

                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {student.email}
                        </div>
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
