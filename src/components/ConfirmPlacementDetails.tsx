import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";

interface ConfirmData {
  title: string;
  startDate: string;
  endDate: string;
  totalPraksisHours?: number;
}

interface ConfirmPlacementDetailsProps {
  request: CoordinatorQuotaRequest;
  studyName: string;
  onBack: () => void;
  onCreate: (data: ConfirmData) => void;
}

function fmt(d: string): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ConfirmPlacementDetails({
  request,
  studyName,
  onBack,
  onCreate,
}: ConfirmPlacementDetailsProps) {
  const [yearStr, monthStr] = (request.startDate || "").split("-");
  const semester = parseInt(monthStr || "1", 10) < 7 ? "Spring" : "Autumn";
  const defaultTitle = `${studyName}/${request.emne || ""}/${yearStr || ""}/${semester}`;

  const [title, setTitle] = useState(defaultTitle);
  const [startDate, setStartDate] = useState(request.startDate);
  const [endDate, setEndDate] = useState(request.endDate);
  const [hours, setHours] = useState<string>("");
  const [datesConfirmed, setDatesConfirmed] = useState(false);

  const canCreate = datesConfirmed && !!title.trim() && !!startDate && !!endDate;

  const locked: { k: string; v: string }[] = [
    { k: "Praksis place", v: request.praksisPlaceName },
    { k: "Programme", v: request.programName },
    { k: "Emne", v: request.emne || "—" },
    { k: "Quota window", v: `${fmt(request.startDate)} – ${fmt(request.endDate)}` },
  ];

  return (
    <div className="px-8 py-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-800">Confirm placement details</h2>
      <p className="text-sm text-gray-500 mt-1 mb-5 max-w-2xl">
        These come from the quota request and are locked so the placement stays matched. Name it,
        confirm the dates, then create.
      </p>

      <div className="w-full border border-gray-200 rounded-lg bg-white p-5">
        {/* Locked details from the request */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
          {locked.map((f) => (
            <div key={f.k}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700/70 mb-0.5">
                {f.k}
              </div>
              <div className="font-medium text-gray-800 flex items-center gap-1.5">
                {f.k === "Praksis place" && <Lock className="h-3 w-3 text-blue-300" />}
                {f.v}
              </div>
            </div>
          ))}
        </div>

        {/* Editable */}
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700 block mb-1.5">Placement title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 block mb-1.5">Start date</span>
            <Input
              type="date"
              value={startDate}
              min={request.startDate}
              max={request.endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10"
            />
            <span className="text-xs text-gray-400 mt-1 block">On or after {fmt(request.startDate)}</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 block mb-1.5">End date</span>
            <Input
              type="date"
              value={endDate}
              min={request.startDate}
              max={request.endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10"
            />
            <span className="text-xs text-gray-400 mt-1 block">On or before {fmt(request.endDate)}</span>
          </label>
        </div>

        <label className="block mt-4 max-w-[220px]">
          <span className="text-sm font-medium text-gray-700 block mb-1.5">
            Total praksis hours <span className="text-gray-400 font-normal">(optional)</span>
          </span>
          <Input
            type="number"
            min={0}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 320"
            className="h-10"
          />
        </label>

        {/* Dates-correct confirmation — amber = "needs your confirmation" */}
        <label className="flex items-start gap-3 mt-5 p-3.5 rounded-lg bg-amber-50 border border-amber-300 cursor-pointer hover:bg-amber-100/70 transition-colors">
          <Checkbox
            checked={datesConfirmed}
            onCheckedChange={(v: boolean) => setDatesConfirmed(!!v)}
            className="mt-0.5 border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
          />
          <span className="text-sm text-amber-900">
            The <b>start and end dates are correct</b> for this placement
            <span className="block text-xs text-amber-700 mt-0.5">
              {fmt(startDate)} – {fmt(endDate)} (within the quota window)
            </span>
          </span>
        </label>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to capacity
          </button>
          <Button
            disabled={!canCreate}
            onClick={() =>
              onCreate({
                title: title.trim(),
                startDate,
                endDate,
                totalPraksisHours: hours === "" ? undefined : Number(hours),
              })
            }
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400"
          >
            Create &amp; open
          </Button>
        </div>
      </div>
    </div>
  );
}
