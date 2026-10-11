import { cn } from "./ui/utils";
import { emneMeta, findProgram, programLabel } from "../types/studyCatalog";

// The program an entity accepts and the emner under it, one level below the other:
//   Sykepleie          Helsefag
//   │ Praksis 1 – …
//   └ Praksis 2 – …
// An archived or removed program or emne stays readable.
export function AcceptedProgramTree({ programId, emneIds, className }: { programId: string; emneIds: string[]; className?: string }) {
  const found = findProgram(programId);
  const emner = emneIds.map((id) => {
    const e = found?.program.emner?.find((x) => x.id === id);
    return { id, name: e?.name ?? "Unknown emne", archived: !!e?.archived, meta: e ? emneMeta(e).join(" · ") : "" };
  });

  return (
    <div className={cn("text-sm", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium text-gray-900">{found ? programLabel(found.program) : "Unknown program"}</span>
        {found && <span className="text-xs text-gray-500">{found.study.name}</span>}
        {found?.program.archived && <span className="text-xs text-gray-400">(archived)</span>}
      </p>
      {emner.length === 0 ? (
        <p className="ml-1 border-l border-gray-200 pl-3 text-xs text-gray-500">No emner</p>
      ) : (
        <ul className="ml-1 border-l border-gray-200 pl-3">
          {emner.map((e) => (
            <li key={e.id} className={cn("relative py-0.5 text-gray-700 before:absolute before:-left-3 before:top-1/2 before:h-px before:w-2.5 before:bg-gray-200", e.archived && "text-gray-400")}>
              {e.name}
              {e.meta && <span className="ml-2 text-xs text-gray-500">{e.meta}</span>}
              {e.archived && <span className="ml-1 text-xs">(archived)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
