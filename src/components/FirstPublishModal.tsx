import { useState } from "react";
import { X, Calendar, Send } from "lucide-react";
import { Button } from "./ui/button";

interface FirstPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (deadline: string, message: string) => void;
}

export function FirstPublishModal({
  isOpen,
  onClose,
  onPublish,
}: FirstPublishModalProps) {
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState(
    "Dear Students,\n\nPlease review the available praksis places and submit your preferences along with any special requests or considerations.\n\nBest regards,\nPlacement Coordinator"
  );

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!deadline) {
      alert("Please select a deadline date");
      return;
    }
    onPublish(deadline, message);
    onClose();
  };

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                First Publish - Student Request Collection
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Send invitation to students to submit their preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Deadline Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              Deadline for Student Submissions
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={minDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Students will be able to submit their preferences until this date
            </p>
          </div>

          {/* Message to Students */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Message to Students
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Write a message to the students..."
            />
            <p className="text-xs text-gray-500 mt-1.5">
              This message will be sent via email to all students
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <Send className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  What happens next?
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• All students will receive an email with a link to submit their preferences</li>
                  <li>• Students can select their preferred praksis place and add custom messages</li>
                  <li>• Responses will appear in the Custom Requests column in the Students table</li>
                  <li>• You can review and consider their preferences when making final assignments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4 mr-2" />
            Publish & Send Invitations
          </Button>
        </div>
      </div>
    </div>
  );
}
