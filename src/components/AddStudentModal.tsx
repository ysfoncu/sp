import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Search, AlertTriangle } from "lucide-react";
import { EnrolledStudent } from "../types/priorityPlacement";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableStudents: EnrolledStudent[];
  noticeSent: boolean;
  onAdd: (studentIds: string[]) => void;
}

export function AddStudentModal({
  isOpen,
  onClose,
  availableStudents,
  noticeSent,
  onAdd,
}: AddStudentModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return availableStudents;
    return availableStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.personnummer.includes(q) ||
        s.programName.toLowerCase().includes(q)
    );
  }, [availableStudents, search]);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleAdd() {
    if (selectedIds.length === 0) return;
    onAdd(selectedIds);
    handleClose();
  }

  function handleClose() {
    setSearch("");
    setSelectedIds([]);
    onClose();
  }

  const count = selectedIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="max-w-lg flex flex-col" style={{ maxHeight: "80vh" }}>
        <DialogHeader>
          <DialogTitle>Add student</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
          {noticeSent && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700 shrink-0">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>
                First notice has already been sent. Students added now will not receive it
                automatically — use the bell icon in the actions column to notify them
                individually.
              </span>
            </div>
          )}

          <div className="relative shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Search by name or personal ID..."
              className="pl-8 text-sm"
            />
          </div>

          <div className="border rounded-md divide-y overflow-y-auto flex-1">
            {availableStudents.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                All eligible students are already imported
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No students found</div>
            ) : (
              filtered.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggle(student.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(student.id)}
                    onCheckedChange={() => toggle(student.id)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.personnummer}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant="outline"
                      className="text-xs border-blue-200 text-blue-700 bg-blue-50"
                    >
                      {student.programName.split(" ")[0]}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-0.5">{student.admissionTerm}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={count === 0}
            onClick={handleAdd}
          >
            Add {count > 0 ? `${count} ` : ""}
            {count === 1 ? "student" : "students"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
