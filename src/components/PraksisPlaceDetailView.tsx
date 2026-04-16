import {
  ArrowLeft,
  Info,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  PraksisPlace,
} from "../types/praksisPlace";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "./ui/alert";

interface PraksisPlaceDetailViewProps {
  place: PraksisPlace;
  onUpdate: (place: PraksisPlace) => void;
  onBack: () => void;
}

export function PraksisPlaceDetailView({
  place,
  onUpdate,
  onBack,
}: PraksisPlaceDetailViewProps) {
  return (
    <div className="flex flex-col w-full h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {place.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Alert className="max-w-2xl mx-auto">
          <Info className="h-5 w-5" />
          
          <AlertDescription className="text-base mt-2">
            Check prototype for SK for details
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}