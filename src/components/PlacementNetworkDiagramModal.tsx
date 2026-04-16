import 'reactflow/dist/style.css';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Building2, User, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { 
  ReactFlow, 
  ReactFlowProvider,
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap,
  Position,
  Handle,
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType
} from 'reactflow';
import { useMemo, useCallback, useRef, useEffect } from 'react';

interface PlacementNetworkDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Array<{
    id: string;
    name: string;
    assignedPlace?: {
      placeId: string;
      placeName: string;
      departmentId: string;
      departmentName: string;
    };
  }>;
  quotas: Array<{
    requestId: string;
    placeId: string;
    placeName: string;
    departmentId: string;
    departmentName: string;
    currentAssigned: number;
    quota: number;
    status?: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  }>;
  placementTitle: string;
  onAssignStudent: (studentId: string, placeId: string, departmentId: string, placeName: string, departmentName: string, quotaRequestId: string) => void;
  onUnassignStudent: (studentId: string) => void;
}

// Custom edge with delete button
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className="size-6 rounded-full bg-white border-2 border-red-400 hover:bg-red-50 hover:border-red-600 transition-colors flex items-center justify-center shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              if (data?.onDelete) {
                data.onDelete();
              }
            }}
            title="Remove assignment"
          >
            <X className="size-3 text-red-600" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Custom node for Praksis Place
const PlaceNode = ({ data }: any) => {
  const utilizationPercent = data.quota > 0 ? (data.assigned / data.quota) * 100 : 0;
  const isOverCapacity = data.assigned > data.quota;
  const isAtCapacity = data.assigned === data.quota && data.quota > 0;
  const hasSpace = data.assigned < data.quota;
  const isPending = data.status === 'pending';
  
  return (
    <div className={`px-4 py-3 rounded-lg border-2 shadow-md hover:shadow-lg transition-shadow w-[220px] relative ${ 
      isOverCapacity 
        ? 'bg-red-100 border-red-500' 
        : isAtCapacity 
          ? 'bg-amber-50 border-amber-400'
          : isPending
            ? 'bg-gray-50 border-gray-300 border-dashed'
            : 'bg-blue-50 border-blue-400'
    }`}>
      <Handle type="source" position={Position.Right} className={`w-3 h-3 ${
        isOverCapacity ? 'bg-red-600' : isAtCapacity ? 'bg-amber-600' : isPending ? 'bg-gray-400' : 'bg-blue-600'
      }`} />
      <div className="flex items-center gap-2 mb-1">
        <Building2 className={`size-4 ${
          isOverCapacity ? 'text-red-700' : isAtCapacity ? 'text-amber-700' : isPending ? 'text-gray-600' : 'text-blue-700'
        }`} />
        <div className={`text-xs font-semibold uppercase ${
          isOverCapacity ? 'text-red-900' : isAtCapacity ? 'text-amber-900' : isPending ? 'text-gray-700' : 'text-blue-900'
        }`}>
          PRAKSIS PLACE {isPending && '(PENDING)'}
        </div>
      </div>
      <div className="font-semibold text-sm text-gray-900 mb-1">{data.label}</div>
      <div className="text-xs text-gray-600">{data.department}</div>
      {data.requestId && (
        <div className="text-xs text-gray-500 font-mono mt-1" title="Request ID">
          ID: {data.requestId.substring(0, 12)}...
        </div>
      )}
      <div className={`text-xs font-semibold mt-2 ${
        isOverCapacity ? 'text-red-700' : isAtCapacity ? 'text-amber-700' : isPending ? 'text-gray-600' : 'text-blue-700'
      }`}>
        {data.assigned} / {data.quota} students
      </div>
      {!isOverCapacity && hasSpace && !isPending && (
        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Custom node for Student
const StudentNode = ({ data }: any) => {
  const isUnassigned = data.isUnassigned;
  
  return (
    <div className={`px-4 py-2.5 rounded-lg border-2 shadow-md hover:shadow-lg transition-shadow w-[180px] relative ${
      isUnassigned
        ? 'bg-gray-50 border-gray-300 border-dashed'
        : 'bg-green-50 border-green-400'
    }`}>
      <Handle type="target" position={Position.Left} className={`w-3 h-3 ${
        isUnassigned ? 'bg-gray-400' : 'bg-green-600'
      }`} />
      <div className="flex items-center gap-2 mb-1">
        <User className={`size-3.5 ${isUnassigned ? 'text-gray-500' : 'text-green-700'}`} />
        <div className={`text-xs font-semibold uppercase ${isUnassigned ? 'text-gray-600' : 'text-green-800'}`}>
          Student {isUnassigned && <span className="normal-case font-normal">(Unassigned)</span>}
        </div>
      </div>
      <div className={`font-medium text-sm ${isUnassigned ? 'text-gray-700' : 'text-gray-900'}`}>
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  place: PlaceNode,
  student: StudentNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Inner component that has access to ReactFlow instance
function DiagramContent({ 
  students,
  quotas,
  onAssignStudent,
  onUnassignStudent
}: PlacementNetworkDiagramModalProps & { isOpen: boolean; onClose: () => void }) {
  
  const reactFlowInstance = useReactFlow();
  const fitViewCalled = useRef(false);
  
  // Handle edge deletion (unassign student)
  const handleDeleteEdge = useCallback((edgeId: string, studentId: string) => {
    const student = students.find(s => s.id === studentId);
    
    if (student) {
      onUnassignStudent(studentId);
      toast.success(`${student.name} unassigned`);
    }
  }, [students, onUnassignStudent]);
  
  // Process data to create nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Calculate dynamic spacing based on counts
    const placeCount = quotas.length;
    const studentCount = students.length;
    
    // Adjust spacing to fit content
    const placeSpacing = Math.max(120, Math.min(180, 800 / (placeCount || 1)));
    const studentSpacing = Math.max(80, Math.min(120, 800 / (studentCount || 1)));
    const horizontalSpacing = 500;
    
    let placeYOffset = 50;
    let studentYOffset = 50;
    
    // Track how many students are assigned to each quota request
    const requestAssignmentCounts = new Map<string, number>();
    students.forEach(student => {
      if (student.assignedPlace) {
        // Count by requestId if available, otherwise by place+dept (for backward compat)
        const requestId = (student.assignedPlace as any).quotaRequestId;
        if (requestId) {
          requestAssignmentCounts.set(requestId, (requestAssignmentCounts.get(requestId) || 0) + 1);
        }
      }
    });
    
    // Create place nodes (left side) - one per quota request
    quotas.forEach(quota => {
      const assignedCount = requestAssignmentCounts.get(quota.requestId) || 0;
      
      nodes.push({
        id: `place-${quota.requestId}`,
        type: 'place',
        position: { x: 50, y: placeYOffset },
        data: { 
          label: quota.placeName,
          department: quota.departmentName,
          assigned: assignedCount,
          quota: quota.quota,
          placeId: quota.placeId,
          departmentId: quota.departmentId,
          requestId: quota.requestId,
          status: quota.status
        },
      });
      
      placeYOffset += placeSpacing;
    });
    
    // Create student nodes (right side) and edges
    students.forEach(student => {
      const isUnassigned = !student.assignedPlace;
      
      nodes.push({
        id: `student-${student.id}`,
        type: 'student',
        position: { x: horizontalSpacing, y: studentYOffset },
        data: { 
          label: student.name,
          isUnassigned: isUnassigned,
          studentId: student.id
        },
      });
      
      // Create edge if student is assigned
      if (student.assignedPlace) {
        // Find the quota request this student is assigned to
        const requestId = (student.assignedPlace as any).quotaRequestId;
        const quota = quotas.find(q => q.requestId === requestId);
        
        // If no specific request, try to match by place+dept (backward compatibility)
        const fallbackQuota = !quota ? quotas.find(q => 
          q.placeId === student.assignedPlace?.placeId && 
          q.departmentId === student.assignedPlace?.departmentId
        ) : null;
        
        const targetQuota = quota || fallbackQuota;
        
        if (targetQuota) {
          const placeNodeId = `place-${targetQuota.requestId}`;
          const assignedCount = requestAssignmentCounts.get(targetQuota.requestId) || 0;
          const isOverCapacity = assignedCount > targetQuota.quota;
          
          edges.push({
            id: `edge-${targetQuota.requestId}-${student.id}`,
            source: placeNodeId,
            target: `student-${student.id}`,
            type: 'custom',
            animated: isOverCapacity,
            style: { 
              stroke: isOverCapacity ? '#ef4444' : '#10b981',
              strokeWidth: isOverCapacity ? 4 : 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isOverCapacity ? '#ef4444' : '#10b981',
              width: 20,
              height: 20,
            },
            data: {
              placeId: student.assignedPlace.placeId,
              departmentId: student.assignedPlace.departmentId,
              studentId: student.id,
              onDelete: () => handleDeleteEdge(`edge-${targetQuota.requestId}-${student.id}`, student.id)
            }
          });
        }
      }
      
      studentYOffset += studentSpacing;
    });
    
    return { nodes, edges };
  }, [students, quotas, handleDeleteEdge]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(currentNodes => {
      if (currentNodes.length === 0) {
        return initialNodes;
      }
      
      const positionMap = new Map(
        currentNodes.map(node => [node.id, node.position])
      );
      
      return initialNodes.map(newNode => {
        const existingPosition = positionMap.get(newNode.id);
        return existingPosition 
          ? { ...newNode, position: existingPosition }
          : newNode;
      });
    });
    
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);
  
  // Fit view on mount and when nodes change
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0 && !fitViewCalled.current) {
      setTimeout(() => {
        reactFlowInstance.fitView({ 
          padding: 0.2,
          duration: 200
        });
        fitViewCalled.current = true;
      }, 50);
    }
  }, [reactFlowInstance, nodes]);
  
  // Handle new connection creation (assign student to place)
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Find the quota based on the source node ID (which is now place-${requestId})
      const sourceNodeId = params.source;
      const matchingQuota = quotas.find(q => `place-${q.requestId}` === sourceNodeId);
      
      const studentId = params.target?.replace('student-', '');
      
      if (!matchingQuota || !studentId) {
        return;
      }
      
      const student = students.find(s => s.id === studentId);
      
      if (!student) {
        toast.error('Invalid student');
        return;
      }
      
      if (student.assignedPlace && 
          student.assignedPlace.placeId === matchingQuota.placeId &&
          student.assignedPlace.departmentId === matchingQuota.departmentId) {
        toast.error('Student already assigned to this place');
        return;
      }
      
      // Count students assigned to this specific quota request
      const currentAssigned = students.filter(s => {
        const reqId = (s.assignedPlace as any)?.quotaRequestId;
        return reqId === matchingQuota.requestId;
      }).length;
      
      if (currentAssigned >= matchingQuota.quota) {
        const proceed = window.confirm(
          `${matchingQuota.placeName} - ${matchingQuota.departmentName} (Request ${matchingQuota.requestId.substring(0, 8)}...) is at full capacity (${currentAssigned}/${matchingQuota.quota}). Assign anyway?`
        );
        if (!proceed) return;
      }
      
      onAssignStudent(
        studentId, 
        matchingQuota.placeId, 
        matchingQuota.departmentId,
        matchingQuota.placeName,
        matchingQuota.departmentName,
        matchingQuota.requestId
      );
      
      toast.success(`${student.name} assigned to ${matchingQuota.placeName} - ${matchingQuota.departmentName}`);
    },
    [students, quotas, onAssignStudent]
  );
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {quotas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Building2 className="size-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Praksis Places Available
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            You need to have approved quota requests matching this placement's study, program, dates, and emne 
            to visualize placements in this diagram. Go to the "Available Quotas" section and request quotas 
            from praksis places, then have them approved before they appear here.
          </p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (node.type === 'place') {
                const data = node.data as any;
                if (data.assigned > data.quota) return '#ef4444';
                if (data.assigned === data.quota) return '#f59e0b';
                return '#3b82f6';
              }
              return node.data.isUnassigned ? '#9ca3af' : '#10b981';
            }}
            position="bottom-right"
            pannable
            zoomable
          />
        </ReactFlow>
      )}
    </div>
  );
}

export function PlacementNetworkDiagramModal(props: PlacementNetworkDiagramModalProps) {
  if (!props.isOpen) return null;
  
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onClose}>
      <DialogContent 
        className="p-0 flex flex-col"
        style={{ 
          maxWidth: '95vw', 
          width: '95vw', 
          height: '95vh', 
          maxHeight: '95vh' 
        }}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <Building2 className="size-5 text-purple-600" />
            Placement Network Diagram
            <span className="text-sm font-normal text-gray-500">
              - {props.placementTitle}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Visualize and manage student placements across different praksis places. Drag connections from places to students to assign them.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ReactFlowProvider>
            <DiagramContent {...props} />
          </ReactFlowProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}