import { Wand2 } from 'lucide-react';
import { Button } from './ui/button';

interface FloatingOnboardingButtonProps {
  onClick: () => void;
  show: boolean;
}

export function FloatingOnboardingButton({ onClick, show }: FloatingOnboardingButtonProps) {
  if (!show) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-300/50 hover:shadow-xl hover:shadow-pink-400/60 transition-all duration-200 flex items-center justify-center group"
      title="Start Onboarding Tour"
      style={{
        boxShadow: '0 0 20px rgba(236, 72, 153, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)',
      }}
    >
      <Wand2 className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
    </Button>
  );
}