import { useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

// One block of the entity page. It is read-only until Edit is pressed; then only this block is edited and it
// has its own Save and Cancel. A missing block says so in its header.
export function SectionCard({
  id,
  title,
  missing,
  editing = false,
  onEdit,
  editDisabled,
  onSave,
  onCancel,
  saveDisabled,
  saveHint,
  children,
}: {
  id: string;
  title: string;
  missing?: string; // what is missing, e.g. "Not set"; nothing when complete
  editing?: boolean;
  onEdit?: () => void; // when absent the block has no Edit button (read-only block)
  editDisabled?: string; // why Edit is not available
  onSave?: () => void;
  onCancel?: () => void;
  saveDisabled?: boolean;
  saveHint?: string; // why Save is disabled
  children: React.ReactNode;
}) {
  // Leaving edit mode (Save or Cancel) hands focus back to this block's Edit button
  const was = useRef(editing);
  useEffect(() => {
    if (was.current && !editing) document.querySelector<HTMLButtonElement>(`#entity-${id} button[aria-label^="Edit"]`)?.focus();
    was.current = editing;
  }, [editing, id]);

  return (
    <section
      id={`entity-${id}`}
      className={cn("scroll-mt-16 rounded-lg border bg-white", editing ? "border-purple-300 ring-1 ring-purple-100" : missing ? "border-amber-200" : "border-gray-200")}
      aria-label={title}
    >
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5">
        <h4 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900">
          <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", missing ? "bg-amber-500" : "bg-green-500")} aria-hidden />
          <span className="truncate">{title}</span>
          {missing && !editing && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">{missing}</span>}
          {editing && <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-800">Editing</span>}
        </h4>
        {onEdit && !editing && (
          <Button type="button" variant="outline" size="sm" onClick={onEdit} disabled={!!editDisabled} title={editDisabled} className="h-7 gap-1.5 px-2.5 text-xs" aria-label={`Edit ${title}`}>
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        )}
      </header>
      <div className="space-y-3 px-4 py-3">{children}</div>
      {editing && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-2.5">
          {saveDisabled && saveHint && <p className="mr-auto text-xs text-amber-800">{saveHint}</p>}
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={onSave} disabled={saveDisabled}>
            Save
          </Button>
        </footer>
      )}
    </section>
  );
}

// What a missing block shows in view mode: what is missing and how to add it
export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2 text-sm text-amber-900">{children}</p>;
}
