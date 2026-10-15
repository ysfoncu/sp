import { useMemo } from "react";
import { Users } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { StudentFilters, StudentRow, studentMetrics } from "../types/praksisStudent";

interface StudentMetricsProps {
  rows: StudentRow[]; // the students of Praksis-students, with their state
  // Opens Praksis-students, with a status chip when one is given
  onOpen?: (status?: StudentFilters["status"]) => void;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// The few numbers of the Praksis-students page that tell the coordinator what to do next. Blue is "to do", amber is
// "check", green is "done"; nothing is red, because places never block a placement.
export function StudentMetricsStrip({ rows, onOpen }: StudentMetricsProps) {
  const m = useMemo(() => studentMetrics(rows), [rows]);

  if (rows.length === 0) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-gray-800">No students yet</p>
            <p className="text-xs text-gray-500">Import students to see who is waiting for a place.</p>
          </div>
        </div>
        {onOpen && (
          <Button size="sm" onClick={() => onOpen()} className="bg-blue-600 text-white hover:bg-blue-700">
            Go to Praksis-students
          </Button>
        )}
      </Card>
    );
  }

  interface Tile {
    key: string;
    label: string;
    value: string | number;
    tone: string;
    hint: string;
    bar?: number; // 0-100
    status?: StudentFilters["status"]; // makes the tile a link to the list with that chip
  }
  const tiles: Tile[] = [
    {
      key: "waiting",
      label: "Waiting for a place",
      value: m.waiting,
      tone: m.waiting > 0 ? "text-blue-700" : "text-gray-400",
      hint: m.waiting > 0 ? "Not in a placement yet" : "None waiting",
      status: "waiting",
    },
    {
      key: "planned",
      label: "Planned",
      value: m.planned,
      tone: m.planned > 0 ? "text-green-700" : "text-gray-400",
      hint: m.planned > 0 ? "Not published to students yet" : "None",
      status: "planned",
    },
    {
      key: "noMentor",
      label: "Supervisor not attached yet",
      value: m.noMentor,
      tone: m.noMentor > 0 ? "text-amber-700" : "text-gray-400",
      hint: m.hasPlace === 0 ? "No one has a place yet" : m.noMentor > 0 ? "Placed without a mentor" : "All have a mentor",
    },
    {
      key: "emner",
      label: "Total emner",
      value: m.emneCount,
      tone: m.emneCount > 0 ? "text-gray-800" : "text-gray-400",
      hint: m.emneCount > 0 ? `For ${plural(m.open, "open student")}` : "None",
    },
  ];

  return (
    <section aria-label="Student overview" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Student overview</h2>
        {onOpen && (
          <button type="button" onClick={() => onOpen()} className="text-sm text-blue-600 hover:underline">
            Praksis-students
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <>
              <div className="text-xs font-medium text-gray-600">{t.label}</div>
              <div className={`mt-1 text-2xl font-semibold ${t.tone}`}>{t.value}</div>
              {t.bar !== undefined && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label={t.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={t.bar}>
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${t.bar}%` }} />
                </div>
              )}
              <div className="mt-1 text-xs text-gray-500">{t.hint}</div>
            </>
          );
          return t.status && onOpen ? (
            <button
              key={t.key}
              type="button"
              onClick={() => onOpen(t.status)}
              title={`Show them in Praksis-students`}
              className="rounded-xl text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <Card className="h-full p-4 hover:border-blue-300">{body}</Card>
            </button>
          ) : (
            <Card key={t.key} className="p-4">
              {body}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
