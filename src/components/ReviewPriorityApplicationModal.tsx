import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { CheckCircle2, XCircle, Star, Car } from "lucide-react";
import {
  PriorityPlacementApplication,
  PRIORITY_REASON_LABELS,
  PRIORITY_REASON_POINTS,
} from "../types/priorityPlacement";

interface ReviewPriorityApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: PriorityPlacementApplication | null;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, notes: string) => void;
}

export function ReviewPriorityApplicationModal({
  isOpen,
  onClose,
  application,
  onApprove,
  onReject,
}: ReviewPriorityApplicationModalProps) {
  const [notes, setNotes] = useState("");
  const [showRejectFields, setShowRejectFields] = useState(false);
  const [rejectError, setRejectError] = useState("");

  const isReadOnly = application?.status !== "pending";

  useEffect(() => {
    if (!isOpen) {
      setNotes("");
      setShowRejectFields(false);
      setRejectError("");
    } else if (application) {
      setNotes(application.decisionNotes ?? "");
    }
  }, [isOpen, application]);

  if (!application) return null;

  function handleApprove() {
    onApprove(application!.id, notes || undefined);
    onClose();
  }

  function handleReject() {
    if (!notes.trim()) {
      setRejectError("Enter a reason for rejection.");
      return;
    }
    onReject(application!.id, notes);
    onClose();
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Priority Application</DialogTitle>
            <Badge className={`${statusColors[application.status]} border text-xs`}>
              {statusLabels[application.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Student info */}
          <div className="bg-gray-50 rounded-md border p-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-500">Name:</span>
            <span className="font-semibold">{application.studentName}</span>
            <span className="text-gray-500">Personal ID:</span>
            <span>{application.personnummer}</span>
            <span className="text-gray-500">Programme:</span>
            <span>{application.programName}</span>
            <span className="text-gray-500">Cohort:</span>
            <span>{application.admissionTerm}</span>
            <span className="text-gray-500">Study location:</span>
            <span>{application.studyLocation}</span>
            <span className="text-gray-500">Term:</span>
            <span className="font-medium">{application.targetSemester}</span>
            <span className="text-gray-500">Submitted:</span>
            <span>{application.submittedDate}</span>
          </div>

          {/* Reasons */}
          {application.isManualGrant ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <Star size={16} className="text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700">
                Manually granted priority — no application reasons registered.
              </span>
            </div>
          ) : application.selectedReasons.length > 0 ? (
            <div>
              <Label className="text-sm font-semibold text-gray-700">Stated reasons</Label>
              <div className="mt-2 space-y-2">
                {application.selectedReasons.map((reason) => (
                  <div
                    key={reason}
                    className="flex items-center justify-between p-2 rounded border bg-white text-sm"
                  >
                    <span className="text-gray-700">{PRIORITY_REASON_LABELS[reason]}</span>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 border shrink-0 ml-2">
                      {PRIORITY_REASON_POINTS[reason]} p
                    </Badge>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 rounded border bg-blue-50 text-sm font-semibold">
                  <span className="text-blue-700">Total</span>
                  <Badge className="bg-blue-600 text-white">
                    {application.totalPoints} p
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No reasons stated.</p>
          )}

          {/* Additional info */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Other</Label>
            <div className="flex items-center gap-2 text-sm">
              <Car size={15} className="text-gray-400" />
              <span className="text-gray-600">
                Driver's license: <span className="font-medium">{application.hasDriversLicense ? "Yes" : "No"}</span>
              </span>
            </div>
            {application.placementConstraints && (
              <div className="p-3 bg-gray-50 rounded border text-sm text-gray-700">
                <span className="font-medium text-gray-600 block mb-1">
                  Notes for coordinator:
                </span>
                {application.placementConstraints}
              </div>
            )}
          </div>

          {/* Decision section */}
          {isReadOnly ? (
            application.decisionNotes && (
              <div>
                <Label className="text-sm font-semibold text-gray-700">Decision notes</Label>
                <p className="mt-1 text-sm text-gray-600 p-3 bg-gray-50 rounded border">
                  {application.decisionNotes}
                </p>
                {application.decidedBy && (
                  <p className="text-xs text-gray-400 mt-1">
                    Decided by {application.decidedBy} on {application.decidedDate}
                  </p>
                )}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {showRejectFields ? (
                <div>
                  <Label htmlFor="reject-notes" className="text-sm font-semibold text-gray-700">
                    Reason for rejection <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reject-notes"
                    placeholder="Describe why the application is rejected..."
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setRejectError("");
                    }}
                    className="mt-1"
                    rows={3}
                  />
                  {rejectError && <p className="text-xs text-red-500 mt-1">{rejectError}</p>}
                </div>
              ) : (
                <div>
                  <Label htmlFor="approve-notes" className="text-sm font-semibold text-gray-700">
                    Note (optional)
                  </Label>
                  <Textarea
                    id="approve-notes"
                    placeholder="Optional comment..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            {isReadOnly ? "Close" : "Cancel"}
          </Button>
          {!isReadOnly && !showRejectFields && (
            <>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowRejectFields(true)}
              >
                <XCircle size={15} className="mr-1" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
              >
                <CheckCircle2 size={15} className="mr-1" />
                Approve
              </Button>
            </>
          )}
          {!isReadOnly && showRejectFields && (
            <>
              <Button variant="outline" onClick={() => setShowRejectFields(false)}>
                Back
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
              >
                Confirm rejection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
