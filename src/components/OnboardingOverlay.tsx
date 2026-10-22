import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Wand2,
  LayoutDashboard,
  Building2,
  GraduationCap,
  BookOpen,
  Star,
  FileText,
  MinusSquare,
  RotateCcw,
  Settings,
  Receipt,
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  scenario?: number; // the test scenario of the guide that uses this page
  guideId?: string; // the page of the guide (docs/test-guide, id in the front matter)
}

// The tour follows the sidebar. The ids are used by App.tsx to open the tour at the step of the page being viewed.
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to the System!',
    description:
      'This tour walks you through the student placement system, in the order of the sidebar. You can use the application while you follow along. Hide the tour with the button at the top and come back to it later from the wand button.\n\nTaking part in the research? The Test guide in the sidebar has five short scenarios with real examples. Start with "Start here".',
    icon: <Wand2 className="h-5 w-5" />,
    guideId: 'start',
  },
  {
    id: 2,
    title: 'Dashboard',
    description:
      'Your overview: the active placements, the tasks that wait for you, recent activity, the progress of each placement and a yearly overview.\n\nOpen a placement from here to continue where you left off.',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: 3,
    title: 'Praksis-students',
    description:
      'The students who need a praksis place. Import the students here, then filter them by study, program, emne, location, status and dates.\n\nA student is waiting until a placement takes them. The status then follows the placement: in placement, planned, placed and completed.',
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    id: 4,
    title: 'Student placement',
    description:
      'A placement has seven steps:\n1. Choose study, program, emne and an optional location. The waiting students come from Praksis-students.\n2. Choose the entities and how many slots of each.\n3. Place the students on the entities.\n4. Attach documents (optional).\n5. Assign mentors (optional).\n6. Publish to entities.\n7. Publish to students.\n\nEach step has an info banner, and the step button at the top right shows where you are.\n\nREMEMBER: slots never block. You can place more students than slots, and the entity then shows "over by N". You can also tag students with chips and filter the list by tag.',
    icon: <BookOpen className="h-5 w-5" />,
    scenario: 4,
    guideId: 'ts-04',
  },
  {
    id: 5,
    title: 'Praksis places',
    description:
      'The places where students do their praksis (hospitals, municipalities, services) and their entities (klinikk, avdeling, seksjon, sengepost, gruppe).\n\nAn entity accepts one or more programs, each with its emner and its own places per period, and has contacts and placement information. Only entities with a program and emner can be chosen in a placement. The people of a place are made under Place contacts and added to the entities.',
    icon: <Building2 className="h-5 w-5" />,
    scenario: 2,
    guideId: 'ts-02',
  },
  {
    id: 6,
    title: 'Priorities',
    description:
      'Priority lists for students who apply for priority placement. Creating one has two steps: choose study, program, emne and an optional location (the students come from Praksis-students), then set the first notice date, the deadline and the message to the students.\n\nThe list opens with its students. Setting the noticing date counts as the first notice. There is no student side in this prototype, so you register a student\'s application with "Submit on behalf of student", review it and publish the decisions.',
    icon: <Star className="h-5 w-5" />,
    scenario: 3,
    guideId: 'ts-03',
  },
  {
    id: 7,
    title: 'Reports',
    description:
      'The Student report, the Placement report and the Capacity report (Invoicing has its own step).\n\nThe Placement report shows, per placement, its emne and students and only the entities added to it. The Capacity report shows the places per emne and how placements use them.',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 8,
    title: 'Invoicing',
    description:
      'One line for each student who has a praksis place, with the weeks of the placement and the cost (weeks times the weekly cost, which you can change). Filter by study, emne, location, status, praksis place and entity.\n\nThe report is empty until students are placed on entities. It reads the placements of this session, so a reload empties it.',
    icon: <Receipt className="h-5 w-5" />,
    scenario: 5,
    guideId: 'ts-05',
  },
  {
    id: 9,
    title: 'Settings',
    description:
      'Studies, programs and emner are kept here and are shared by the whole system. An emne can have an "Emne requirements" text, which is shown on the entities that accept the emne.\n\nStudy Admins are the people who look after a study and its programs. The list is kept only until you reload the page. You can also set up the dashboard.',
    icon: <Settings className="h-5 w-5" />,
    scenario: 1,
    guideId: 'ts-01',
  },
  {
    id: 10,
    title: "You're All Set!",
    description:
      "You've completed the tour! You can restart it anytime with the wand button in the bottom-right corner. Explore the system and discover more as you go.\n\nThe Test guide in the sidebar has the scenarios for the research.",
    icon: <Check className="h-5 w-5" />,
    guideId: 'start',
  },
];

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  onOpenGuide?: (id: string) => void; // opens a page of the Test guide
}

export function OnboardingOverlay({ isOpen, onClose, initialStep = 1, onOpenGuide }: OnboardingOverlayProps) {
  // Load progress from localStorage or use initialStep
  const [currentStep, setCurrentStep] = useState(() => {
    return initialStep;
  });
  
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    const saved = localStorage.getItem('onboarding_completed_steps');
    return saved ? JSON.parse(saved) : [];
  });

  const currentStepData = onboardingSteps.find((step) => step.id === currentStep);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === onboardingSteps.length;

  // Update currentStep when initialStep changes (when overlay opens to a new page)
  useEffect(() => {
    if (isOpen && initialStep) {
      setCurrentStep(initialStep);
    }
  }, [isOpen, initialStep]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onboarding_current_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('onboarding_completed_steps', JSON.stringify(completedSteps));
  }, [completedSteps]);

  useEffect(() => {
    // Mark current step as completed when user navigates to the next step
    if (currentStep > 1 && !completedSteps.includes(currentStep - 1)) {
      setCompletedSteps((prev) => [...prev, currentStep - 1]);
    }
  }, [currentStep, completedSteps]);

  const handleNext = () => {
    if (isLastStep) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      // Reset progress after completion
      localStorage.removeItem('onboarding_current_step');
      localStorage.removeItem('onboarding_completed_steps');
      setCurrentStep(1);
      setCompletedSteps([]);
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleHide = () => {
    // Just hide, don't reset progress
    onClose();
  };

  const handleRestart = () => {
    // Reset progress and start from beginning
    setCurrentStep(1);
    setCompletedSteps([]);
    localStorage.removeItem('onboarding_current_step');
    localStorage.removeItem('onboarding_completed_steps');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Side Panel */}
      <div className="fixed top-0 right-0 h-screen w-[450px] z-50 pointer-events-auto">
        <Card className="h-full bg-white shadow-2xl border-l-2 border-pink-200 rounded-none flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-fuchsia-600 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-white/20 p-2 rounded-lg">
                  {currentStepData?.icon || <Wand2 className="h-5 w-5 text-white" />}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {currentStepData?.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="bg-white/20 text-white border-white/30"
                    >
                      Step {currentStep} of {onboardingSteps.length}
                    </Badge>
                    {currentStepData?.scenario && (
                      <Badge variant="outline" className="bg-white text-pink-600 border-white">
                        Scenario {currentStepData.scenario}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHide}
                className="text-white hover:bg-white/20 -mt-2 -mr-2"
                title="Hide tour (resume later)"
              >
                <MinusSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Description */}
            <div className="mb-6">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {currentStepData?.description}
              </div>
            </div>

            {currentStepData?.guideId && onOpenGuide && (
              <div className="mb-6">
                <Button
                  variant="outline"
                  onClick={() => onOpenGuide(currentStepData.guideId!)}
                  className="gap-2 border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  <BookOpen className="h-4 w-4" />
                  {currentStepData.scenario ? 'Open the guide for this page' : 'Open the Test guide'}
                </Button>
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600 font-medium">Progress</span>
                <span className="text-sm text-gray-500">
                  ({currentStep}/{onboardingSteps.length})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / onboardingSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {onboardingSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    step.id === currentStep
                      ? 'w-8 bg-pink-500'
                      : completedSteps.includes(step.id)
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-gray-300'
                  }`}
                  title={`Step ${step.id}`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleRestart}
                  className="text-gray-600 gap-2"
                  title="Restart from step 1"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  className="bg-pink-500 hover:bg-pink-600 gap-2 min-w-[120px]"
                >
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}