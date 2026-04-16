import { Construction } from "lucide-react";
import { Card } from "./ui/card";

interface UnderConstructionProps {
  title: string;
  message?: string;
}

export function UnderConstruction({ title, message }: UnderConstructionProps) {
  return (
    <div className="flex items-center justify-center h-full w-full p-8">
      <Card className="p-12 border-gray-200 max-w-md w-full">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-yellow-100 p-6 rounded-full">
            <Construction className="h-16 w-16 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-500">
            {message || "This page is under construction"}
          </p>
          <p className="text-sm text-gray-400">
            We're working hard to bring you this feature. Please check back soon!
          </p>
        </div>
      </Card>
    </div>
  );
}
