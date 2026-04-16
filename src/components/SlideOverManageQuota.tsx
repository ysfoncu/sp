import { useState, useEffect, Fragment } from "react";
import {
  X,
  Search,
  Building2,
  ChevronDown,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { PraksisPlace } from "../types/praksisPlace";

export interface QuotaSelection {
  placeId: string;
  placeName: string;
  departmentId: string;
  departmentName: string;
  fixedQuota: number;
  requestQuota: number;
}

interface SlideOverManageQuotaProps {
  isOpen: boolean;
  onClose: () => void;
  praksisPlaces: PraksisPlace[];
  onSaveQuotas: (quotas: QuotaSelection[]) => void;
  existingQuotas?: QuotaSelection[];
}

export function SlideOverManageQuota({
  isOpen,
  onClose,
  praksisPlaces,
  onSaveQuotas,
  existingQuotas = [],
}: SlideOverManageQuotaProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPlaces, setExpandedPlaces] = useState<
    Set<string>
  >(new Set());
  const [selectedTags, setSelectedTags] = useState<string[]>(
    [],
  );
  const [quotaInputs, setQuotaInputs] = useState<
    Map<string, QuotaSelection>
  >(new Map());

  useEffect(() => {
    if (isOpen) {
      // Initialize quota inputs from existing quotas
      const inputMap = new Map<string, QuotaSelection>();
      existingQuotas.forEach((q) => {
        const key = `${q.placeId}-${q.departmentId}`;
        inputMap.set(key, { ...q });
      });
      setQuotaInputs(inputMap);

      // Auto-expand places that have existing quotas
      const expandedIds = new Set<string>();
      existingQuotas.forEach((q) => expandedIds.add(q.placeId));
      setExpandedPlaces(expandedIds);

      setSearchTerm("");
      setSelectedTags([]);
    }
  }, [isOpen, existingQuotas]);

  // Get all unique tags from departments
  const allTags = Array.from(
    new Set(
      praksisPlaces.flatMap((place) =>
        place.departments.flatMap((dept) => dept.tags || []),
      ),
    ),
  );

  const togglePlace = (
    placeId: string,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    setExpandedPlaces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const handleUpdateQuota = (
    placeId: string,
    placeName: string,
    departmentId: string,
    departmentName: string,
    field: "fixedQuota" | "requestQuota",
    value: number,
  ) => {
    const key = `${placeId}-${departmentId}`;
    const newInputs = new Map(quotaInputs);

    const existingQuota = newInputs.get(key) || {
      placeId,
      placeName,
      departmentId,
      departmentName,
      fixedQuota: 0,
      requestQuota: 0,
    };

    existingQuota[field] = Math.max(0, value);
    newInputs.set(key, existingQuota);
    setQuotaInputs(newInputs);
  };

  const handleSave = () => {
    // Convert map to array and filter out entries with both values = 0
    const quotasArray = Array.from(quotaInputs.values()).filter(
      (q) => q.fixedQuota > 0 || q.requestQuota > 0,
    );
    onSaveQuotas(quotasArray);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm("");
    setExpandedPlaces(new Set());
    setSelectedTags([]);
    onClose();
  };

  // Check if there are any changes
  const hasChanges = () => {
    // Check if number of quotas changed
    if (quotaInputs.size !== existingQuotas.length) {
      return true;
    }

    // Check if any quota values changed
    for (const [key, quota] of quotaInputs.entries()) {
      const existing = existingQuotas.find(
        (q) => `${q.placeId}-${q.departmentId}` === key,
      );
      if (!existing) return true;
      if (
        existing.fixedQuota !== quota.fixedQuota ||
        existing.requestQuota !== quota.requestQuota
      ) {
        return true;
      }
    }

    return false;
  };

  // Filter praksis places based on search and tags
  const filteredPlaces = praksisPlaces.filter((place) => {
    const searchLower = searchTerm.toLowerCase();
    const placeMatch =
      place.name.toLowerCase().includes(searchLower) ||
      place.address.toLowerCase().includes(searchLower);
    const departmentMatch = place.departments.some(
      (dept) =>
        dept.name.toLowerCase().includes(searchLower) ||
        dept.description?.toLowerCase().includes(searchLower),
    );

    const searchMatches =
      searchTerm === "" || placeMatch || departmentMatch;

    // Tag filtering
    const tagMatches =
      selectedTags.length === 0 ||
      place.departments.some((dept) =>
        dept.tags?.some((tag) => selectedTags.includes(tag)),
      );

    return searchMatches && tagMatches;
  });

  // Calculate summary
  const quotasWithValues = Array.from(
    quotaInputs.values(),
  ).filter((q) => q.fixedQuota > 0 || q.requestQuota > 0);
  const totalFixedQuotas = quotasWithValues.reduce(
    (sum, q) => sum + q.fixedQuota,
    0,
  );
  const totalRequestQuotas = quotasWithValues.reduce(
    (sum, q) => sum + q.requestQuota,
    0,
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-[1200px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Select/Request Quotas
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter quota values directly in the table below.
                If you add number to "Request quota" field,
                contact person in praksis place should approve
                your request.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                If you don't see the praksis place create new
                praksis place using "Praksis places" sidebar
                item.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges()}
                className={`${
                  !hasChanges()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Save Quotas
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-8 py-4 border-b border-gray-200 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search praksis places or departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Filter className="h-3 w-3" />
                <span>Tags:</span>
              </div>
              {allTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer text-xs px-2 py-0.5 ${
                    selectedTags.includes(tag)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(
                        selectedTags.filter((t) => t !== tag),
                      );
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content Area - Table with inputs */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {filteredPlaces.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[40%]">
                        Praksis Place / Department
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-[20%]">
                        Quota
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-[20%]">
                        Add Quota
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-[20%]">
                        Request Quota
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredPlaces.map((place) => {
                      const isExpanded = expandedPlaces.has(
                        place.id,
                      );

                      const placeAddedQuota =
                        place.departments.reduce(
                          (sum, dept) => {
                            const key = `${place.id}-${dept.id}`;
                            const quotaInput =
                              quotaInputs.get(key);
                            return (
                              sum +
                              (quotaInput?.fixedQuota || 0)
                            );
                          },
                          0,
                        );

                      const placeRequestedQuota =
                        place.departments.reduce(
                          (sum, dept) => {
                            const key = `${place.id}-${dept.id}`;
                            const quotaInput =
                              quotaInputs.get(key);
                            return (
                              sum +
                              (quotaInput?.requestQuota || 0)
                            );
                          },
                          0,
                        );

                      return (
                        <Fragment key={place.id}>
                          {/* Place Header Row */}
                          <tr
                            className="border-b border-gray-100 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                            onClick={() =>
                              togglePlace(place.id)
                            }
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                )}
                                <Building2 className="h-4 w-4 text-gray-500" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-800">
                                    {place.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {place.address} •{" "}
                                    {place.departments.length}{" "}
                                    department
                                    {place.departments
                                      .length !== 1
                                      ? "s"
                                      : ""}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {placeRequestedQuota > 0 || placeAddedQuota > 0 ? (
                                <span className="text-sm font-medium text-gray-800">
                                  {placeRequestedQuota}/{placeAddedQuota}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No data
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {placeAddedQuota > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  {placeAddedQuota}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No data
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {placeRequestedQuota > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  {placeRequestedQuota}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No data
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Department Rows */}
                          {isExpanded &&
                            place.departments
                              .filter((department) => {
                                // If no tags are selected, show all departments
                                if (selectedTags.length === 0) {
                                  return true;
                                }
                                // If tags are selected, only show departments that have at least one matching tag
                                return department.tags?.some((tag) =>
                                  selectedTags.includes(tag)
                                );
                              })
                              .map(
                              (department) => {
                                const key = `${place.id}-${department.id}`;
                                const quotaInput =
                                  quotaInputs.get(key);
                                const hasValue =
                                  quotaInput &&
                                  (quotaInput.fixedQuota > 0 ||
                                    quotaInput.requestQuota >
                                      0);

                                return (
                                  <tr
                                    key={department.id}
                                    className={`border-b border-gray-100 last:border-b-0 transition-colors ${
                                      hasValue
                                        ? "bg-blue-50"
                                        : "hover:bg-gray-50"
                                    }`}
                                  >
                                    <td className="px-4 py-3 pl-12">
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                                        >
                                          Dept
                                        </Badge>
                                        <div>
                                          <div className="text-sm font-medium text-gray-800">
                                            {department.name}
                                          </div>
                                          {department.description && (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                              {
                                                department.description
                                              }
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {quotaInput?.requestQuota || quotaInput?.fixedQuota ? (
                                        <span className="text-sm font-medium text-gray-800">
                                          {quotaInput?.requestQuota || 0}/{quotaInput?.fixedQuota || 0}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-400">
                                          No data
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          quotaInput?.fixedQuota ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleUpdateQuota(
                                            place.id,
                                            place.name,
                                            department.id,
                                            department.name,
                                            "fixedQuota",
                                            parseInt(
                                              e.target.value,
                                            ) || 0,
                                          )
                                        }
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                                        onClick={(e) =>
                                          e.stopPropagation()
                                        }
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          quotaInput?.requestQuota ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleUpdateQuota(
                                            place.id,
                                            place.name,
                                            department.id,
                                            department.name,
                                            "requestQuota",
                                            parseInt(
                                              e.target.value,
                                            ) || 0,
                                          )
                                        }
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                                        onClick={(e) =>
                                          e.stopPropagation()
                                        }
                                      />
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No praksis places found</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Summary Card - Fixed at center bottom */}
        {quotasWithValues.length > 0 && (
          <div className="fixed bottom-8 right-[calc(min(1200px,90vw)/2)] transform translate-x-1/2 z-60">
            <div className="bg-[#eff6ff] border border-[#96b9ff] rounded-[20px] px-7 py-4 shadow-[2px_2px_12px_0px_rgba(0,51,115,0.2)]">
              <div className="mb-2">
                <p className="text-[12.25px] font-semibold text-[#193cb8] leading-[17.5px]">
                  Current Selection Summary
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3.5 text-[12.25px]">
                <div>
                  <span className="text-[#1447e6]">
                    Departments:{" "}
                  </span>
                  <span className="font-semibold text-[#1c398e]">
                    {quotasWithValues.length}
                  </span>
                </div>
                <div>
                  <span className="text-[#1447e6]">
                    Total Added:{" "}
                  </span>
                  <span className="font-semibold text-[#1c398e]">
                    {totalFixedQuotas}
                  </span>
                </div>
                <div>
                  <span className="text-[#1447e6]">
                    Total Requested:{" "}
                  </span>
                  <span className="font-semibold text-[#1c398e]">
                    {totalRequestQuotas}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
