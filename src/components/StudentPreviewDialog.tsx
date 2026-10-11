import { useState } from "react";
import { ContactAvatar } from "./ContactAvatar";
import { AlertTriangle, Calendar, Mail, MapPin, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { StudentView, missingInfo } from "../types/studentView";

export interface PreviewEntry {
  studentId: string;
  studentName: string;
  view?: StudentView; // missing when the student is not on a profile
  source: "live" | "published"; // from the profile as it is now, or the frozen snapshot
  changed: boolean; // the profile now tells students something different from what was published
  publishedAt?: string;
  version?: number;
}

interface StudentPreviewDialogProps {
  entries: PreviewEntry[];
  onClose: () => void;
}

// What one student would be told, as the student sees it. Warnings list what is still empty.
export function StudentPreviewDialog({ entries, onClose }: StudentPreviewDialogProps) {
  const [selected, setSelected] = useState(entries[0]?.studentId ?? "");
  const entry = entries.find((e) => e.studentId === selected) ?? entries[0];
  const view = entry?.view;
  const missing = view ? missingInfo(view.info) : [];

  const field = (title: string, value: string) =>
    value.trim() ? (
      <div>
        <p className="text-xs font-semibold text-gray-500">{title}</p>
        <p className="whitespace-pre-line text-sm text-gray-800">{value}</p>
      </div>
    ) : null;
  const toggle = (title: string, v: { available: boolean; text: string }) =>
    v.available || v.text.trim() ? field(title, v.text.trim() || "Available") : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>What students receive</DialogTitle>
          <DialogDescription>The placement as the student sees it, from the entity.</DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            No students are placed yet.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label htmlFor="preview-student" className="text-xs font-semibold text-gray-700">
                Student
              </label>
              <select
                id="preview-student"
                value={entry?.studentId}
                onChange={(e) => setSelected(e.target.value)}
                className="h-9 flex-1 rounded-md border border-gray-300 bg-white px-2 text-sm"
              >
                {entries.map((e) => (
                  <option key={e.studentId} value={e.studentId}>
                    {e.studentName}
                  </option>
                ))}
              </select>
            </div>

            {entry && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {entry.source === "published" ? (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                    Published{entry.version ? ` · entity v${entry.version}` : ""}
                    {entry.publishedAt ? ` · ${entry.publishedAt.slice(0, 10)}` : ""}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
                    Not published yet · from the profile as it is now
                  </Badge>
                )}
                {entry.changed && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                    The profile now says something different
                  </Badge>
                )}
              </div>
            )}

            {!view ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                {entry?.studentName} is not placed on a profile, so there is nothing to show. Place the student on a
                profile first.
              </p>
            ) : (
              <>
                {entry?.source === "live" && missing.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      The profile is missing {missing.join(", ")}. You can still publish. Fill it in under Praksis places →
                      Profiles.
                    </span>
                  </div>
                )}
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{view.profileName}</p>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {view.placeName} · {view.unitName}
                    </p>
                    {(view.startDate || view.endDate) && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {view.startDate}
                        {view.endDate ? ` – ${view.endDate}` : ""}
                      </p>
                    )}
                  </div>

                  {view.mentor && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Your mentor</p>
                      <div className="flex items-center gap-2">
                        <ContactAvatar name={view.mentor.name} photo={view.mentor.photo} className="size-8" />
                        <p className="text-sm text-gray-800">{view.mentor.name}</p>
                      </div>
                      {view.mentor.about && <p className="mt-1 text-xs text-gray-600">{view.mentor.about}</p>}
                      {(view.mentor.email || view.mentor.phone) && (
                        <p className="text-xs text-gray-500">{[view.mentor.email, view.mentor.phone].filter(Boolean).join(" · ")}</p>
                      )}
                    </div>
                  )}

                  {view.contacts.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Contacts</p>
                      <ul className="space-y-1">
                        {view.contacts.map((c, i) => (
                          <li key={`${c.name}-${i}`} className="flex items-start gap-2 text-sm text-gray-800">
                            <ContactAvatar name={c.name} photo={c.photo} className="size-8" />
                            <div className="min-w-0">
                            {c.name} <span className="text-xs text-gray-500">· {c.detail}</span>
                            {c.about && <span className="block text-xs text-gray-600">{c.about}</span>}
                            <span className="flex items-center gap-3 text-xs text-gray-500">
                              {c.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {c.email}
                                </span>
                              )}
                              {c.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {c.phone}
                                </span>
                              )}
                            </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {field("Contact before the placement", [view.info.contactBeforePlacement, view.info.contactPhone].filter((t) => t.trim()).join(" · "))}
                  {field("About the placement", view.info.activityDescription)}
                  {field("Work organisation", view.info.workOrganisation)}
                  {field("Work clothes", view.info.workClothes)}
                  {toggle("Housing", view.info.housing)}
                  {toggle("Public transport", view.info.publicTransport)}
                  {toggle("Changing room / locker", view.info.changingRoom)}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
