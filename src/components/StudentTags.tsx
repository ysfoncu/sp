import { ReactNode, useState } from "react";
import { Check, Minus, Plus, Tag as TagIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  MAX_TAG_NAME,
  StudentTag,
  TagColor,
  TagState,
  createTag,
  deleteTag,
  tagCount,
  tagOn,
  toggleStudentTag,
} from "../types/studentTags";

// Tailwind needs the class names written out
const CHIP: Record<TagColor, { base: string; active: string; dot: string }> = {
  blue: { base: "border-blue-200 bg-blue-50 text-blue-800", active: "border-blue-600 bg-blue-600 text-white", dot: "bg-blue-500" },
  green: { base: "border-green-200 bg-green-50 text-green-800", active: "border-green-600 bg-green-600 text-white", dot: "bg-green-500" },
  amber: { base: "border-amber-200 bg-amber-50 text-amber-900", active: "border-amber-600 bg-amber-600 text-white", dot: "bg-amber-500" },
  rose: { base: "border-rose-200 bg-rose-50 text-rose-800", active: "border-rose-600 bg-rose-600 text-white", dot: "bg-rose-500" },
  violet: { base: "border-violet-200 bg-violet-50 text-violet-800", active: "border-violet-600 bg-violet-600 text-white", dot: "bg-violet-500" },
  teal: { base: "border-teal-200 bg-teal-50 text-teal-800", active: "border-teal-600 bg-teal-600 text-white", dot: "bg-teal-500" },
  orange: { base: "border-orange-200 bg-orange-50 text-orange-900", active: "border-orange-600 bg-orange-600 text-white", dot: "bg-orange-500" },
  slate: { base: "border-slate-300 bg-slate-100 text-slate-800", active: "border-slate-700 bg-slate-700 text-white", dot: "bg-slate-500" },
};

interface TagChipProps {
  tag: StudentTag;
  count?: number; // shown after the name
  active?: boolean; // the filter is on
  onClick?: () => void; // makes the chip a button (filter)
  onRemove?: () => void; // an x that takes the tag off the student
}

// A tag as a chip
export function TagChip({ tag, count, active = false, onClick, onRemove }: TagChipProps) {
  const c = CHIP[tag.color] ?? CHIP.slate;
  const cls = `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium leading-5 ${active ? c.active : c.base}`;
  const label = (
    <>
      <span className="max-w-[10rem] truncate">{tag.name}</span>
      {count !== undefined && <span className={active ? "text-white/80" : "opacity-70"}>{count}</span>}
    </>
  );
  return (
    <span className={cls}>
      {onClick ? (
        <button type="button" onClick={onClick} aria-pressed={active} title={active ? `Show all students again` : `Show the students tagged ${tag.name}`} className="inline-flex items-center gap-1">
          {label}
        </button>
      ) : (
        label
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove tag ${tag.name}`} title="Remove tag" className="-mr-0.5 rounded-full opacity-60 hover:opacity-100">
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

interface TagPickerProps {
  tagState: TagState;
  studentIds: string[]; // the student (or the ticked students) the tags go on; empty only makes tags
  children: ReactNode; // the trigger button
  title?: string;
}

// Puts tags on one or several students, and makes new ones: type a name, Enter makes the tag and puts it on them
export function TagPicker({ tagState, studentIds, children, title }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const q = text.trim().toLowerCase();
  const shown = tagState.tags.filter((t) => !q || t.name.toLowerCase().includes(q));
  const exact = tagState.tags.some((t) => t.name.toLowerCase() === q);

  const close = () => {
    setOpen(false);
    setText("");
    setError(null);
  };
  // Adding a tag (a new one, or an existing one put on) closes the dialog; taking one off keeps it open
  const create = () => {
    const r = createTag(text);
    if (r.error || !r.tag) return setError(r.error ?? "Could not make the tag");
    if (studentIds.length > 0) toggleStudentTag(studentIds, r.tag.id);
    close();
  };
  const toggle = (t: StudentTag) => {
    const adding = tagOn(tagState, studentIds, t.id) !== "all";
    toggleStudentTag(studentIds, t.id);
    if (adding) close();
  };
  const remove = (t: StudentTag) => {
    if (window.confirm(`Delete the tag "${t.name}"? It is taken off every student.`)) {
      deleteTag(t.id);
      toast.success(`Deleted the tag ${t.name}`);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setText("");
          setError(null);
        }
      }}
    >
      <PopoverTrigger asChild title={title}>
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
          {studentIds.length > 1 ? `Tags for ${studentIds.length} students` : studentIds.length === 1 ? "Tags for this student" : "Tags"}
        </p>
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q && !exact) {
              e.preventDefault();
              create();
            }
          }}
          maxLength={MAX_TAG_NAME}
          placeholder="Find or make a tag"
          aria-label="Find or make a tag"
          className="h-8"
        />
        {error && <p className="px-1 pt-1 text-xs text-red-600">{error}</p>}
        <ul className="mt-1 max-h-48 overflow-y-auto">
          {shown.map((t) => {
            const on = studentIds.length > 0 ? tagOn(tagState, studentIds, t.id) : "none";
            return (
              <li key={t.id} className="group flex items-center">
                <button
                  type="button"
                  disabled={studentIds.length === 0}
                  onClick={() => toggle(t)}
                  aria-pressed={on === "all"}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-gray-100 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${on === "none" ? "border-gray-300 bg-white" : "border-blue-600 bg-blue-600 text-white"}`}>
                    {on === "all" && <Check className="h-3 w-3" aria-hidden="true" />}
                    {on === "some" && <Minus className="h-3 w-3" aria-hidden="true" />}
                  </span>
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${(CHIP[t.color] ?? CHIP.slate).dot}`} aria-hidden="true" />
                  <span className="truncate text-gray-800">{t.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(t)}
                  aria-label={`Delete the tag ${t.name}`}
                  title="Delete tag"
                  className="rounded p-1 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
          {shown.length === 0 && !q && <li className="px-1.5 py-2 text-sm text-gray-500">No tags yet. Type a name to make one.</li>}
        </ul>
        {q && !exact && (
          <button
            type="button"
            onClick={create}
            className="mt-1 flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-sm text-blue-700 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">Make the tag "{text.trim()}"</span>
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface TagFilterBarProps {
  tagState: TagState;
  studentIds: string[]; // every student of the placement, for the counts
  picked: string[]; // the tags the list is filtered by
  onChange: (picked: string[]) => void;
  selectedIds?: string[]; // the students ticked in the list: "Tag N selected" puts tags on all of them
}

// The tags as chips above the list: a click shows the students that have the tag (several tags show those with any of them)
export function TagFilterBar({ tagState, studentIds, picked, onChange, selectedIds = [] }: TagFilterBarProps) {
  const toggle = (id: string) => onChange(picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]);
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-2" role="group" aria-label="Student tags">
      <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
        <TagIcon className="h-3.5 w-3.5" aria-hidden="true" /> Tags
      </span>
      {tagState.tags.map((t) => (
        <TagChip key={t.id} tag={t} count={tagCount(tagState, studentIds, t.id)} active={picked.includes(t.id)} onClick={() => toggle(t.id)} />
      ))}
      <TagPicker tagState={tagState} studentIds={[]} title="Make a new tag">
        <button type="button" className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-700">
          <Plus className="h-3 w-3" aria-hidden="true" /> New tag
        </button>
      </TagPicker>
      {picked.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Show all
        </button>
      )}
      {selectedIds.length > 0 && (
        <span className="ml-auto">
          <TagPicker tagState={tagState} studentIds={selectedIds} title="Put tags on the ticked students">
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100">
              <TagIcon className="h-3.5 w-3.5" aria-hidden="true" /> Tag {selectedIds.length} selected
            </button>
          </TagPicker>
        </span>
      )}
    </div>
  );
}
