import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

interface AssignmentPublishBannerProps {
  isPublished: boolean;
  publishedDate: string | null;
  wasEverPublished: boolean;
  onPublish: () => void;
  onCancelEdit: () => void;
  // Students placed without a mentor (not blocking)
  needsMentor?: number;
  // Opens the preview of what students receive
  onPreview?: () => void;
  // Students whose profile now says something different from what was published, and the action to update them
  changedCount?: number;
  onUpdatePublished?: () => void;
}

export function AssignmentPublishBanner({
  isPublished,
  publishedDate,
  wasEverPublished,
  onPublish,
  onCancelEdit,
  needsMentor = 0,
  onPreview,
  changedCount = 0,
  onUpdatePublished,
}: AssignmentPublishBannerProps) {
  return (
    <div
      className={`border rounded-xl p-4 flex items-center justify-between ${
        isPublished
          ? "bg-green-50 border-green-200"
          : "bg-green-50 border-green-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <div className="font-semibold text-green-900">
            {isPublished
              ? "Assignments published"
              : "All students assigned — ready to publish"}
          </div>
          <div className="text-sm text-green-700 mt-0.5">
            {isPublished
              ? `Published on ${publishedDate}`
              : "Publishing will lock all assignments and notify the praksis places."}
          </div>
          {changedCount > 0 && (
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
          {!isPublished && needsMentor > 0 && (
            <div className="mt-1 text-sm text-amber-700">
              {needsMentor} student{needsMentor === 1 ? " has" : "s have"} no mentor yet. You can still publish.
            </div>
          )}
        </div>
      </div>

      {!isPublished && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {onPreview && (
            <Button variant="outline" onClick={onPreview} className="border-green-300 text-green-800 hover:bg-green-100">
              Preview what students receive
            </Button>
          )}
          {wasEverPublished && (
            <Button
              variant="outline"
              onClick={onCancelEdit}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel edit
            </Button>
          )}
          <Button
            onClick={onPublish}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Publish assignments
          </Button>
        </div>
      )}

      {isPublished && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {onPreview && (
            <Button variant="outline" onClick={onPreview} className="border-green-300 text-green-800 hover:bg-green-100">
              What students received
            </Button>
          )}
          <div className="flex items-center gap-1.5 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Published</span>
          </div>
        </div>
      )}
    </div>
  );
}
