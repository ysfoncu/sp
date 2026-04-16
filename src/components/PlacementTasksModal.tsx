import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Circle, CheckCircle2 } from 'lucide-react';
import { PlacementTask } from '../types/placementTask';

interface PlacementTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: PlacementTask[];
  onTaskAction: (taskId: string) => void;
}

export function PlacementTasksModal({ isOpen, onClose, tasks, onTaskAction }: PlacementTasksModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white" style={{ maxWidth: '900px' }}>
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Placement Tasks
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                View and manage all placement tasks for this placement
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2">
          <div className="space-y-0">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 py-4 ${
                  index !== tasks.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Radio button / Checkmark */}
                <div className="shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                
                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm mb-1">
                    {task.step} {task.title}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                {/* Badge - Fixed width column */}
                <div className="w-28 shrink-0 flex justify-center items-center">
                  <Badge
                    variant="outline"
                    className={`w-full justify-center ${
                      task.status === 'mandatory'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 text-xs px-3 py-1'
                        : 'bg-gray-50 text-gray-600 border-gray-200 text-xs px-3 py-1'
                    }`}
                  >
                    {task.status === 'mandatory' ? 'Mandatory' : 'Optional'}
                  </Badge>
                </div>

                {/* Action Button/Text - Fixed width column */}
                <div className="w-44 shrink-0 flex justify-end items-center">
                  {task.actionType === 'auto' ? (
                    <span className="text-xs text-gray-500 text-center w-full">
                      Auto-completes
                    </span>
                  ) : task.actionType === 'publish' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTaskAction(task.id)}
                      disabled={task.completed}
                      className="h-8 w-full text-xs font-medium"
                    >
                      {task.actionLabel}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTaskAction(task.id)}
                      disabled={task.completed}
                      className="h-8 w-full text-xs font-medium"
                    >
                      {task.completed ? 'Completed' : task.actionLabel}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}