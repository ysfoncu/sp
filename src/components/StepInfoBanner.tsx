import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "./ui/button";
import { STEP_INFO, stepInfoTitle } from "../types/stepInfo";
import { placementTasks } from "../types/placementTask";

const keyFor = (taskId: string) => `spm_hide_step_info_${taskId}`;

const isHidden = (key: string) => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

interface StepInfoBannerProps {
  taskId: string; // the placement task this explains (see stepInfo.ts)
  // Where "Don't show this again" is kept; a step has its own by default
  storageKey?: string;
  className?: string;
  // The step label ("1/2") when the banner is not for a placement task
  stepLabel?: string;
}

// The info banner of a placement step: the user's task and how to do it. "Got it" hides it for this visit,
// "Don't show this again" for good (per step). Give it a `key` of the task id so it starts over when the step changes.
export function StepInfoBanner({ taskId, storageKey, className = "", stepLabel }: StepInfoBannerProps) {
  const key = storageKey ?? keyFor(taskId);
  const [shown, setShown] = useState(() => !isHidden(key));
  const info = STEP_INFO[taskId];
  const label = stepLabel ?? placementTasks.find((t) => t.id === taskId)?.step;
  if (!info || !label || !shown) return null;

  const hideForGood = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* the banner is only hidden for this visit */
    }
    setShown(false);
  };

  return (
    <div className={`flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 ${className}`} role="note" aria-label="About this step">
      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm text-blue-900">
        <p className="font-semibold">{stepInfoTitle(label, info)}</p>
        <p className="mt-1 text-blue-800">{info.task}</p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-blue-800">
          {info.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setShown(false)} className="h-8 bg-blue-600 text-white hover:bg-blue-700">
            Got it
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={hideForGood} className="h-8 text-blue-800 hover:bg-blue-100">
            Don't show this again
          </Button>
        </div>
      </div>
    </div>
  );
}
