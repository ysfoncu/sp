import { XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Study } from "./SettingsView";

export interface MetadataFormData {
  title: string;
  year: string;
  semester: string;
  subject: string;
  startDate: string;
  endDate: string;
  students: number;
  studyId: string;
  programId: string;
  emne?: string;
}

interface PlacementMetadataFormProps {
  formData: MetadataFormData;
  studies: Study[];
  dateValidationError: string;
  startDateInputRef: React.RefObject<HTMLInputElement | null>;
  endDateInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (data: MetadataFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function PlacementMetadataForm({
  formData,
  studies,
  dateValidationError,
  startDateInputRef,
  endDateInputRef,
  onChange,
  onSubmit,
  onCancel,
}: PlacementMetadataFormProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Placement Details
          </h2>
          <p className="text-sm text-gray-600">
            Fill in the basic information to get started with your student
            placement program.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Study *
            </label>
            <Select
              value={formData.studyId}
              onValueChange={(value: string) =>
                onChange({ ...formData, studyId: value, programId: "" })
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a study" />
              </SelectTrigger>
              <SelectContent>
                {studies.map((study) => (
                  <SelectItem key={study.id} value={study.id}>
                    {study.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Study Program *
            </label>
            <Select
              value={formData.programId}
              onValueChange={(value: string) =>
                onChange({ ...formData, programId: value })
              }
              disabled={!formData.studyId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {formData.studyId &&
                  studies
                    .find((s) => s.id === formData.studyId)
                    ?.programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Emne (Subject) *
            </label>
            <Input
              value={formData.subject}
              onChange={(e) =>
                onChange({ ...formData, subject: e.target.value })
              }
              placeholder="e.g., Clinical Practice"
              className="h-10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-medium text-gray-700 text-sm block">
                Start Date *
              </label>
              <div className="relative">
                <Input
                  ref={startDateInputRef}
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    const startDate = e.target.value;
                    if (!startDate) {
                      onChange({ ...formData, startDate });
                      return;
                    }
                    const [yearStr, monthStr] = startDate.split("-");
                    const year = yearStr || "";
                    const month = parseInt(monthStr || "1", 10) - 1;
                    const semester = month < 7 ? "Spring" : "Autumn";
                    onChange({ ...formData, startDate, year, semester });
                  }}
                  className={`h-10 text-gray-900 [color-scheme:light] ${
                    dateValidationError ? "border-red-500" : ""
                  }`}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-medium text-gray-700 text-sm block">
                End Date *
              </label>
              <div className="relative">
                <Input
                  ref={endDateInputRef}
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    onChange({ ...formData, endDate: e.target.value })
                  }
                  className={`h-10 text-gray-900 [color-scheme:light] ${
                    dateValidationError ? "border-red-500" : ""
                  }`}
                  required
                />
              </div>
              {dateValidationError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {dateValidationError}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-gray-700 text-sm block">
              Placement title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                onChange({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Spring 2026 Nursing Placement"
              className="h-10"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save and Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
