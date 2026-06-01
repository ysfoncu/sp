import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  PriorityPlacementApplication,
  PRIORITY_REASON_LABELS,
  PRIORITY_REASON_POINTS,
} from "../types/priorityPlacement";

interface PriorityApplicationDetailsModalProps {
  application: PriorityPlacementApplication;
  onClose: () => void;
}

export function PriorityApplicationDetailsModal({
  application,
  onClose,
}: PriorityApplicationDetailsModalProps) {
  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle>Priority application</DialogTitle>
            <Badge className="bg-green-100 text-green-700 border border-green-200 shrink-0">
              Approved
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Student */}
          <div className="p-3 bg-gray-50 rounded-md space-y-0.5">
            <p className="font-semibold text-sm text-gray-900">{application.studentName}</p>
            <p className="text-xs text-gray-500">{application.personnummer}</p>
            <p className="text-xs text-gray-500">{application.programName} · {application.studyLocation}</p>
          </div>

          {/* Target semester */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Target semester
            </p>
            <p className="text-sm text-gray-700">{application.targetSemester}</p>
          </div>

          {/* Reasons */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Priority reasons
            </p>
            {application.selectedReasons.length === 0 ? (
              <p className="text-sm text-gray-400">No reasons submitted</p>
            ) : (
              <ul className="space-y-1.5">
                {application.selectedReasons.map((reason) => (
                  <li key={reason} className="flex items-start justify-between gap-2">
                    <span className="text-sm text-gray-700 flex-1">
                      {PRIORITY_REASON_LABELS[reason]}
                    </span>
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs shrink-0">
                      {PRIORITY_REASON_POINTS[reason]} pts
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Total points */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-md border border-amber-200">
            <span className="text-sm font-medium text-amber-800">Total points</span>
            <span className="text-xl font-bold text-amber-700">{application.totalPoints}</span>
          </div>

          {/* Decision */}
          {application.decidedBy && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Decision
              </p>
              <p className="text-sm text-gray-700">
                Approved by <span className="font-medium">{application.decidedBy}</span>
                {application.decidedDate && (
                  <> on <span className="font-medium">{application.decidedDate}</span></>
                )}
              </p>
              {application.decisionNotes && (
                <p className="text-sm text-gray-500 mt-1 italic">"{application.decisionNotes}"</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
