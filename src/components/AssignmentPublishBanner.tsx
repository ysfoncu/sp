import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

interface AssignmentPublishBannerProps {
  isPublished: boolean;
  publishedDate: string | null;
  wasEverPublished: boolean;
  onPublish: () => void;
  onCancelEdit: () => void;
}

export function AssignmentPublishBanner({
  isPublished,
  publishedDate,
  wasEverPublished,
  onPublish,
  onCancelEdit,
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
        </div>
      </div>

      {!isPublished && (
        <div className="flex items-center gap-2 flex-shrink-0">
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
        <div className="flex items-center gap-1.5 text-green-700 text-sm flex-shrink-0">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">Published</span>
        </div>
      )}
    </div>
  );
}
