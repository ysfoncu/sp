import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Plus,
  Trash2,
  GraduationCap,
  BookOpen,
  Layers,
  UserCog,
  Mail,
  Eye,
  EyeOff,
  GitBranch,
  X,
  Lock,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface StudyEmne {
  id: string;
  name: string;
}

export interface StudyProgram {
  id: string;
  name: string;
  // Optional cohorts ("emne") attached to a program. A program may have none.
  emner?: StudyEmne[];
}

export interface Study {
  id: string;
  name: string;
  universityId: string;
  universityName: string;
  programs: StudyProgram[];
}

export interface StudyAdmin {
  id: string;
  name: string;
  email: string;
  studyId: string;
  programIds: string[];
}

export interface DashboardSettings {
  praksisPlacesOverview: boolean;
  placementOverview: boolean;
  quotaRequests: boolean;
  tasks: boolean;
  recentActivities: boolean;
  placementProgress: boolean;
  yearlyPlacements: boolean;
}

interface SettingsViewProps {
  dashboardSettings: DashboardSettings;
  onSave: (settings: DashboardSettings) => void;
}

const dashboardItems = [
  {
    id: "praksisPlacesOverview" as keyof DashboardSettings,
    label: "Praksis Places Overview",
    description:
      "View all praksis places with capacity and student information",
  },
  {
    id: "placementOverview" as keyof DashboardSettings,
    label: "Placement Overview",
    description:
      "Track student placements by year, semester, and status",
  },
  {
    id: "quotaRequests" as keyof DashboardSettings,
    label: "Quota Requests",
    description:
      "Manage and review quota requests for praksis places",
  },
  {
    id: "tasks" as keyof DashboardSettings,
    label: "Tasks",
    description:
      "Stay on top of pending tasks and placement activities",
  },
  {
    id: "recentActivities" as keyof DashboardSettings,
    label: "Recent Activities",
    description:
      "Monitor recent changes and updates to placements",
  },
  {
    id: "placementProgress" as keyof DashboardSettings,
    label: "Placement Progress",
    description:
      "Track completion status of active placement processes",
  },
  {
    id: "yearlyPlacements" as keyof DashboardSettings,
    label: "Yearly Placements Overview",
    description: "View historical data and trends across years",
  },
];

type WorkflowStepKey = "step2Enabled" | "step4Enabled" | "step5Enabled";

const workflowSteps: {
  n: number;
  name: string;
  desc: string;
  optional: boolean;
  key?: WorkflowStepKey;
}[] = [
  {
    n: 1,
    name: "Quota management",
    desc: "Manage / request quota for your placement.",
    optional: false,
  },
  {
    n: 2,
    name: "Custom requests",
    desc: "Collect custom requests from students.",
    optional: true,
    key: "step2Enabled",
  },
  {
    n: 3,
    name: "Assign students",
    desc: "Coordinator assigns students to the approved quota slots.",
    optional: false,
  },
  {
    n: 4,
    name: "Attach required documents",
    desc: "Attach required documents to the students.",
    optional: true,
    key: "step4Enabled",
  },
  {
    n: 5,
    name: "Assign supervisors",
    desc: "Select the supervisor of each student.",
    optional: true,
    key: "step5Enabled",
  },
  {
    n: 6,
    name: "Publishing the placement",
    desc: "Student placement is finalized and confirmed in the system.",
    optional: false,
  },
];

export function SettingsView({
  dashboardSettings,
  onSave,
}: SettingsViewProps) {
  const [localSettings, setLocalSettings] =
    useState<DashboardSettings>(dashboardSettings);
  const [showError, setShowError] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "studies" | "admins" | "dashboard" | "workflows"
  >("studies");

  // Studies state management
  const [studies, setStudies] = useState<Study[]>([
    {
      id: "1",
      name: "Helse-, sosial og idrettsfag",
      universityId: "U1",
      universityName: "University of Oslo",
      programs: [
        {
          id: "1-1",
          name: "Nursing",
          emner: [
            { id: "1-1-e1", name: "Kull 2024 Høst" },
            { id: "1-1-e2", name: "Kull 2025 Vår" },
          ],
        },
        { id: "1-2", name: "Physiotherapy" },
      ],
    },
    {
      id: "2",
      name: "Engineering",
      universityId: "U1",
      universityName: "University of Oslo",
      programs: [
        { id: "2-1", name: "Software Engineering" },
        { id: "2-2", name: "Electrical Engineering" },
      ],
    },
  ]);
  const [newStudyName, setNewStudyName] = useState("");
  const [newProgramName, setNewProgramName] = useState<{
    [studyId: string]: string;
  }>({});
  const [isAddingStudy, setIsAddingStudy] = useState(false);
  const [addingProgramForStudy, setAddingProgramForStudy] =
    useState<string | null>(null);
  const [newEmneName, setNewEmneName] = useState<{
    [programId: string]: string;
  }>({});
  const [addingEmneForProgram, setAddingEmneForProgram] =
    useState<string | null>(null);

  // Study Admins state management
  const [studyAdmins, setStudyAdmins] = useState<StudyAdmin[]>([
    {
      id: "1",
      name: "Anne Larsen",
      email: "anne.larsen@example.com",
      studyId: "1",
      programIds: ["1-1", "1-2"],
    },
    {
      id: "2",
      name: "John Smith",
      email: "john.smith@example.com",
      studyId: "2",
      programIds: ["2-1"],
    },
  ]);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState<{
    name: string;
    email: string;
    studyId: string;
    programIds: string[];
  }>({
    name: "",
    email: "",
    studyId: "",
    programIds: [],
  });
  const [adminFormError, setAdminFormError] = useState("");

  // Workflow settings state management
  const [workflowSettings, setWorkflowSettings] = useState({
    step2Enabled: true,
    step4Enabled: false,
    step5Enabled: false,
  });

  // Study admin management functions
  const handleAddAdmin = () => {
    // Validation
    if (!newAdmin.name.trim()) {
      setAdminFormError("Please enter admin name");
      return;
    }
    if (!newAdmin.email.trim()) {
      setAdminFormError("Please enter admin email");
      return;
    }
    if (!newAdmin.studyId) {
      setAdminFormError("Please select a study");
      return;
    }
    if (newAdmin.programIds.length === 0) {
      setAdminFormError("Please select at least one program");
      return;
    }

    const admin: StudyAdmin = {
      id: Date.now().toString(),
      name: newAdmin.name.trim(),
      email: newAdmin.email.trim(),
      studyId: newAdmin.studyId,
      programIds: newAdmin.programIds,
    };

    setStudyAdmins([...studyAdmins, admin]);
    setNewAdmin({
      name: "",
      email: "",
      studyId: "",
      programIds: [],
    });
    setIsAddingAdmin(false);
    setAdminFormError("");
  };

  const handleRemoveAdmin = (adminId: string) => {
    setStudyAdmins(
      studyAdmins.filter((admin) => admin.id !== adminId),
    );
  };

  const handleAdminStudyChange = (studyId: string) => {
    setNewAdmin({ ...newAdmin, studyId, programIds: [] });
    setAdminFormError("");
  };

  const handleAdminProgramToggle = (programId: string) => {
    const isSelected = newAdmin.programIds.includes(programId);
    if (isSelected) {
      setNewAdmin({
        ...newAdmin,
        programIds: newAdmin.programIds.filter(
          (id) => id !== programId,
        ),
      });
    } else {
      setNewAdmin({
        ...newAdmin,
        programIds: [...newAdmin.programIds, programId],
      });
    }
    setAdminFormError("");
  };

  const getStudyById = (studyId: string) => {
    return studies.find((study) => study.id === studyId);
  };

  const getProgramById = (
    studyId: string,
    programId: string,
  ) => {
    const study = getStudyById(studyId);
    return study?.programs.find(
      (program) => program.id === programId,
    );
  };

  // Study management functions
  const handleAddStudy = () => {
    if (newStudyName.trim()) {
      const newStudy: Study = {
        id: Date.now().toString(),
        name: newStudyName.trim(),
        universityId: "U1",
        universityName: "University of Oslo",
        programs: [],
      };
      setStudies([...studies, newStudy]);
      setNewStudyName("");
      setIsAddingStudy(false);
    }
  };

  const handleRemoveStudy = (studyId: string) => {
    setStudies(studies.filter((study) => study.id !== studyId));
  };

  const handleAddProgram = (studyId: string) => {
    const programName = newProgramName[studyId]?.trim();
    if (programName) {
      setStudies(
        studies.map((study) => {
          if (study.id === studyId) {
            return {
              ...study,
              programs: [
                ...study.programs,
                {
                  id: `${studyId}-${Date.now()}`,
                  name: programName,
                },
              ],
            };
          }
          return study;
        }),
      );
      setNewProgramName({ ...newProgramName, [studyId]: "" });
      setAddingProgramForStudy(null);
    }
  };

  const handleRemoveProgram = (
    studyId: string,
    programId: string,
  ) => {
    setStudies(
      studies.map((study) => {
        if (study.id === studyId) {
          return {
            ...study,
            programs: study.programs.filter(
              (program) => program.id !== programId,
            ),
          };
        }
        return study;
      }),
    );
  };

  // Emne (cohort) management functions — optional per program
  const handleAddEmne = (
    studyId: string,
    programId: string,
  ) => {
    const emneName = newEmneName[programId]?.trim();
    if (emneName) {
      setStudies(
        studies.map((study) => {
          if (study.id !== studyId) return study;
          return {
            ...study,
            programs: study.programs.map((program) => {
              if (program.id !== programId) return program;
              return {
                ...program,
                emner: [
                  ...(program.emner ?? []),
                  {
                    id: `${programId}-emne-${Date.now()}`,
                    name: emneName,
                  },
                ],
              };
            }),
          };
        }),
      );
      setNewEmneName({ ...newEmneName, [programId]: "" });
      setAddingEmneForProgram(null);
    }
  };

  const handleRemoveEmne = (
    studyId: string,
    programId: string,
    emneId: string,
  ) => {
    setStudies(
      studies.map((study) => {
        if (study.id !== studyId) return study;
        return {
          ...study,
          programs: study.programs.map((program) => {
            if (program.id !== programId) return program;
            return {
              ...program,
              emner: (program.emner ?? []).filter(
                (emne) => emne.id !== emneId,
              ),
            };
          }),
        };
      }),
    );
  };

  const handleToggle = (itemId: keyof DashboardSettings) => {
    const newSettings = {
      ...localSettings,
      [itemId]: !localSettings[itemId],
    };

    // Check if at least one item is selected
    const selectedCount =
      Object.values(newSettings).filter(Boolean).length;

    if (selectedCount === 0) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setLocalSettings(newSettings);
    // Save immediately
    onSave(newSettings);
  };

  const handleSave = () => {
    const selectedCount =
      Object.values(localSettings).filter(Boolean).length;

    if (selectedCount === 0) {
      setShowError(true);
      return;
    }

    onSave(localSettings);
    setShowError(false);
  };

  const handleReset = () => {
    setLocalSettings(dashboardSettings);
    setShowError(false);
  };

  const selectedCount =
    Object.values(localSettings).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Settings
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your studies, admins, and dashboard preferences
        </p>
      </div>

      {/* Settings Layout with Sidebar Navigation */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("studies")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "studies"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                <span>Studies & Programs</span>
              </button>
              <button
                onClick={() => setActiveTab("admins")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "admins"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <UserCog className="h-5 w-5" />
                <span>Study Admins</span>
              </button>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "dashboard"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Eye className="h-5 w-5" />
                <span>Dashboard Items</span>
              </button>
              <button
                onClick={() => setActiveTab("workflows")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "workflows"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <GitBranch className="h-5 w-5" />
                <span>Workflows</span>
              </button>
            </nav>
          </Card>
        </div>

        {/* Right Content Area - Fixed Width */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Error Alert */}
          {showError && (
            <Alert className="bg-red-50 border-red-200 mb-4">
              <AlertDescription className="text-red-800">
                You must select at least one dashboard item to
                display.
              </AlertDescription>
            </Alert>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pr-2">
            {/* Studies Management Card */}
            {activeTab === "studies" && (
              <Card className="p-6 w-full max-w-5xl">
                <div className="space-y-1 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                        Studies and Programs
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage your academic studies and their
                        associated programs
                      </p>
                    </div>
                    {!isAddingStudy && (
                      <Button
                        onClick={() => setIsAddingStudy(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Study
                      </Button>
                    )}
                  </div>
                </div>

                {/* Add Study Form */}
                {isAddingStudy && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter study name (e.g., Helse-, sosial og idrettsfag)"
                        value={newStudyName}
                        onChange={(e) =>
                          setNewStudyName(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddStudy();
                          } else if (e.key === "Escape") {
                            setIsAddingStudy(false);
                            setNewStudyName("");
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        onClick={handleAddStudy}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!newStudyName.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingStudy(false);
                          setNewStudyName("");
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Studies List */}
                <div className="space-y-4">
                  {studies.length > 0 ? (
                    studies.map((study) => (
                      <div
                        key={study.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {/* Study Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-medium text-gray-800">
                                {study.name}
                              </h3>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                {study.programs.length}{" "}
                                {study.programs.length === 1
                                  ? "program"
                                  : "programs"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              handleRemoveStudy(study.id)
                            }
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Programs Section */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                              Programs
                            </h4>
                            {addingProgramForStudy !==
                              study.id && (
                              <Button
                                onClick={() =>
                                  setAddingProgramForStudy(
                                    study.id,
                                  )
                                }
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-300 hover:bg-blue-50 gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Program
                              </Button>
                            )}
                          </div>

                          {/* Add Program Form */}
                          {addingProgramForStudy === study.id && (
                            <div className="mb-3 p-3 bg-white border border-blue-200 rounded-lg">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Enter program name (e.g., Nursing)"
                                  value={
                                    newProgramName[study.id] || ""
                                  }
                                  onChange={(e) =>
                                    setNewProgramName({
                                      ...newProgramName,
                                      [study.id]: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddProgram(study.id);
                                    } else if (
                                      e.key === "Escape"
                                    ) {
                                      setAddingProgramForStudy(
                                        null,
                                      );
                                      setNewProgramName({
                                        ...newProgramName,
                                        [study.id]: "",
                                      });
                                    }
                                  }}
                                  className="flex-1"
                                  autoFocus
                                />
                                <Button
                                  onClick={() =>
                                    handleAddProgram(study.id)
                                  }
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  disabled={
                                    !newProgramName[
                                      study.id
                                    ]?.trim()
                                  }
                                >
                                  Add
                                </Button>
                                <Button
                                  onClick={() => {
                                    setAddingProgramForStudy(
                                      null,
                                    );
                                    setNewProgramName({
                                      ...newProgramName,
                                      [study.id]: "",
                                    });
                                  }}
                                  size="sm"
                                  variant="outline"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Programs List */}
                          {study.programs.length > 0 && (
                            <div className="space-y-2">
                              {study.programs.map((program) => (
                                <div
                                  key={program.id}
                                  className="bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors p-2"
                                >
                                  {/* Program header row */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-700">
                                        {program.name}
                                      </span>
                                    </div>
                                    <Button
                                      onClick={() =>
                                        handleRemoveProgram(
                                          study.id,
                                          program.id,
                                        )
                                      }
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600 hover:bg-red-50 hover:text-red-700 h-7 w-7 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Emne (cohort) chips + Add Emne action — below the program, optional */}
                                  <div className="mt-2 ml-6 flex flex-wrap items-center gap-2">
                                    {(program.emner ?? []).map(
                                      (emne) => (
                                        <span
                                          key={emne.id}
                                          className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200 pl-2 pr-1 py-0.5 text-xs"
                                        >
                                          <Layers className="h-3 w-3" />
                                          {emne.name}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveEmne(
                                                study.id,
                                                program.id,
                                                emne.id,
                                              )
                                            }
                                            className="ml-0.5 rounded-full p-0.5 hover:bg-violet-200 transition-colors"
                                            aria-label={`Remove ${emne.name}`}
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </span>
                                      ),
                                    )}

                                    {addingEmneForProgram ===
                                    program.id ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          placeholder="Emne / cohort name (e.g., Kull 2024 Høst)"
                                          value={
                                            newEmneName[
                                              program.id
                                            ] || ""
                                          }
                                          onChange={(e) =>
                                            setNewEmneName({
                                              ...newEmneName,
                                              [program.id]:
                                                e.target.value,
                                            })
                                          }
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "Enter"
                                            ) {
                                              handleAddEmne(
                                                study.id,
                                                program.id,
                                              );
                                            } else if (
                                              e.key === "Escape"
                                            ) {
                                              setAddingEmneForProgram(
                                                null,
                                              );
                                              setNewEmneName({
                                                ...newEmneName,
                                                [program.id]: "",
                                              });
                                            }
                                          }}
                                          className="h-8 w-64"
                                          autoFocus
                                        />
                                        <Button
                                          onClick={() =>
                                            handleAddEmne(
                                              study.id,
                                              program.id,
                                            )
                                          }
                                          size="sm"
                                          className="bg-violet-600 hover:bg-violet-700 h-8"
                                          disabled={
                                            !newEmneName[
                                              program.id
                                            ]?.trim()
                                          }
                                        >
                                          Add
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            setAddingEmneForProgram(
                                              null,
                                            );
                                            setNewEmneName({
                                              ...newEmneName,
                                              [program.id]: "",
                                            });
                                          }}
                                          size="sm"
                                          variant="outline"
                                          className="h-8"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() =>
                                          setAddingEmneForProgram(
                                            program.id,
                                          )
                                        }
                                        size="sm"
                                        variant="outline"
                                        className="text-violet-600 border-violet-300 hover:bg-violet-50 gap-1 h-7"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Add Emne
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {study.programs.length === 0 &&
                            addingProgramForStudy !==
                              study.id && (
                              <div className="text-sm text-gray-500 italic">
                                No programs added yet. Click "Add
                                Program" to add one.
                              </div>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No studies added yet</p>
                      <p className="text-sm mt-1">
                        Click "Add Study" to create your first
                        study
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Study Admins Management Card */}
            {activeTab === "admins" && (
              <Card className="p-6 w-full max-w-5xl">
                <div className="space-y-1 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-blue-600" />
                        Study Admins
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage admins for your studies and
                        programs
                      </p>
                    </div>
                    {!isAddingAdmin && (
                      <Button
                        onClick={() => setIsAddingAdmin(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Admin
                      </Button>
                    )}
                  </div>
                </div>

                {/* Add Admin Form */}
                {isAddingAdmin && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter admin name (e.g., Anne Larsen)"
                        value={newAdmin.name}
                        onChange={(e) =>
                          setNewAdmin({
                            ...newAdmin,
                            name: e.target.value,
                          })
                        }
                        className="flex-1"
                        autoFocus
                      />
                      <Input
                        placeholder="Enter admin email (e.g., anne.larsen@example.com)"
                        value={newAdmin.email}
                        onChange={(e) =>
                          setNewAdmin({
                            ...newAdmin,
                            email: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                      <Select
                        value={newAdmin.studyId}
                        onValueChange={handleAdminStudyChange}
                        className="w-full"
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a study" />
                        </SelectTrigger>
                        <SelectContent>
                          {studies.map((study) => (
                            <SelectItem
                              key={study.id}
                              value={study.id}
                            >
                              {study.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          Select programs for this admin:
                        </p>
                        {getStudyById(
                          newAdmin.studyId,
                        )?.programs.map((program) => (
                          <div
                            key={program.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={program.id}
                              checked={newAdmin.programIds.includes(
                                program.id,
                              )}
                              onCheckedChange={() =>
                                handleAdminProgramToggle(
                                  program.id,
                                )
                              }
                            />
                            <label
                              htmlFor={program.id}
                              className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                              {program.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      {adminFormError && (
                        <p className="text-sm text-red-500 mt-2">
                          {adminFormError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddAdmin}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={!!adminFormError}
                        >
                          Add
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingAdmin(false);
                            setNewAdmin({
                              name: "",
                              email: "",
                              studyId: "",
                              programIds: [],
                            });
                            setAdminFormError("");
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admins List */}
                <div className="space-y-4">
                  {studyAdmins.length > 0 ? (
                    studyAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {/* Admin Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-800">
                                {admin.name}
                              </h3>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                {admin.programIds.length}{" "}
                                {admin.programIds.length === 1
                                  ? "program"
                                  : "programs"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              <p>{admin.email}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <GraduationCap className="h-3 w-3" />
                              <p>
                                {getStudyById(admin.studyId)
                                  ?.name || "Unknown Study"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() =>
                                handleRemoveAdmin(admin.id)
                              }
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Programs List */}
                        {admin.programIds.length > 0 && (
                          <div className="space-y-2">
                            {admin.programIds.map(
                              (programId) => {
                                const program = getProgramById(
                                  admin.studyId,
                                  programId,
                                );
                                if (program) {
                                  return (
                                    <div
                                      key={programId}
                                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-700">
                                          {program.name}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              },
                            )}
                          </div>
                        )}

                        {admin.programIds.length === 0 && (
                          <div className="text-sm text-gray-500 italic">
                            No programs assigned yet.
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserCog className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No study admins added yet</p>
                      <p className="text-sm mt-1">
                        Click "Add Admin" to create your first
                        admin
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Dashboard Items Card */}
            {activeTab === "dashboard" && (
              <Card className="p-6 w-full max-w-5xl">
                <div className="space-y-1 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Dashboard Items
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select which items you want to see on your
                    dashboard. You must keep at least one item
                    selected.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedCount} of {dashboardItems.length}{" "}
                    items selected
                  </p>
                </div>

                <div className="space-y-4">
                  {dashboardItems.map((item) => {
                    const isChecked = localSettings[item.id];

                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                        onClick={() => handleToggle(item.id)}
                      >
                        <div className="flex items-center h-5 pt-0.5">
                          <Checkbox
                            id={item.id}
                            checked={isChecked}
                            onCheckedChange={() =>
                              handleToggle(item.id)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <label
                              htmlFor={item.id}
                              className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                              {item.label}
                            </label>
                            {isChecked ? (
                              <Eye className="h-4 w-4 text-blue-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Workflows Card */}
            {activeTab === "workflows" && (
              <Card className="p-6 w-full max-w-5xl">
                <div className="space-y-1 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-blue-600" />
                    Workflow Settings
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure which workflow steps are enabled in your placement process
                  </p>
                </div>

                {/* Placement workflow subtitle */}
                <h3 className="text-base font-medium text-gray-700 mb-1">Placement workflow</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Default steps are always part of the process. Toggle the optional steps to
                  include or skip them.
                </p>

                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">
                          Workflow step
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Type
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {workflowSteps.map((step) => {
                        const enabled = step.optional
                          ? workflowSettings[step.key!]
                          : true;
                        return (
                          <tr key={step.n} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 align-top">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                                {step.n}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{step.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                            </td>
                            <td className="px-4 py-3 align-top whitespace-nowrap">
                              {step.optional ? (
                                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                  Optional
                                </Badge>
                              ) : (
                                <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                                  Default
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {step.optional ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`text-xs w-7 text-right ${
                                      enabled
                                        ? "text-blue-600 font-medium"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {enabled ? "On" : "Off"}
                                  </span>
                                  <Switch
                                    checked={enabled}
                                    onCheckedChange={(v: boolean) =>
                                      setWorkflowSettings((s) => ({
                                        ...s,
                                        [step.key!]: v,
                                      }))
                                    }
                                    className="data-[state=checked]:bg-blue-600"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
                                  <Lock className="h-3.5 w-3.5" />
                                  Always on
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}