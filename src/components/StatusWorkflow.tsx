import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  CheckCircle,
  Clock,
  Upload,
  Users,
  Eye,
  AlertCircle,
  FileEdit,
} from "lucide-react";

interface StudentPlacement {
  id: string;
  title: string;
  year: string;
  semester: string;
  subject: string;
  students: number;
  startDate: string;
  endDate: string;
  status: "draft" | "upload" | "select" | "publish" | "completed";
  studyId: string;
  programId: string;
}

interface StatusWorkflowProps {
  placement: StudentPlacement;
  onStatusChange?: (
    placementId: string,
    newStatus: StudentPlacement["status"],
  ) => void;
}

const statusConfig = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "bg-gray-50 text-gray-600 border-gray-200",
    step: 0,
    progress: 0,
    nextStep: "upload" as const,
    nextLabel: "Save and continue",
    description: "Complete placement details to continue",
  },
  upload: {
    label: "Upload students",
    icon: Upload,
    color: "bg-orange-50 text-orange-600 border-orange-200",
    step: 1,
    progress: 25,
    nextStep: "select" as const,
    nextLabel: "Select praksis places",
    description: "Upload student list and basic information",
  },
  select: {
    label: "Select praksis places",
    icon: Users,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    step: 2,
    progress: 50,
    nextStep: "publish" as const,
    nextLabel: "Publish placement",
    description:
      "Choose and assign praksis placement locations",
  },
  publish: {
    label: "Published",
    icon: Eye,
    color: "bg-purple-50 text-purple-600 border-purple-200",
    step: 3,
    progress: 75,
    nextStep: "completed" as const,
    nextLabel: "Mark as completed",
    description: "Placement is live and students can apply",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "bg-green-50 text-green-600 border-green-200",
    step: 4,
    progress: 100,
    nextStep: null,
    nextLabel: null,
    description: "All students have been successfully placed",
  },
};

const allSteps = [
  { key: "draft", label: "Draft", icon: FileEdit },
  { key: "upload", label: "Upload", icon: Upload },
  { key: "select", label: "Select", icon: Users },
  { key: "publish", label: "Publish", icon: Eye },
  { key: "completed", label: "Complete", icon: CheckCircle },
];

export function StatusBadge({
  status,
}: {
  status: StudentPlacement["status"];
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      className={`${config.color} font-normal text-xs px-2 py-1 h-6 flex items-center gap-1`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function StatusWorkflowStepper({
  placement,
  onStatusChange,
}: StatusWorkflowProps) {
  const currentConfig = statusConfig[placement.status];
  const currentStep = currentConfig.step;

  const handleNextStep = () => {
    if (currentConfig.nextStep && onStatusChange) {
      onStatusChange(placement.id, currentConfig.nextStep);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">
            Placement Progress
          </h4>
          <p className="text-xs text-gray-500">
            {currentConfig.description}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">
            Step {currentStep} of 5
          </div>
          <div className="text-sm font-medium text-gray-900">
            {currentConfig.progress}% Complete
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={currentConfig.progress}
          className="h-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Started</span>
          <span>In Progress</span>
          <span>Completed</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {allSteps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep - 1;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isCompleted
                    ? "bg-green-100 border-green-500 text-green-600"
                    : isCurrent
                      ? "bg-blue-100 border-blue-500 text-blue-600"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-xs mt-1 ${
                  isCompleted || isCurrent
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next Action */}
      {currentConfig.nextStep && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Ready for next step
              </p>
              <p className="text-xs text-blue-700">
                {currentConfig.nextLabel}
              </p>
            </div>
          </div>
          {onStatusChange && (
            <Button
              size="sm"
              onClick={() =>
                window.open(
                  "https://strong-sunset-12139613.figma.site/",
                  "_blank",
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue
            </Button>
          )}
        </div>
      )}

      {/* Completed State */}
      {placement.status === "completed" && (
        <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
          <p className="text-sm font-medium text-green-900">
            Placement completed successfully!
          </p>
        </div>
      )}
    </div>
  );
}

export function StatusCard({
  placement,
  compact = false,
}: {
  placement: StudentPlacement;
  compact?: boolean;
}) {
  const config = statusConfig[placement.status];
  const Icon = config.icon;

  if (compact) {
    return <StatusBadge status={placement.status} />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div
            className={`p-2 rounded-lg ${config.color.replace("text-", "bg-").replace("border-", "bg-").split(" ")[0]} mr-3`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {config.label}
            </h4>
            <p className="text-xs text-gray-500">
              {config.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">
            Step {config.step}/5
          </div>
          <div className="text-sm font-medium text-gray-900">
            {config.progress}%
          </div>
        </div>
      </div>

      <Progress value={config.progress} className="h-2" />

      {config.nextStep && (
        <div className="mt-3 text-xs text-gray-600">
          Next: {config.nextLabel}
        </div>
      )}
    </div>
  );
}