import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Wand2,
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  Navigation,
  MinusSquare,
  RotateCcw,
  Sparkles,
  Settings,
  Send,
  MessageCircle
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type OnboardingView = 'dashboard' | 'praksisPladser' | 'kapacitetsplanlægning' | 'elevPlaceringer' | 'analytics' | 'settings' | null;

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  view: OnboardingView;
  icon: React.ReactNode;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to the System!',
    description: 'This guided tour will help you understand the key features of the student placement management system. You can navigate through the application while following along with these instructions.',
    view: null,
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description: 'The dashboard provides a comprehensive overview of your placement activities, including statistics on total students, active placements, available quota, and pending approvals. Monitor your key metrics at a glance.',
    view: 'dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: 3,
    title: 'Capacity Planning',
    description: 'Capacity Planning.\nThis is where you request and manage quota for student placements. One student placement may contain many capacity requests. A capacity request is made to find enough places from one or many institutions for your praksis students. With capacity requests, you collect the places, and in the next step(Student placement), you will connect these places with your praksis students.\n\nREMEMBER:You can create requests directly with in Student placement tasks aswell.\n\n NOTE:Use "Help" page located top right to get detailed information about the page.',
    view: 'kapacitetsplanlægning',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: 4,
    title: 'Student Placements',
    description: 'Click Student Placements located at left sidebar.\nView and manage all student placements in one place. Create placement tasks, assign students to approved quota, and track the status of each placement. Use filters to find specific students or placements quickly.\nUsing AI or Network graph you can distribute or see see placement status easilly.\n\nREMEMBER!:You can create placement task directly using approved requests.\n\nNOTE:Use "Help" page located top right to get detailed information about the page.',
    view: 'elevPlaceringer',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 5,
    title: 'Praksis Places',
    description: 'Manage your internship locations here. You can view all registered companies and organizations, their contact information, and available placement opportunities. Add new places or update existing ones.',
    view: 'praksisPladser',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: 6,
    title: 'Analytics-AI Assistant',
    description: 'Explore the Analytics-AI section to gain insights into your placement data. Use AI-driven tools to predict trends, optimize placements, and make data-driven decisions for better student outcomes.',
    view: 'analytics',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 7,
    title: 'Settings',
    description: 'Customize your system settings and preferences. Manage user profiles, notification settings, system configurations, and access permissions to tailor the system to your organization\'s needs.',
    view: 'settings',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: 8,
    title: 'You\'re All Set!',
    description: 'You\'ve completed the onboarding tour! You can restart this tour anytime by clicking the wizard hat button in the bottom-right corner. Feel free to explore the system and discover more features as you go.',
    view: null,
    icon: <Check className="h-5 w-5" />,
  },
];

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  initialStep?: number;
}

export function OnboardingOverlay({ isOpen, onClose, currentView, initialStep = 1 }: OnboardingOverlayProps) {
  // Load progress from localStorage or use initialStep
  const [currentStep, setCurrentStep] = useState(() => {
    return initialStep;
  });
  
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    const saved = localStorage.getItem('onboarding_completed_steps');
    return saved ? JSON.parse(saved) : [];
  });

  // Comment functionality
  const [comment, setComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [commentStatus, setCommentStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  const handleSendComment = async () => {
    if (!comment.trim()) {
      return;
    }

    setIsSendingComment(true);
    setCommentStatus('idle');

    try {
      // Get the user's access code from localStorage
      const accessCode = localStorage.getItem('spm_access_code') || 'UNKNOWN';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7771b72b/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            page: currentView,
            comment: comment.trim(),
            timestamp: new Date().toISOString(),
            stepId: currentStep,
            userAccessCode: accessCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send comment');
      }

      setCommentStatus('success');
      setComment('');
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setCommentStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error sending comment:', error);
      setCommentStatus('error');
      
      // Reset error status after 5 seconds
      setTimeout(() => {
        setCommentStatus('idle');
      }, 5000);
    } finally {
      setIsSendingComment(false);
    }
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
                  <Badge 
                    variant="outline" 
                    className="bg-white/20 text-white border-white/30"
                  >
                    Step {currentStep} of {onboardingSteps.length}
                  </Badge>
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

            {/* View indicator if specific to a view */}
            {currentStepData?.view && (
              null
            )}

            {/* Comment Section */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-5 w-5 text-pink-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Have feedback or questions?
                </h3>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Share your thoughts about this step or ask for help. Your feedback helps us improve!
              </p>
              <div className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Type your comment or question here..."
                  className="min-h-[100px] resize-none"
                  disabled={isSendingComment}
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {commentStatus === 'success' && (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Comment sent successfully!
                      </span>
                    )}
                    {commentStatus === 'error' && (
                      <span className="text-red-600">
                        Failed to send comment. Please try again.
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleSendComment}
                    disabled={!comment.trim() || isSendingComment}
                    size="sm"
                    className="bg-pink-500 hover:bg-pink-600 gap-2"
                  >
                    {isSendingComment ? (
                      <>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

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