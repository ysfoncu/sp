import { X, Send, Sparkles, Users, Building2, CheckCircle, ListChecks } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: {
    type: 'display_departments' | 'add_quota' | 'assign_student' | 'confirmation';
    data?: any;
  };
}

interface TaskInfo {
  id: string;
  title: string;
  completed: boolean;
}

interface AISupportSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction?: (action: string, data: any) => void;
  availableDepartments?: any[];
  students?: any[];
  tasks?: TaskInfo[];
  currentTaskIndex?: number;
}

export function AISupportSidebar({
  isOpen,
  onClose,
  onExecuteAction,
  availableDepartments = [],
  students = [],
  tasks = [],
  currentTaskIndex = 0,
}: AISupportSidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Generate context-aware initial message
  const generateInitialMessage = (): Message => {
    const completedTasks = tasks.filter(t => t.completed);
    const currentTask = tasks[currentTaskIndex];
    const totalStudents = students.length;
    const assignedStudents = students.filter(s => s.assignedPraksisPlace).length;
    const unassignedStudents = totalStudents - assignedStudents;
    const totalQuotas = availableDepartments.reduce((sum, d) => sum + (d.fixedQuota || 0), 0);

    let content = "👋 Hello! I'm your AI assistant for placement management.\n\n";
    
    // Progress summary
    content += "📊 **Current Progress:**\n";
    content += `• Tasks completed: ${completedTasks.length}/${tasks.length}\n`;
    if (totalStudents > 0) {
      content += `• Students assigned: ${assignedStudents}/${totalStudents}\n`;
    }
    if (availableDepartments.length > 0) {
      content += `• Total quotas available: ${totalQuotas}\n`;
    }
    
    content += "\n";

    // Completed tasks
    if (completedTasks.length > 0) {
      content += "✅ **Completed Actions:**\n";
      completedTasks.slice(0, 3).forEach(task => {
        content += `• ${task.title}\n`;
      });
      if (completedTasks.length > 3) {
        content += `• ... and ${completedTasks.length - 3} more\n`;
      }
      content += "\n";
    }

    // Current task
    if (currentTask && !currentTask.completed) {
      content += `🎯 **Current Task:** ${currentTask.title}\n\n`;
      
      // Task-specific help suggestions
      content += "💡 **I can help you with:**\n";
      
      const taskTitle = currentTask.title.toLowerCase();
      
      if (taskTitle.includes('import') || taskTitle.includes('student')) {
        content += "• Import student list from file\n";
        content += "• Review imported students\n";
        content += "• Add students manually\n";
      } else if (taskTitle.includes('quota') || taskTitle.includes('select')) {
        content += "• Show available departments and quotas\n";
        content += "• Add quotas to specific departments (e.g., 'Add 3 quotas to Cardiology')\n";
        content += "• Request pending quotas\n";
        content += "• View quota summary\n";
      } else if (taskTitle.includes('assign')) {
        content += "• Assign students to available quotas\n";
        content += "• Show unassigned students\n";
        content += "• Auto-assign students to departments\n";
        content += "• View assignment status\n";
      } else if (taskTitle.includes('publish') || taskTitle.includes('email')) {
        content += "• Preview placement assignments\n";
        content += "• Send notifications to students\n";
        content += "• Generate placement reports\n";
      } else {
        content += "• View available departments\n";
        content += "• Add quotas to departments\n";
        content += "• Assign students to praksis places\n";
        content += "• Check placement status\n";
      }
    } else if (completedTasks.length === tasks.length) {
      content += "🎉 **All tasks completed!**\n\n";
      content += "💡 **What's next:**\n";
      content += "• Review final assignments\n";
      content += "• Export placement data\n";
      content += "• Send notifications to students\n";
    }

    return {
      id: '1',
      role: 'assistant',
      content: content,
      timestamp: new Date(),
    };
  };

  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize messages when sidebar opens
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      setMessages([generateInitialMessage()]);
      setHasInitialized(true);
    }
  }, [isOpen]);

  // Reset when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      setMessages((prev) => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 800);
  };

  const generateAIResponse = (userInput: string): Message => {
    const input = userInput.toLowerCase();

    // Show task status
    if (input.includes('status') || input.includes('progress')) {
      const completedTasks = tasks.filter(t => t.completed);
      const currentTask = tasks[currentTaskIndex];
      
      let content = `📊 **Placement Status**\n\n`;
      content += `Tasks: ${completedTasks.length}/${tasks.length} completed\n`;
      content += `Students: ${students.filter(s => s.assignedPraksisPlace).length}/${students.length} assigned\n\n`;
      
      if (currentTask && !currentTask.completed) {
        content += `Current task: ${currentTask.title}`;
      }
      
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
      };
    }

    // Show unassigned students
    if (input.includes('unassigned') || input.includes('who') && input.includes('not')) {
      const unassigned = students.filter(s => !s.assignedPraksisPlace);
      
      if (unassigned.length === 0) {
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Great news! All students have been assigned to praksis places. 🎉",
          timestamp: new Date(),
        };
      }
      
      let content = `📋 **Unassigned Students (${unassigned.length})**\n\n`;
      unassigned.slice(0, 10).forEach((s, idx) => {
        content += `${idx + 1}. ${s.name}\n`;
      });
      
      if (unassigned.length > 10) {
        content += `\n... and ${unassigned.length - 10} more`;
      }
      
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
      };
    }

    // Display available departments
    if (
      input.includes('show') ||
      input.includes('display') ||
      input.includes('view') ||
      input.includes('list')
    ) {
      if (
        input.includes('department') ||
        input.includes('quota') ||
        input.includes('available')
      ) {
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content:
            "Here are the available departments with their current quota status:",
          timestamp: new Date(),
          actions: {
            type: 'display_departments',
            data: availableDepartments,
          },
        };
      }
    }

    // Add quota to department
    if (input.includes('add') && input.includes('quota')) {
      const numberMatch = input.match(/(\d+)/);
      const number = numberMatch ? parseInt(numberMatch[1]) : 2;

      let departmentName = '';
      if (input.includes('cardiology')) departmentName = 'Cardiology';
      else if (input.includes('emergency')) departmentName = 'Emergency';
      else if (input.includes('pediatric')) departmentName = 'Pediatrics';
      else if (input.includes('surgery')) departmentName = 'Surgery';

      if (departmentName) {
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I'll add ${number} quota${number !== 1 ? 's' : ''} to the ${departmentName} department. Would you like me to proceed?`,
          timestamp: new Date(),
          actions: {
            type: 'add_quota',
            data: { department: departmentName, count: number },
          },
        };
      }
    }

    // Assign student
    if (input.includes('assign') && input.includes('student')) {
      let departmentName = '';
      if (input.includes('cardiology')) departmentName = 'Cardiology';
      else if (input.includes('emergency')) departmentName = 'Emergency';
      else if (input.includes('pediatric')) departmentName = 'Pediatrics';
      else if (input.includes('surgery')) departmentName = 'Surgery';

      if (departmentName && students.length > 0) {
        const unassignedStudent = students.find((s) => !s.assignedPraksisPlace);
        if (unassignedStudent) {
          return {
            id: Date.now().toString(),
            role: 'assistant',
            content: `I can assign ${unassignedStudent.name} to ${departmentName}. Would you like me to proceed?`,
            timestamp: new Date(),
            actions: {
              type: 'assign_student',
              data: {
                student: unassignedStudent,
                department: departmentName,
              },
            },
          };
        } else {
          return {
            id: Date.now().toString(),
            role: 'assistant',
            content: "All students are already assigned! Would you like to reassign someone?",
            timestamp: new Date(),
          };
        }
      }
    }

    // Default response with current context
    const currentTask = tasks[currentTaskIndex];
    let content = "I understand you want to manage placements. ";
    
    if (currentTask && !currentTask.completed) {
      content += `Since you're currently working on "${currentTask.title}", here are some suggestions:\n\n`;
      
      const taskTitle = currentTask.title.toLowerCase();
      if (taskTitle.includes('quota')) {
        content += "• 'Show available departments'\n";
        content += "• 'Add 2 quotas to Cardiology'\n";
      } else if (taskTitle.includes('assign')) {
        content += "• 'Show unassigned students'\n";
        content += "• 'Assign student to Emergency'\n";
      } else {
        content += "• 'Show available departments'\n";
        content += "• 'Check progress status'\n";
      }
    } else {
      content += "Here are some things I can help with:\n\n";
      content += "• 'Show available departments'\n";
      content += "• 'Add 2 quotas to Cardiology'\n";
      content += "• 'Assign student to Emergency department'\n";
      content += "• 'Show unassigned students'\n";
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: content,
      timestamp: new Date(),
    };
  };

  const handleExecuteAction = (message: Message) => {
    if (!message.actions || !onExecuteAction) return;

    onExecuteAction(message.actions.type, message.actions.data);

    // Add confirmation message
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '✓ Action completed successfully! Is there anything else I can help you with?',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmationMessage]);
  };

  const handleCancelAction = () => {
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'No problem! Let me know if you need anything else.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
  };

  // Generate quick actions based on current task
  const getQuickActions = () => {
    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) {
      return [
        { label: 'Show departments', value: 'Show available departments' },
        { label: 'Add quota', value: 'Add 2 quotas to Cardiology' },
        { label: 'Check status', value: 'Show progress status' },
      ];
    }

    const taskTitle = currentTask.title.toLowerCase();
    
    if (taskTitle.includes('quota') || taskTitle.includes('select')) {
      return [
        { label: 'Show departments', value: 'Show available departments' },
        { label: 'Add quota', value: 'Add 2 quotas to Cardiology' },
        { label: 'Check quotas', value: 'Show available quotas' },
      ];
    } else if (taskTitle.includes('assign')) {
      return [
        { label: 'Unassigned students', value: 'Show unassigned students' },
        { label: 'Assign student', value: 'Assign student to Emergency' },
        { label: 'Check progress', value: 'Show assignment status' },
      ];
    } else {
      return [
        { label: 'Show departments', value: 'Show available departments' },
        { label: 'Add quota', value: 'Add 2 quotas to Cardiology' },
        { label: 'Check status', value: 'Show progress status' },
      ];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[480px] bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                AI Assistant
              </h2>
              <p className="text-xs text-gray-600">
                Placement Management Support
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100'
              } px-4 py-3`}
            >
              <div className="text-sm whitespace-pre-line">
                {message.content}
              </div>

              {/* Action Cards */}
              {message.actions?.type === 'display_departments' && (
                <div className="mt-3 space-y-2">
                  {message.actions.data?.slice(0, 5).map((dept: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {dept.placeName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {dept.departmentName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Quota</div>
                          <div className="font-semibold text-sm text-gray-800">
                            {dept.fixedQuota || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Quota Action */}
              {message.actions?.type === 'add_quota' && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleExecuteAction(message)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes, proceed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAction}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Assign Student Action */}
              {message.actions?.type === 'assign_student' && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleExecuteAction(message)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes, assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAction}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div
                className={`text-xs mt-2 ${
                  message.role === 'user'
                    ? 'text-blue-100'
                    : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me to help with placements..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions - Context-aware */}
        <div className="mt-3 flex flex-wrap gap-2">
          {getQuickActions().map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputValue(action.value);
              }}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
