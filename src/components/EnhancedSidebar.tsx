import {
  BarChart3,
  BookOpen,
  Building2,
  Headphones,
  Home,
  Settings,
  ClipboardList,
  MessageCircle,
  RotateCcw,
  Star,
} from "lucide-react";

interface EnhancedSidebarProps {
  currentView:
    | "dashboard"
    | "placements"
    | "praksisplaces"
    | "quotas"
    | "priorities"
    | "priorityitem"
    | string;
  onViewChange: (
    view:
      | "dashboard"
      | "placements"
      | "praksisplaces"
      | "quotas"
      | "priorities",
  ) => void;
  onSettingsClick?: () => void;
  onAnalyticsClick?: () => void;
  onCommentsClick?: () => void;
  onClearData?: () => void;
}

interface NavItem {
  id: "dashboard" | "placements" | "praksisplaces" | "quotas" | "priorities";
  // "priorityitem" maps to "priorities" for active state
  label: string;
  icon: any;
  active?: boolean;
}

export function EnhancedSidebar({
  currentView,
  onViewChange,
  onSettingsClick,
  onAnalyticsClick,
  onCommentsClick,
  onClearData,
}: EnhancedSidebarProps) {
  // Check if user has special access code for Onboarding Feedback
  const hasOnboardingFeedbackAccess =
    typeof window !== "undefined" &&
    localStorage.getItem("spm_access_code") === "E8W6B4C3";

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      active: currentView === "dashboard",
    },
    {
      id: "quotas",
      label: "Capacity planning",
      icon: ClipboardList,
      active: currentView === "quotas",
    },
    {
      id: "placements",
      label: "Student placement",
      icon: BookOpen,
      active: currentView === "placements",
    },
    {
      id: "praksisplaces",
      label: "Praksis places",
      icon: Building2,
      active: currentView === "praksisplaces",
    },
    {
      id: "priorities",
      label: "Priorities",
      icon: Star,
      active: currentView === "priorities" || currentView === "priorityitem",
    },
  ];

  const handleNavClick = (
    itemId:
      | "dashboard"
      | "placements"
      | "praksisplaces"
      | "quotas"
      | "priorities",
  ) => {
    onViewChange(itemId);
  };

  return (
    <div className="bg-gray-200 h-full w-60 border-r border-gray-300 overflow-y-auto">
      <div className="h-full relative w-60 flex flex-col">
        {/* Main Navigation */}
        <div className="flex flex-col gap-1 items-start justify-start p-4 pt-6">
          {navItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-0.5 items-start justify-start w-52"
            >
              <div
                className={`flex gap-2 h-8 items-center justify-start p-2 relative rounded shrink-0 w-52 cursor-pointer transition-colors ${
                  item.active
                    ? "bg-blue-100 border border-blue-200"
                    : "hover:bg-gray-300"
                }`}
                onClick={() => handleNavClick(item.id)}
              >
                <item.icon
                  size={16}
                  className={
                    item.active
                      ? "text-blue-600"
                      : "text-gray-500"
                  }
                />
                <span
                  className={`font-semibold text-sm ${
                    item.active
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </div>
          ))}

          {/* Secondary Navigation */}
          <div className="mt-6 w-52">
            <div className="flex flex-col gap-1 items-start justify-start">
              

              <div
                className="flex gap-2 h-8 items-center justify-start p-2 relative rounded shrink-0 w-52 cursor-pointer hover:bg-gray-300 transition-colors"
                onClick={onAnalyticsClick}
              >
                <BarChart3
                  size={16}
                  className="text-gray-500"
                />
                <span className="font-semibold text-gray-500 text-sm">
                  Analytics-AI
                </span>
              </div>

              {hasOnboardingFeedbackAccess && (
                <div
                  className="flex gap-2 h-8 items-center justify-start p-2 relative rounded shrink-0 w-52 cursor-pointer hover:bg-gray-300 transition-colors"
                  onClick={onCommentsClick}
                >
                  <MessageCircle
                    size={16}
                    className="text-gray-500"
                  />
                  <span className="font-semibold text-gray-500 text-sm">
                    Onboarding Feedback
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tertiary Navigation */}
          <div className="mt-6 w-52">
            <div className="flex flex-col gap-1 items-start justify-start">
              

              <div
                className="flex gap-2 h-8 items-center justify-start p-2 relative rounded shrink-0 w-52 cursor-pointer hover:bg-gray-300 transition-colors"
                onClick={onSettingsClick}
              >
                <Settings size={16} className="text-gray-500" />
                <span className="font-semibold text-gray-500 text-sm">
                  Settings
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>

        {/* Clear Local Data Button - at the very bottom */}
        {onClearData && (
          <div className="p-4 w-52">
            <div
              className="flex flex-col gap-1 p-2 relative rounded shrink-0 w-52 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={onClearData}
            >
              <div className="flex gap-2 items-center">
                <RotateCcw size={16} className="text-red-500" />
                <span className="font-semibold text-gray-700 text-sm">
                  Reset Data
                </span>
              </div>
              <span className="text-[11px] text-gray-400 leading-tight">
                This will reset the page by deleting all your input
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}