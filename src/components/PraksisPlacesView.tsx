import { useState } from "react";
import { PraksisPlace, Contact, Supervisor } from "../types/praksisPlace";
import { OrganizationNode, findNodeById, getNodePath } from "../types/organizationStructure";
import { Button } from "./ui/button";
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Network,
  Users,
  Building2,
  Mail,
  Hospital,
  Building,
  Home,
  Layers,
  Grid3x3,
  Package,
  BedDouble,
  Phone,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { allMockContacts, allMockSupervisors } from "../data/mockContactsAndSupervisors";

interface PraksisPlacesViewProps {
  places: PraksisPlace[];
  onPlaceClick: (place: PraksisPlace) => void;
  onCreatePlace: () => void;
  onPlacesUpdate?: (places: PraksisPlace[]) => void;
  nodeSlots: Record<string, Record<string, number>>;
  onNodeSlotsChange: (placeId: string, slots: Record<string, number>) => void;
}

export function PraksisPlacesView({
  places,
  onPlaceClick,
  onCreatePlace,
  onPlacesUpdate,
  nodeSlots,
  onNodeSlotsChange,
}: PraksisPlacesViewProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination states
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);
  const [contactsSearchQuery, setContactsSearchQuery] = useState("");
  const [supervisorsPage, setSupervisorsPage] = useState(1);
  const [supervisorsPerPage, setSupervisorsPerPage] = useState(10);
  const [supervisorsSearchQuery, setSupervisorsSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"contacts" | "supervisors" | "slots">("contacts");
  
  // Filter states for chips
  const [selectedContactType, setSelectedContactType] = useState<string | null>(null);
  const [selectedSupervisorStatus, setSelectedSupervisorStatus] = useState<string | null>(null);
  const [hideChildItems, setHideChildItems] = useState(false);
  
  // Filter dialog state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeSelect = (place: PraksisPlace, nodeId: string) => {
    setSelectedPlaceId(place.id);
    setSelectedNodeId(nodeId);
    // Don't navigate - just update the UI
  };

  // Get indentation based on level
  const getIndentation = (level: number) => {
    return `${level * 24}px`;
  };

  // Helper function to check if a node or its descendants match the search query
  const nodeMatchesSearch = (node: OrganizationNode, query: string): boolean => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    
    // Check if current node matches
    if (node.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Check if any child matches
    return node.children.some(child => nodeMatchesSearch(child, query));
  };

  // Helper function to get all parent node IDs for a given node
  const getParentNodeIds = (root: OrganizationNode, targetNodeId: string, parents: string[] = []): string[] | null => {
    if (root.id === targetNodeId) {
      return parents;
    }
    
    for (const child of root.children) {
      const result = getParentNodeIds(child, targetNodeId, [...parents, root.id]);
      if (result !== null) {
        return result;
      }
    }
    
    return null;
  };

  // Helper function to collect all matching node IDs and their parents
  const getMatchingNodesAndParents = (node: OrganizationNode, query: string, place: PraksisPlace): Set<string> => {
    const matchingIds = new Set<string>();
    
    if (!query) return matchingIds;
    
    const collectMatches = (currentNode: OrganizationNode) => {
      const lowerQuery = query.toLowerCase();
      
      // Check if current node matches
      if (currentNode.name.toLowerCase().includes(lowerQuery)) {
        matchingIds.add(currentNode.id);
        
        // Add all parent IDs
        if (place.organizationStructure) {
          const parents = getParentNodeIds(place.organizationStructure, currentNode.id);
          if (parents) {
            parents.forEach(parentId => matchingIds.add(parentId));
          }
        }
      }
      
      // Recursively check children
      currentNode.children.forEach(child => collectMatches(child));
    };
    
    collectMatches(node);
    return matchingIds;
  };

  // Filter places by search - MUST come before auto-expand logic
  const filteredPlaces = places.filter((place) => {
    if (!searchQuery) return true;
    
    // Check if place name matches
    if (place.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true;
    }
    
    // Check if any node in the organization structure matches
    if (place.organizationStructure) {
      return nodeMatchesSearch(place.organizationStructure, searchQuery);
    }
    
    return false;
  });

  // Auto-expand nodes based on search
  const autoExpandedNodes = new Set(expandedNodes);
  if (searchQuery) {
    filteredPlaces.forEach(place => {
      if (place.organizationStructure) {
        const matchingIds = getMatchingNodesAndParents(place.organizationStructure, searchQuery, place);
        matchingIds.forEach(id => autoExpandedNodes.add(id));
      }
    });
  }

  // Render organization tree recursively
  const renderOrganizationNode = (
    node: OrganizationNode,
    place: PraksisPlace,
    level: number = 0
  ) => {
    // Skip rendering if this node doesn't match the search
    if (searchQuery && !nodeMatchesSearch(node, searchQuery)) {
      return null;
    }

    const isExpanded = autoExpandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children.length > 0;

    // Get type color
    const getTypeColor = (type: string) => {
      switch (type) {
        case "Helseforetak":
          return "bg-purple-50 text-purple-700 border-purple-200";
        case "Kommune":
          return "bg-indigo-50 text-indigo-700 border-indigo-200";
        case "Klinikk":
          return "bg-blue-50 text-blue-700 border-blue-200";
        case "Sykehjem":
          return "bg-cyan-50 text-cyan-700 border-cyan-200";
        case "Avdeling":
          return "bg-green-50 text-green-700 border-green-200";
        case "Seksjon":
          return "bg-orange-50 text-orange-700 border-orange-200";
        case "Gruppe":
          return "bg-amber-50 text-amber-700 border-amber-200";
        case "Sengepost":
          return "bg-pink-50 text-pink-700 border-pink-200";
        default:
          return "bg-gray-50 text-gray-700 border-gray-200";
      }
    };

    // Get icon for node type
    const getTypeIcon = (type: string) => {
      const iconClass = `h-4 w-4 flex-shrink-0 ${
        isSelected ? "text-white" : ""
      }`;
      
      switch (type) {
        case "Helseforetak":
          return <Hospital className={`${iconClass} ${!isSelected ? "text-purple-600" : ""}`} />;
        case "Kommune":
          return <Building className={`${iconClass} ${!isSelected ? "text-indigo-600" : ""}`} />;
        case "Klinikk":
          return <Building2 className={`${iconClass} ${!isSelected ? "text-blue-600" : ""}`} />;
        case "Sykehjem":
          return <Home className={`${iconClass} ${!isSelected ? "text-cyan-600" : ""}`} />;
        case "Avdeling":
          return <Layers className={`${iconClass} ${!isSelected ? "text-green-600" : ""}`} />;
        case "Seksjon":
          return <Grid3x3 className={`${iconClass} ${!isSelected ? "text-orange-600" : ""}`} />;
        case "Gruppe":
          return <Package className={`${iconClass} ${!isSelected ? "text-amber-600" : ""}`} />;
        case "Sengepost":
          return <BedDouble className={`${iconClass} ${!isSelected ? "text-pink-600" : ""}`} />;
        default:
          return <Building2 className={`${iconClass} ${!isSelected ? "text-gray-600" : ""}`} />;
      }
    };

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
            isSelected
              ? "bg-[#155dfc] text-white"
              : "hover:bg-gray-50 text-gray-700"
          }`}
          style={{ paddingLeft: `${12 + level * 24}px` }}
          onClick={() => handleNodeSelect(place, node.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id, e);
              }}
              className="flex-shrink-0 -ml-1"
            >
              {isExpanded ? (
                <ChevronDown
                  className={`h-4 w-4 ${
                    isSelected ? "text-white" : "text-gray-500"
                  }`}
                />
              ) : (
                <ChevronRight
                  className={`h-4 w-4 ${
                    isSelected ? "text-white" : "text-gray-500"
                  }`}
                />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4 flex-shrink-0" />}
          
          {getTypeIcon(node.type)}
          <span className="text-sm font-medium truncate flex-1">
            {node.name}
          </span>
        </div>

        {isExpanded &&
          hasChildren &&
          node.children.map((child) =>
            renderOrganizationNode(child, place, level + 1)
          )}
      </div>
    );
  };

  // Get selected place and node
  const selectedPlace = places.find((p) => p.id === selectedPlaceId);
  const selectedNode =
    selectedPlace && selectedPlace.organizationStructure && selectedNodeId
      ? findNodeById(selectedPlace.organizationStructure, selectedNodeId)
      : null;

  // Helper function to get all descendant node IDs recursively
  const getAllDescendantIds = (node: OrganizationNode): string[] => {
    const ids = [node.id];
    node.children.forEach((child) => {
      ids.push(...getAllDescendantIds(child));
    });
    return ids;
  };

  // Get contacts for selected node and all descendants
  const getContactsForNode = (node: OrganizationNode | null): Contact[] => {
    if (!node || !selectedPlace) return [];
    
    const descendantIds = getAllDescendantIds(node);
    return allMockContacts.filter((contact) =>
      descendantIds.includes(contact.organizationNodeId)
    );
  };

  // Get supervisors for selected node and all descendants
  const getSupervisorsForNode = (node: OrganizationNode | null): Supervisor[] => {
    if (!node || !selectedPlace) return [];
    
    const descendantIds = getAllDescendantIds(node);
    return allMockSupervisors.filter((supervisor) =>
      descendantIds.includes(supervisor.organizationNodeId)
    );
  };

  // Get breakdown by type for contacts
  const getContactsBreakdown = (contacts: Contact[]) => {
    const breakdown: Record<string, number> = {};
    contacts.forEach((contact) => {
      breakdown[contact.type] = (breakdown[contact.type] || 0) + 1;
    });
    return breakdown;
  };

  // Get breakdown by status for supervisors
  const getSupervisorsBreakdown = (supervisors: Supervisor[]) => {
    const active = supervisors.filter((s) => s.isActive).length;
    const withStudents = supervisors.filter((s) => s.assignedStudents && s.assignedStudents > 0).length;
    return { active, withStudents };
  };

  const contactsForSelectedNode = getContactsForNode(selectedNode);
  const supervisorsForSelectedNode = getSupervisorsForNode(selectedNode);
  const contactsBreakdown = getContactsBreakdown(contactsForSelectedNode);
  const supervisorsBreakdown = getSupervisorsBreakdown(supervisorsForSelectedNode);

  // Debug logging
  console.log('Selected Node:', selectedNode?.name, selectedNode?.id);
  console.log('Contacts for selected node:', contactsForSelectedNode.length);
  console.log('Contacts breakdown:', contactsBreakdown);
  console.log('All mock contacts:', allMockContacts.length);

  // Filter and paginate contacts
  const filteredContacts = contactsForSelectedNode.filter((contact) => {
    // Apply "hide child items" filter - only show items from selected node, not descendants
    if (hideChildItems && contact.organizationNodeId !== selectedNode?.id) {
      return false;
    }
    
    // Apply search filter
    const matchesSearch = contact.name.toLowerCase().includes(contactsSearchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactsSearchQuery.toLowerCase()) ||
      contact.unitName.toLowerCase().includes(contactsSearchQuery.toLowerCase());
    
    // Apply type filter from chip
    const matchesType = !selectedContactType || contact.type === selectedContactType;
    
    return matchesSearch && matchesType;
  });
  const totalContactsPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (contactsPage - 1) * contactsPerPage,
    contactsPage * contactsPerPage
  );

  // Filter and paginate supervisors
  const filteredSupervisors = supervisorsForSelectedNode.filter((supervisor) => {
    // Apply "hide child items" filter - only show items from selected node, not descendants
    if (hideChildItems && supervisor.organizationNodeId !== selectedNode?.id) {
      return false;
    }
    
    // Apply search filter
    const matchesSearch = supervisor.name.toLowerCase().includes(supervisorsSearchQuery.toLowerCase()) ||
      supervisor.email.toLowerCase().includes(supervisorsSearchQuery.toLowerCase()) ||
      supervisor.unitName.toLowerCase().includes(supervisorsSearchQuery.toLowerCase()) ||
      supervisor.specialization.toLowerCase().includes(supervisorsSearchQuery.toLowerCase());
    
    // Apply status filter from chip
    let matchesStatus = true;
    if (selectedSupervisorStatus === 'active') {
      matchesStatus = supervisor.isActive;
    } else if (selectedSupervisorStatus === 'inactive') {
      matchesStatus = !supervisor.isActive;
    } else if (selectedSupervisorStatus === 'withStudents') {
      matchesStatus = supervisor.assignedStudents !== undefined && supervisor.assignedStudents > 0;
    }
    
    return matchesSearch && matchesStatus;
  });
  const totalSupervisorsPages = Math.ceil(filteredSupervisors.length / supervisorsPerPage);
  const paginatedSupervisors = filteredSupervisors.slice(
    (supervisorsPage - 1) * supervisorsPerPage,
    supervisorsPage * supervisorsPerPage
  );

  // Helper function to get full unit path
  const getFullUnitPath = (organizationNodeId: string): string => {
    if (!selectedPlace?.organizationStructure) return "";
    const node = findNodeById(selectedPlace.organizationStructure, organizationNodeId);
    if (!node) return "";
    const path = getNodePath(selectedPlace.organizationStructure, organizationNodeId);
    return path.map(n => n.name).join("/");
  };

  // Helper function to collect all nodes recursively with their paths for slots view
  const collectAllNodesWithPaths = (node: OrganizationNode, parentPath: string = ""): Array<{ node: OrganizationNode; path: string }> => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const result = [{ node, path: currentPath }];
    
    node.children.forEach((child) => {
      result.push(...collectAllNodesWithPaths(child, currentPath));
    });
    
    return result;
  };

  // Get all nodes for slots view
  const getNodesForSlotsView = () => {
    if (!selectedNode) return [];
    
    const allNodes = collectAllNodesWithPaths(selectedNode);
    
    if (hideChildItems) {
      // Only show the selected node itself
      return [allNodes[0]];
    }
    
    return allNodes;
  };

  const nodesForSlots = getNodesForSlotsView();

  // Slots for the currently selected place
  const currentNodeSlots = selectedPlaceId ? (nodeSlots[selectedPlaceId] ?? {}) : {};

  // Handler for updating slot value
  const handleSlotChange = (nodeId: string, value: string) => {
    if (!selectedPlaceId) return;
    const numValue = parseInt(value) || 0;
    onNodeSlotsChange(selectedPlaceId, { ...currentNodeSlots, [nodeId]: numValue });
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-gray-900 text-2xl">Praksis places</h1>
          <Button
            onClick={onCreatePlace}
            className="h-9 gap-2 bg-[#155dfc] hover:bg-[#1147d4] text-white"
          >
            <Plus className="h-4 w-4" />
            New praksis place
          </Button>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Sidebar - Places List */}
        <div className="w-80 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden">
          {/* Search and Filter Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search praksis places..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-white border-gray-200"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterDialogOpen(true)}
                className="h-9 w-9 p-0 border-gray-200 hover:bg-gray-100 flex-shrink-0"
              >
                <Filter className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Scrollable Places List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredPlaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  {searchQuery ? "No places found" : "No praksis places yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlaces.map((place) => {
                  if (!place.organizationStructure) return null;
                  return renderOrganizationNode(
                    place.organizationStructure,
                    place,
                    0
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Node Details */}
        {selectedPlace && selectedNode ? (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Node Header */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedPlace.organizationStructure &&
                        getNodePath(selectedPlace.organizationStructure, selectedNode.id)
                          .map((node, index, array) => (
                            <span key={node.id}>
                              {node.name}
                              {index < array.length - 1 && (
                                <span className="text-gray-400 font-normal mx-2">/</span>
                              )}
                            </span>
                          ))}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          selectedNode.type === "Helseforetak"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : selectedNode.type === "Kommune"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : selectedNode.type === "Klinikk"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : selectedNode.type === "Sykehjem"
                            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                            : selectedNode.type === "Avdeling"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : selectedNode.type === "Seksjon"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : selectedNode.type === "Gruppe"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-pink-50 text-pink-700 border-pink-200"
                        }`}
                      >
                        {selectedNode.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Level {selectedNode.level}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-gray-200 hover:bg-gray-50"
                  >
                    <Network className="h-4 w-4" />
                    Network Diagram
                  </Button>
                </div>
              </div>

              {/* Metrics Cards */}
              

              {/* Tab Buttons - Outside the table container */}
              <div className="border-b border-gray-200 mb-0">
                <div className="flex justify-between items-end">
                  <div className="flex gap-8">
                    <button
                      onClick={() => setActiveTab("contacts")}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "contacts"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Contacts
                    </button>
                    <button
                      onClick={() => setActiveTab("supervisors")}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "supervisors"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Supervisors
                    </button>
                    <button
                      onClick={() => setActiveTab("slots")}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "slots"
                          ? "border-purple-600 text-purple-600"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Slots
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Input - Outside the table container */}
              <div className="mb-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={activeTab === "contacts" ? contactsSearchQuery : supervisorsSearchQuery}
                    onChange={(e) => {
                      if (activeTab === "contacts") {
                        setContactsSearchQuery(e.target.value);
                        setContactsPage(1);
                      } else {
                        setSupervisorsSearchQuery(e.target.value);
                        setSupervisorsPage(1);
                      }
                    }}
                    className="pl-9 h-9 bg-white border-gray-200"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {activeTab === "contacts" && (
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Header with title and Add button */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Contact Persons</h3>
                          <p className="text-sm text-gray-500">Manage all listed types of contact persons</p>
                        </div>
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white h-9 gap-2">
                          <Plus className="h-4 w-4" />
                          Add Contact Person
                        </Button>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(contactsBreakdown)
                            .filter(([type, count]) => count > 0)
                            .map(([type, count]) => (
                              <Badge
                                key={type}
                                onClick={() => {
                                  setSelectedContactType(selectedContactType === type ? null : type);
                                  setContactsPage(1);
                                }}
                                className={`text-xs px-3 py-1.5 cursor-pointer transition-colors ${
                                  selectedContactType === type
                                    ? type === 'Helseforetak'
                                      ? 'bg-purple-600 hover:bg-purple-700 text-white border-0'
                                      : 'bg-gray-900 text-white hover:bg-gray-800 border-0'
                                    : type === 'Helseforetak'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {type}: {count}
                              </Badge>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hideChildItems}
                            onChange={(e) => {
                              setHideChildItems(e.target.checked);
                              setContactsPage(1);
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          Hide child items
                        </label>
                      </div>

                      {/* Table */}
                      {paginatedContacts.length === 0 ? (
                        <div className="text-center py-12 text-sm text-gray-400">
                          No contact persons found
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="font-semibold text-gray-700">TYPE</TableHead>
                                  <TableHead className="font-semibold text-gray-700">NAME</TableHead>
                                  <TableHead className="font-semibold text-gray-700">UNIT</TableHead>
                                  <TableHead className="font-semibold text-gray-700">EMAIL / PHONE</TableHead>
                                  <TableHead className="font-semibold text-gray-700 text-right">ACTIONS</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedContacts.map((contact) => (
                                  <TableRow key={contact.id}>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {contact.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900">
                                      {contact.name}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                      {getFullUnitPath(contact.organizationNodeId)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-1 text-sm">
                                        <span className="flex items-center gap-1.5 text-gray-600">
                                          <Mail className="h-3.5 w-3.5" />
                                          {contact.email}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-gray-600">
                                          <Phone className="h-3.5 w-3.5" />
                                          {contact.phone}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Pagination */}
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>Rows per page:</span>
                              <Select 
                                value={String(contactsPerPage)} 
                                onValueChange={(value) => {
                                  setContactsPerPage(Number(value));
                                  setContactsPage(1);
                                }}
                              >
                                <SelectTrigger className="h-8 w-16">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>
                                Showing {filteredContacts.length > 0 ? (contactsPage - 1) * contactsPerPage + 1 : 0} to {Math.min(contactsPage * contactsPerPage, filteredContacts.length)} of {filteredContacts.length} entries
                              </span>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8" 
                                  disabled={contactsPage === 1}
                                  onClick={() => setContactsPage(contactsPage - 1)}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                                </Button>
                                <span className="text-sm">Page {contactsPage} of {totalContactsPages || 1}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8" 
                                  disabled={contactsPage === totalContactsPages || totalContactsPages === 0}
                                  onClick={() => setContactsPage(contactsPage + 1)}
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "supervisors" && (
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Header with title and Add button */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Supervisors</h3>
                          <p className="text-sm text-gray-500">Manage all supervisors and their assignments</p>
                        </div>
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white h-9 gap-2">
                          <Plus className="h-4 w-4" />
                          Add Supervisor
                        </Button>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            onClick={() => {
                              setSelectedSupervisorStatus(selectedSupervisorStatus === 'active' ? null : 'active');
                              setSupervisorsPage(1);
                            }}
                            className={`text-xs px-3 py-1.5 cursor-pointer transition-colors ${
                              selectedSupervisorStatus === 'active'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            }`}
                          >
                            Active: {supervisorsBreakdown.active}
                          </Badge>
                          <Badge
                            onClick={() => {
                              setSelectedSupervisorStatus(selectedSupervisorStatus === 'withStudents' ? null : 'withStudents');
                              setSupervisorsPage(1);
                            }}
                            className={`text-xs px-3 py-1.5 cursor-pointer transition-colors ${
                              selectedSupervisorStatus === 'withStudents'
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            With students: {supervisorsBreakdown.withStudents}
                          </Badge>
                          <Badge
                            onClick={() => {
                              setSelectedSupervisorStatus(selectedSupervisorStatus === 'inactive' ? null : 'inactive');
                              setSupervisorsPage(1);
                            }}
                            className={`text-xs px-3 py-1.5 cursor-pointer transition-colors ${
                              selectedSupervisorStatus === 'inactive'
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Inactive: {supervisorsForSelectedNode.length - supervisorsBreakdown.active}
                          </Badge>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hideChildItems}
                            onChange={(e) => {
                              setHideChildItems(e.target.checked);
                              setSupervisorsPage(1);
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          Hide child items
                        </label>
                      </div>

                      {/* Table */}
                      {paginatedSupervisors.length === 0 ? (
                        <div className="text-center py-12 text-sm text-gray-400">
                          No supervisors found at this level
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="font-semibold text-gray-700">TYPE</TableHead>
                                  <TableHead className="font-semibold text-gray-700">NAME</TableHead>
                                  <TableHead className="font-semibold text-gray-700">UNIT</TableHead>
                                  <TableHead className="font-semibold text-gray-700">EMAIL / PHONE</TableHead>
                                  <TableHead className="font-semibold text-gray-700">STATUS</TableHead>
                                  <TableHead className="font-semibold text-gray-700 text-right">ACTIONS</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedSupervisors.map((supervisor) => (
                                  <TableRow key={supervisor.id}>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {supervisor.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium text-gray-900">{supervisor.name}</div>
                                        <div className="text-xs text-gray-500">
                                          {supervisor.specialization}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                      {getFullUnitPath(supervisor.organizationNodeId)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-1 text-sm">
                                        <span className="flex items-center gap-1.5 text-gray-600">
                                          <Mail className="h-3.5 w-3.5" />
                                          {supervisor.email}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-gray-600">
                                          <Phone className="h-3.5 w-3.5" />
                                          {supervisor.phone}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-1.5">
                                        {supervisor.isActive ? (
                                          <Badge
                                            variant="outline"
                                            className="bg-green-50 text-green-700 border-green-200 text-xs w-fit"
                                          >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Active
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="bg-gray-50 text-gray-700 border-gray-200 text-xs w-fit"
                                          >
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Inactive
                                          </Badge>
                                        )}
                                        {supervisor.assignedStudents && supervisor.assignedStudents > 0 && (
                                          <span className="text-xs text-gray-600">
                                            {supervisor.assignedStudents} {supervisor.assignedStudents === 1 ? 'student' : 'students'}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Pagination */}
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>Rows per page:</span>
                              <Select 
                                value={String(supervisorsPerPage)} 
                                onValueChange={(value) => {
                                  setSupervisorsPerPage(Number(value));
                                  setSupervisorsPage(1);
                                }}
                              >
                                <SelectTrigger className="h-8 w-16">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>
                                Showing {filteredSupervisors.length > 0 ? (supervisorsPage - 1) * supervisorsPerPage + 1 : 0} to {Math.min(supervisorsPage * supervisorsPerPage, filteredSupervisors.length)} of {filteredSupervisors.length} entries
                              </span>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8" 
                                  disabled={supervisorsPage === 1}
                                  onClick={() => setSupervisorsPage(supervisorsPage - 1)}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                                </Button>
                                <span className="text-sm">Page {supervisorsPage} of {totalSupervisorsPages || 1}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8" 
                                  disabled={supervisorsPage === totalSupervisorsPages || totalSupervisorsPages === 0}
                                  onClick={() => setSupervisorsPage(supervisorsPage + 1)}
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "slots" && (
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Header with title and description */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Student Slots</h3>
                          <p className="text-sm text-gray-500">Configure how many students each place can accept per semester</p>
                        </div>
                      </div>

                      {/* Filter - Hide child items checkbox */}
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hideChildItems}
                            onChange={(e) => setHideChildItems(e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          Hide child items
                        </label>
                      </div>

                      {/* Table */}
                      {nodesForSlots.length === 0 ? (
                        <div className="text-center py-12 text-sm text-gray-400">
                          No places to configure
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="font-semibold text-gray-700">TYPE</TableHead>
                                  <TableHead className="font-semibold text-gray-700">PLACE / SUB-PLACE</TableHead>
                                  <TableHead className="font-semibold text-gray-700 w-48">STUDENT CAPACITY</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {nodesForSlots.map(({ node, path }) => (
                                  <TableRow key={node.id}>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          node.type === "Helseforetak"
                                            ? "bg-purple-50 text-purple-700 border-purple-200"
                                            : node.type === "Kommune"
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            : node.type === "Klinikk"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : node.type === "Sykehjem"
                                            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                                            : node.type === "Avdeling"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : node.type === "Seksjon"
                                            ? "bg-orange-50 text-orange-700 border-orange-200"
                                            : node.type === "Gruppe"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-pink-50 text-pink-700 border-pink-200"
                                        }`}
                                      >
                                        {node.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900">
                                      {path}
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={currentNodeSlots[node.id] || ""}
                                        onChange={(e) => handleSlotChange(node.id, e.target.value)}
                                        className="h-9 w-32"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Summary */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-600">
                              Total places: {nodesForSlots.length}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              Total capacity: {Object.values(currentNodeSlots).reduce((sum, val) => sum + (val || 0), 0)} students
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Select a praksis place to see details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Praksis Places</DialogTitle>
            <DialogDescription>
              Filter options will be configured here.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center text-sm text-gray-500">
            Filter options coming soon...
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
