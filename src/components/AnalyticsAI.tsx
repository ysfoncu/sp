import { useState } from 'react';
import { Send, Sparkles, TrendingUp, Users, Calendar, Building2, Construction } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AnalyticsAIProps {
  userRole?: 'coordinator' | 'contact_person';
}

const exampleQuestions = [
  {
    question: "How many students are currently in active placements?",
    icon: Users,
    category: "Students"
  },
  {
    question: "What is the placement completion rate this semester?",
    icon: TrendingUp,
    category: "Performance"
  },
  {
    question: "Which praksis places have the highest capacity?",
    icon: Building2,
    category: "Facilities"
  },
  {
    question: "Show me upcoming placement deadlines",
    icon: Calendar,
    category: "Schedule"
  }
];

const simulateAIResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('active placement') || lowerQuestion.includes('currently') || lowerQuestion.includes('how many students')) {
    return `Based on the current data, there are **156 students** in active placements across all programs. This includes:

- **Bachelor programs**: 98 students (62.8%)
- **Master programs**: 58 students (37.2%)

The distribution by semester:
- Spring 2026: 89 students
- Fall 2025: 67 students

This represents a **12% increase** compared to the same period last year.`;
  }
  
  if (lowerQuestion.includes('completion rate') || lowerQuestion.includes('success rate')) {
    return `The placement completion rate for this semester is **87.5%**, which is above our target of 85%. Here's the breakdown:

- **Completed successfully**: 140 students
- **In progress**: 28 students
- **Withdrawn/Incomplete**: 12 students

Key insights:
- The highest completion rate is in Nursing (92.3%)
- Medicine and Psychology both maintain strong rates at 88% and 86% respectively
- Early intervention programs have improved completion rates by 15% this year`;
  }
  
  if (lowerQuestion.includes('capacity') || lowerQuestion.includes('highest capacity') || lowerQuestion.includes('praksis place')) {
    return `Here are the top 5 praksis places by total capacity:

1. **Oslo University Hospital** - 45 students (currently: 38/45)
2. **Akershus University Hospital** - 32 students (currently: 30/32)
3. **Vestre Viken HF** - 28 students (currently: 22/28)
4. **Lovisenberg Hospital** - 24 students (currently: 24/24) ⚠️ *Full capacity*
5. **Diakonhjemmet Hospital** - 22 students (currently: 18/22)

**Overall capacity utilization**: 83.4%
**Total available spots**: 298
**Currently filled**: 248

*Note: Lovisenberg Hospital is at full capacity and has a waitlist of 6 students.*`;
  }
  
  if (lowerQuestion.includes('deadline') || lowerQuestion.includes('upcoming') || lowerQuestion.includes('schedule')) {
    return `Here are the upcoming placement deadlines for the next 30 days:

**This Week:**
- Jan 22, 2026: Mid-term evaluation submissions (34 students)
- Jan 24, 2026: Clinical skills assessment (Medicine cohort)

**Next Week:**
- Jan 27, 2026: Placement applications for Spring 2026 (Deadline)
- Jan 29, 2026: Supervisor feedback forms due (89 forms pending)

**Later This Month:**
- Feb 3, 2026: Final placement reports (Fall 2025 cohort - 45 students)
- Feb 5, 2026: New placement orientation session
- Feb 10, 2026: Placement coordinator meeting

**Critical**: 12 students have overdue documentation that needs immediate attention.`;
  }
  
  if (lowerQuestion.includes('department') || lowerQuestion.includes('which department')) {
    return `Current placement distribution by department:

**Top Performing Departments:**
1. **Emergency Medicine** - 28 students, 94% satisfaction
2. **Pediatrics** - 24 students, 91% satisfaction
3. **General Surgery** - 22 students, 88% satisfaction
4. **Internal Medicine** - 31 students, 87% satisfaction
5. **Psychiatry** - 18 students, 85% satisfaction

**Departments with Availability:**
- Orthopedics: 8 spots available
- Radiology: 5 spots available
- Oncology: 4 spots available

Most popular departments are Emergency Medicine and Pediatrics, with waitlists of 8 and 6 students respectively.`;
  }
  
  if (lowerQuestion.includes('contract') || lowerQuestion.includes('expired') || lowerQuestion.includes('pending')) {
    return `Contract status overview:

**Active Contracts**: 42 (84%)
**Pending Renewal**: 5 (10%)
**Expired**: 3 (6%)

**Contracts requiring attention:**
- Oslo University Hospital - Expires in 14 days
- Ahus Psychiatry Department - Pending signature
- Diakonhjemmet Rehab - Under review

**Recent Updates:**
- 2 new contracts signed this month (Lovisenberg, Vestre Viken)
- 3 contracts successfully renewed
- Average contract duration: 2.3 years

**Action Items:** Contact the 3 facilities with expired contracts to initiate renewal process.`;
  }
  
  // Default response for other questions
  return `I've analyzed your query about "${question}". 

Based on the current student placement data, I can provide the following insights:

- **Total Active Placements**: 156 students
- **Average Placement Duration**: 12.4 weeks
- **Student Satisfaction**: 4.3/5.0
- **Supervisor Ratings**: 4.5/5.0

The system is tracking data across 48 praksis places, 127 departments, and 284 active supervisors. 

Would you like me to provide more specific information about any particular aspect of the placement program? You can ask about:
- Specific institutions or departments
- Student performance metrics
- Capacity and availability
- Contract statuses
- Timeline and deadlines`;
};

export function AnalyticsAI({ userRole }: AnalyticsAIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your Analytics-AI Assistant. I can help you analyze your student placement data, track metrics, and answer questions about your program. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: simulateAIResponse(inputValue),
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (question: string) => {
    setInputValue(question);
    // Auto-send after a brief delay
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: question,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: simulateAIResponse(question),
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
      }, 1500);
    }, 100);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics-AI Assistant</h1>
            <p className="text-sm text-gray-500">Ask questions about your student placement data</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-6">{/* max-w-4xl mx-auto space-y-6 */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Example Questions (only show at start) */}
          {messages.length === 1 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Try asking:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exampleQuestions.map((example, index) => (
                  <div
                    key={index}
                    onClick={() => handleExampleClick(example.question)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <example.icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="text-xs mb-2 bg-gray-50 text-gray-600 border-gray-200">
                          {example.category}
                        </Badge>
                        <p className="text-sm text-gray-700 font-medium">{example.question}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1 rounded">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">AI Assistant</span>
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, index) => {
                    // Handle bold text with **
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={index} className={message.type === 'user' ? 'text-white' : 'text-gray-700'}>
                        {parts.map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={i} className="font-semibold">
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </p>
                    );
                  })}
                </div>
                <span className={`text-xs mt-2 block ${message.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1 rounded">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">AI Assistant</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your placement data..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            AI responses are simulated based on sample data. Press Enter to send.
          </p>
        </div>
      </div>
    </div>
  );
}