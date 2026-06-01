import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import {
  EnrolledStudent,
  PriorityPlacementApplication,
  PriorityPlacementPeriod,
  PriorityReason,
  PRIORITY_REASON_LABELS,
  PRIORITY_REASON_POINTS,
} from "../types/priorityPlacement";

const MAX_FILES = 10;

interface AttachedFile {
  name: string;
  size: number;
}

interface SubmitOnBehalfModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: EnrolledStudent | null;
  period: PriorityPlacementPeriod;
  onSubmit: (application: Omit<PriorityPlacementApplication, "id" | "submittedDate">) => void;
}

export function SubmitOnBehalfModal({
  isOpen,
  onClose,
  student,
  period,
  onSubmit,
}: SubmitOnBehalfModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [selectedReasons, setSelectedReasons] = useState<PriorityReason[]>([]);
  const [hasDriversLicense, setHasDriversLicense] = useState<boolean>(
    student?.hasDriversLicense ?? false
  );
  const [placementConstraints, setPlacementConstraints] = useState("");
  const [step1Error, setStep1Error] = useState("");

  // Step 2 state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPoints = selectedReasons.reduce(
    (sum, r) => sum + PRIORITY_REASON_POINTS[r],
    0
  );

  function toggleReason(reason: PriorityReason) {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
    setStep1Error("");
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
    setAttachedFiles((prev) => {
      const combined = [...prev, ...pdfs.map((f) => ({ name: f.name, size: f.size }))];
      return combined.slice(0, MAX_FILES);
    });
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleNext() {
    if (selectedReasons.length === 0) {
      setStep1Error("Select at least one reason");
      return;
    }
    setStep1Error("");
    setStep(2);
  }

  function handleSubmit() {
    if (!student) return;
    onSubmit({
      periodId: period.id,
      studentId: student.id,
      studentName: student.name,
      personnummer: student.personnummer,
      programId: student.programId,
      programName: student.programName,
      studyId: student.studyId,
      studyName: student.studyName,
      studyLocation: student.studyLocation,
      admissionTerm: student.admissionTerm,
      targetSemester: `${period.semester}-${period.year}`,
      selectedReasons,
      totalPoints,
      hasDriversLicense,
      placementConstraints: placementConstraints.trim() || undefined,
      status: "pending",
      isManualGrant: false,
      published: false,
      attachedDocuments: attachedFiles.length > 0 ? attachedFiles : undefined,
    });
    handleClose();
  }

  function handleClose() {
    setStep(1);
    setSelectedReasons([]);
    setHasDriversLicense(student?.hasDriversLicense ?? false);
    setPlacementConstraints("");
    setStep1Error("");
    setAttachedFiles([]);
    setIsDragging(false);
    onClose();
  }

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Priority request on behalf of {student.name}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Term: <span className="font-medium text-gray-700">{period.semester}-{period.year}</span>
          </p>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-3 py-1">
          {[
            { n: 1, label: "Application" },
            { n: 2, label: "Documents" },
          ].map(({ n, label }, idx) => (
            <div key={n} className="flex items-center gap-2">
              {idx > 0 && <div className="w-8 h-px bg-gray-200" />}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    step === n
                      ? "bg-blue-600 text-white"
                      : step > n
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {n}
                </div>
                <span
                  className={`text-sm font-medium ${
                    step === n ? "text-blue-700" : step > n ? "text-green-700" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Step 1 ─────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6 py-1">
            {/* Student information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Student information
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Name</p>
                  <p className="font-medium text-gray-800">{student.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Personal ID</p>
                  <p className="font-medium text-gray-800">{student.personnummer}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Programme</p>
                  <p className="font-medium text-gray-800">{student.programName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Cohort</p>
                  <p className="font-medium text-gray-800">{student.admissionTerm}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Email</p>
                  <p className="font-medium text-gray-800">{student.email}</p>
                </div>
                {student.phone && (
                  <div>
                    <p className="text-gray-500 text-xs">Mobile</p>
                    <p className="font-medium text-gray-800">{student.phone}</p>
                  </div>
                )}
                {student.temporaryAddress && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Temporary address</p>
                    <p className="font-medium text-gray-800">{student.temporaryAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Priority reasons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold text-gray-700">Priority reasons</Label>
                {totalPoints > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                    {totalPoints} pts total
                  </Badge>
                )}
              </div>
              {step1Error && <p className="text-xs text-red-500 mb-2">{step1Error}</p>}
              <div className="border rounded-md divide-y">
                {(Object.keys(PRIORITY_REASON_LABELS) as PriorityReason[]).map((reason) => (
                  <div
                    key={reason}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleReason(reason)}
                  >
                    <Checkbox
                      id={`reason-behalf-${reason}`}
                      checked={selectedReasons.includes(reason)}
                      onCheckedChange={() => toggleReason(reason)}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex items-start justify-between w-full gap-3 min-w-0">
                      <label
                        htmlFor={`reason-behalf-${reason}`}
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                      >
                        {PRIORITY_REASON_LABELS[reason]}
                      </label>
                      <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-xs shrink-0">
                        {PRIORITY_REASON_POINTS[reason]} pts
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver's license */}
            <div>
              <Label className="text-sm font-semibold text-gray-700">Driver's license</Label>
              <div className="mt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="behalf-driversLicense"
                    checked={hasDriversLicense}
                    onChange={() => setHasDriversLicense(true)}
                    className="accent-blue-600"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="behalf-driversLicense"
                    checked={!hasDriversLicense}
                    onChange={() => setHasDriversLicense(false)}
                    className="accent-blue-600"
                  />
                  No
                </label>
              </div>
            </div>

            {/* Placement constraints */}
            <div>
              <Label htmlFor="behalf-constraints" className="text-sm font-semibold text-gray-700">
                Additional information for coordinator
              </Label>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                If there are compelling reasons that prevent the student from being placed at a
                specific unit (e.g. a relative works there), describe it here.
              </p>
              <Textarea
                id="behalf-constraints"
                value={placementConstraints}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setPlacementConstraints(e.target.value)
                }
                placeholder="Describe any specific placement constraints..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Step 2 ─────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4 py-1">
            <div>
              <p className="text-sm font-semibold text-gray-700">Supporting documents</p>
              <p className="text-xs text-gray-500 mt-1">
                Attach PDF documents that support the priority reasons (e.g. medical certificate,
                birth certificate). Maximum {MAX_FILES} files.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => attachedFiles.length < MAX_FILES && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-8 cursor-pointer transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : attachedFiles.length >= MAX_FILES
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <Upload size={24} className="text-gray-400" />
              <p className="text-sm text-gray-600 font-medium">
                {attachedFiles.length >= MAX_FILES
                  ? "Maximum files reached"
                  : "Click or drag PDF files here"}
              </p>
              <p className="text-xs text-gray-400">
                {attachedFiles.length} / {MAX_FILES} files added · PDF only
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {/* File list */}
            {attachedFiles.length > 0 && (
              <ul className="space-y-2">
                {attachedFiles.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                  >
                    <FileText size={16} className="text-red-500 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatSize(file.size)}</span>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {attachedFiles.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                <AlertCircle size={13} />
                No documents attached. You can submit without documents.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleNext}>
                Next: Documents
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit}>
                Submit application
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
