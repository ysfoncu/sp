import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Building2, Hospital, Stethoscope, Layers, LayoutGrid, Bed, MapPin, Home, Users, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { OrganizationNode } from "../types/organizationStructure";
import { PraksisPlace } from "../types/praksisPlace";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

interface HierarchicalOrganizationSelectorProps {
  praksisPlaces: PraksisPlace[];
  selectedPraksisPlaceId: string | null;
  selectedOrganizationNodeId: string | null;
  onPraksisPlaceSelect: (placeId: string | null) => void;
  onOrganizationNodeSelect: (nodeId: string | null, nodeName: string | null) => void;
  onAddEntity?: (nodeId: string, nodeName: string, quantity: number) => void;
  addedEntityIds?: string[];
  disabled?: boolean;
  placeholder?: string;
  showOptionalLabel?: boolean;
  skipPlaceSelection?: boolean;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "Helseforetak": return Hospital;
    case "Klinikk":      return Stethoscope;
    case "Avdeling":     return Layers;
    case "Seksjon":      return LayoutGrid;
    case "Sengepost":    return Bed;
    case "Kommune":      return MapPin;
    case "Sykehjem":     return Home;
    case "Gruppe":       return Users;
    default:             return Building2;
  }
}

function getTypeIconColor(type: string): string {
  switch (type) {
    case "Helseforetak": return "text-green-600";
    case "Klinikk":      return "text-purple-600";
    case "Avdeling":     return "text-blue-500";
    case "Seksjon":      return "text-orange-500";
    case "Sengepost":    return "text-rose-500";
    case "Kommune":      return "text-teal-600";
    case "Sykehjem":     return "text-yellow-600";
    case "Gruppe":       return "text-gray-500";
    default:             return "text-gray-400";
  }
}

export function HierarchicalOrganizationSelector({
  praksisPlaces,
  selectedPraksisPlaceId,
  selectedOrganizationNodeId,
  onPraksisPlaceSelect,
  onOrganizationNodeSelect,
  onAddEntity,
  addedEntityIds = [],
  disabled = false,
  placeholder: _placeholder = "Select organization unit",
  showOptionalLabel = false,
  skipPlaceSelection = false,
}: HierarchicalOrganizationSelectorProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodeQuotas, setNodeQuotas] = useState<Record<string, number>>({});

  const selectedPlace = praksisPlaces.find((p) => p.id === selectedPraksisPlaceId);

  // When the place changes, collapse everything and reset per-node quotas
  useEffect(() => {
    setExpandedNodes(new Set());
    setNodeQuotas({});
  }, [selectedPraksisPlaceId]);

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleSelectNode = (node: OrganizationNode) => {
    onOrganizationNodeSelect(node.id, node.name);
  };

  const handlePraksisPlaceChange = (place: PraksisPlace) => {
    onPraksisPlaceSelect(place.id);
    onOrganizationNodeSelect(null, null);
  };

  const handleAddClick = (node: OrganizationNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddEntity) {
      const qty = nodeQuotas[node.id] ?? 1;
      onAddEntity(node.id, node.name, qty);
      setNodeQuotas((prev) => ({ ...prev, [node.id]: 1 }));
    }
  };

  // Recursive tree node renderer
  const renderNode = (node: OrganizationNode, depth: number) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedOrganizationNodeId === node.id;
    const isAdded = addedEntityIds.includes(node.id);
    const TypeIcon = getTypeIcon(node.type);

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-1.5 py-1.5 pr-2 rounded-md",
            isSelected ? "bg-blue-50" : "hover:bg-gray-50",
            disabled && "opacity-50",
          )}
          style={{ paddingLeft: `${depth * 20 + 4}px` }}
        >
          {/* Expand/collapse toggle */}
          <button
            type="button"
            onClick={(e) => hasChildren && toggleExpand(node.id, e)}
            disabled={disabled || !hasChildren}
            className={cn(
              "flex-shrink-0 w-6 h-6 flex items-center justify-center rounded border transition-colors",
              hasChildren
                ? "border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-100 cursor-pointer"
                : "border-transparent cursor-default",
            )}
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              ))}
          </button>

          {/* Type icon + name */}
          <button
            type="button"
            onClick={() => !disabled && handleSelectNode(node)}
            disabled={disabled}
            className="flex-1 flex items-center gap-2 text-left min-w-0"
          >
            <TypeIcon
              className={cn(
                "h-4 w-4 flex-shrink-0",
                isSelected ? "text-blue-500" : getTypeIconColor(node.type),
              )}
            />
            <span
              className={cn(
                "text-sm truncate",
                isSelected ? "font-semibold text-blue-700" : "text-gray-800",
              )}
            >
              {node.name}
            </span>
          </button>

          {/* Number input + add button */}
          {onAddEntity && (
            <div
              className="flex items-center gap-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="number"
                min={1}
                max={999}
                value={nodeQuotas[node.id] ?? 1}
                onChange={(e) =>
                  setNodeQuotas((prev) => ({
                    ...prev,
                    [node.id]: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
                disabled={disabled}
                className="w-12 h-6 text-xs text-center border border-gray-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={(e) => handleAddClick(node, e)}
                disabled={disabled || isAdded}
                className="w-6 h-6 flex items-center justify-center rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {showOptionalLabel && (
        <p className="text-xs text-gray-500">
          {!selectedPraksisPlaceId && "Select a praksis place first"}
          {selectedPraksisPlaceId &&
            !selectedOrganizationNodeId &&
            "Navigate to select a specific unit (optional)"}
        </p>
      )}

      {/* No place selected yet (skipPlaceSelection mode) */}
      {skipPlaceSelection && !selectedPraksisPlaceId && (
        <div className="border border-gray-200 rounded-md p-4 text-center">
          <p className="text-sm text-gray-500">
            Please select a praksis place first
          </p>
        </div>
      )}

      {/* Praksis Place list (non-skip mode) */}
      {!selectedPraksisPlaceId && !skipPlaceSelection && (
        <ScrollArea className="h-64 border border-gray-200 rounded-md">
          <div className="p-2 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
              Select Praksis Place
            </p>
            {praksisPlaces.map((place) => (
              <button
                key={place.id}
                onClick={() => handlePraksisPlaceChange(place)}
                disabled={disabled}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span>{place.name}</span>
                </div>
                {place.organizationType && (
                  <Badge variant="outline" className="text-xs">
                    {place.organizationType}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Tree view */}
      {selectedPraksisPlaceId && selectedPlace?.organizationStructure && (
        <ScrollArea className="h-64 border border-gray-200 rounded-md">
          <div className="p-2">
            {renderNode(selectedPlace.organizationStructure, 0)}
          </div>
        </ScrollArea>
      )}

      {/* Change place button (non-skip mode) */}
      {selectedPraksisPlaceId && !skipPlaceSelection && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onPraksisPlaceSelect(null);
            onOrganizationNodeSelect(null, null);
          }}
          className="w-full"
        >
          Change Praksis Place
        </Button>
      )}
    </div>
  );
}
