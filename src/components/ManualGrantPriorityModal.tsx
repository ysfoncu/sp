import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Search, Star } from "lucide-react";
import { cn } from "./ui/utils";
import {
  EnrolledStudent,
  PriorityPlacementApplication,
} from "../types/priorityPlacement";

interface ManualGrantPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrolledStudents: EnrolledStudent[];
  onGrant: (
    application: Omit<PriorityPlacementApplication, "id" | "submittedDate">
  ) => void;
  currentUserName: string;
}

export function ManualGrantPriorityModal({
  isOpen,
  onClose,
  enrolledStudents,
  onGrant,
  currentUserName,
}: ManualGrantPriorityModalProps) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<EnrolledStudent | null>(null);
  const [targetSemester, setTargetSemester] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return enrolledStudents;
    return enrolledStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.personnummer.includes(q)
    );
  }, [enrolledStudents, search]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!selectedStudent) errs.student = "Select a student";
    if (!targetSemester.trim()) errs.semester = "Enter a term, e.g. HT-2027";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleGrant() {
    if (!validate() || !selectedStudent) return;
    const now = new Date().toISOString().split("T")[0];
    onGrant({
      periodId: "",
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      personnummer: selectedStudent.personnummer,
      programId: selectedStudent.programId,
      programName: selectedStudent.programName,
      studyId: selectedStudent.studyId,
      studyName: selectedStudent.studyName,
      studyLocation: selectedStudent.studyLocation,
      admissionTerm: selectedStudent.admissionTerm,
      targetSemester: targetSemester.trim(),
      selectedReasons: [],
      totalPoints: 0,
      hasDriversLicense: selectedStudent.hasDriversLicense,
      status: "approved",
      decidedBy: currentUserName,
      decidedDate: now,
      decisionNotes: notes || undefined,
      isManualGrant: true,
    });
    handleClose();
  }

  function handleClose() {
    setSearch("");
    setSelectedStudent(null);
    setTargetSemester("");
    setNotes("");
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            Manual Priority Assignment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div>
            <Label>Search student (name or personal ID)</Label>
            <div className="relative mt-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            {errors.student && (
              <p className="text-xs text-red-500 mt-1">{errors.student}</p>
            )}
            <div className="mt-2 max-h-48 overflow-y-auto border rounded-md divide-y">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 p-3">No students found.</p>
              ) : (
                filtered.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                      selectedStudent?.id === s.id && "bg-blue-50 border-l-2 border-l-blue-600"
                    )}
                  >
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {s.personnummer} · {s.programName} · {s.admissionTerm} · {s.studyLocation}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedStudent && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
              <p className="font-semibold text-blue-800">{selectedStudent.name}</p>
              <p className="text-blue-600 text-xs mt-0.5">
                {selectedStudent.programName} · {selectedStudent.admissionTerm} · {selectedStudent.studyLocation}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="manual-semester">
              Term the priority applies to <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manual-semester"
              placeholder="E.g. HT-2027"
              value={targetSemester}
              onChange={(e) => setTargetSemester(e.target.value)}
              className={cn("mt-1", errors.semester && "border-red-400")}
            />
            {errors.semester && (
              <p className="text-xs text-red-500 mt-1">{errors.semester}</p>
            )}
          </div>

          <div>
            <Label htmlFor="manual-notes">Note (optional)</Label>
            <Textarea
              id="manual-notes"
              placeholder="E.g. reason for manual assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleGrant}>
            <Star size={14} className="mr-1" />
            Grant priority
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
