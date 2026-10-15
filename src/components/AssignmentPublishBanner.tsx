import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { PublishState } from "../types/publishState";

interface AssignmentPublishBannerProps {
  publishState: PublishState;
  entitiesDate: string | null;
  studentsDate: string | null;
  // "Cancel edit" gives back what was published before Edit
  canCancelEdit: boolean;
  onPublishEntities: () => void;
  onPublishStudents: () => void;
  onCancelEdit: () => void;
  // Students placed without a mentor (not blocking)
  needsMentor?: number;
  // Opens the preview of what students receive
  onPreview?: () => void;
  // Students whose profile now says something different from what was published, and the action to update them
  changedCount?: number;
  onUpdatePublished?: () => void;
}

// The two publish steps once every student is placed: to the entities first, then to the students
export function AssignmentPublishBanner({
  publishState,
  entitiesDate,
  studentsDate,
  canCancelEdit,
  onPublishEntities,
  onPublishStudents,
  onCancelEdit,
  needsMentor = 0,
  onPreview,
  changedCount = 0,
  onUpdatePublished,
}: AssignmentPublishBannerProps) {
  // Green is for the last step only (published to students); the steps before it are indigo
  const done = publishState === "students";
  const c = done
    ? { box: "bg-green-50 border-green-200", icon: "bg-green-100", iconText: "text-green-600", title: "text-green-900", text: "text-green-700", outline: "border-green-300 text-green-800 hover:bg-green-100", primary: "bg-green-600 hover:bg-green-700 text-white" }
    : { box: "bg-indigo-50 border-indigo-200", icon: "bg-indigo-100", iconText: "text-indigo-600", title: "text-indigo-900", text: "text-indigo-800", outline: "border-indigo-300 text-indigo-800 hover:bg-indigo-100", primary: "bg-indigo-600 hover:bg-indigo-700 text-white" };
  const title =
    publishState === "students"
      ? "Published to students"
      : publishState === "entities"
        ? "Published to entities, not yet to students"
        : "All students assigned — ready to publish to entities";
  const text =
    publishState === "students"
      ? `Students were told on ${studentsDate}. Entities were told on ${entitiesDate}. Use Edit to change assignments.`
      : publishState === "entities"
        ? `Entities were told on ${entitiesDate}. The students cannot see their placement until you publish to them. Assignments are locked; use Edit to change them.`
        : "Publishing to entities records that they can see this placement (nothing is sent from this prototype) and locks the assignments. Students are told in the next step.";

  return (
    <div className={`border rounded-xl p-4 flex items-center justify-between gap-4 ${c.box}`}>
      <div className="flex items-center gap-3">
        <div className={`${c.icon} p-2 rounded-lg flex-shrink-0`}>
          <CheckCircle className={`h-5 w-5 ${c.iconText}`} />
        </div>
        <div>
          <div className={`font-semibold ${c.title}`}>{title}</div>
          <div className={`text-sm ${c.text} mt-0.5`}>{text}</div>
          {changedCount > 0 && publishState === "students" && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-amber-700">
              <span>
                The profile now says something different for {changedCount} student{changedCount === 1 ? "" : "s"} than
                what was published.
              </span>
              {onUpdatePublished && (
                <button type="button" onClick={onUpdatePublished} className="font-medium underline hover:text-amber-900">
                  Update published information
                </button>
              )}
            </div>
          )}
          {publishState !== "students" && needsMentor > 0 && (
            <div className="mt-1 text-sm text-amber-700">
              {needsMentor} student{needsMentor === 1 ? " has" : "s have"} no mentor yet. You can still publish.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onPreview && (
          <Button variant="outline" onClick={onPreview} className={c.outline}>
            {publishState === "students" ? "What students received" : "Preview what students receive"}
          </Button>
        )}
        {publishState === "none" && canCancelEdit && (
          <Button variant="outline" onClick={onCancelEdit} className="border-gray-300 text-gray-600 hover:bg-gray-50">
            Cancel edit
          </Button>
        )}
        {publishState === "none" && (
          <>
            <Button onClick={onPublishEntities} className={c.primary}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish to entities
            </Button>
            <Button disabled title="Publish to entities first" variant="outline" className={c.outline}>
              Publish to students
            </Button>
          </>
        )}
        {publishState === "entities" && (
          <Button onClick={onPublishStudents} className={c.primary}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Publish to students
          </Button>
        )}
        {publishState === "students" && (
          <div className="flex items-center gap-1.5 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Published</span>
          </div>
        )}
      </div>
    </div>
  );
}
