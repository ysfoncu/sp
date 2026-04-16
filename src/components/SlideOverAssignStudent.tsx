import { useState, useEffect } from 'react';
import { X, Search, Building2, Users, MapPin, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { PraksisPlace } from '../types/praksisPlace';
import { Student } from '../types/placementTask';
import { QuotaSelection } from './SlideOverManageQuota';
import svgPaths from '../imports/svg-45rp0v0sba';

interface SlideOverAssignStudentProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  students?: Student[];
  praksisPlaces: PraksisPlace[];
  quotas?: QuotaSelection[];
  onAssign: (studentId: string, placeId: string, departmentId: string, requestApproval?: boolean) => void;
  allStudents?: Student[]; // All students in the placement to calculate assigned count
}

export function SlideOverAssignStudent({
  isOpen,
  onClose,
  student,
  students,
  praksisPlaces,
  quotas = [],
  onAssign,
  allStudents
}: SlideOverAssignStudentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPlaces, setExpandedPlaces] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [requestApproval, setRequestApproval] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<{
    placeId: string;
    departmentId: string;
  } | null>(null);

  // Pre-select current assignment when editing
  useEffect(() => {
    if (isOpen && student?.assignedPraksisPlace) {
      const { placeId, departmentId } = student.assignedPraksisPlace;
      setSelectedDepartment({ placeId, departmentId });
      setExpandedPlaces(new Set([placeId]));
    }
  }, [isOpen, student]);

  // Get all unique tags from departments
  const allTags = Array.from(
    new Set(
      praksisPlaces.flatMap(place => 
        place.departments.flatMap(dept => dept.tags || [])
      )
    )
  );

  const togglePlace = (placeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const handleSelectDepartment = (placeId: string, departmentId: string) => {
    setSelectedDepartment({ placeId, departmentId });
  };

  const handleAssign = () => {
    if (selectedDepartment) {
      // If there are multiple students, assign all of them
      if (students && students.length > 0) {
        students.forEach(s => {
          onAssign(s.id, selectedDepartment.placeId, selectedDepartment.departmentId, requestApproval);
        });
      } else if (student) {
        // Single student assignment
        onAssign(student.id, selectedDepartment.placeId, selectedDepartment.departmentId, requestApproval);
      }
      setSelectedDepartment(null);
      setSearchTerm('');
      setSelectedTags([]);
      setExpandedPlaces(new Set());
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDepartment(null);
    setSearchTerm('');
    setSelectedTags([]);
    setRequestApproval(false);
    setExpandedPlaces(new Set());
    onClose();
  };

  // Filter praksis places based on search and tags
  const filteredPlaces = praksisPlaces
    .filter(place => {
      // CRITICAL: Only show places that have quotas selected
      // If no quotas exist, show nothing
      const hasQuota = quotas.some(q => q.placeId === place.id);
      if (!hasQuota) return false;

      const searchLower = searchTerm.toLowerCase();
      const placeMatch = place.name.toLowerCase().includes(searchLower) ||
                         place.address.toLowerCase().includes(searchLower);
      const departmentMatch = place.departments.some(dept => 
        dept.name.toLowerCase().includes(searchLower) ||
        dept.description?.toLowerCase().includes(searchLower)
      );
      
      const searchMatches = searchTerm === '' || placeMatch || departmentMatch;
      
      // Tag filtering
      const tagMatches = selectedTags.length === 0 || place.departments.some(dept =>
        dept.tags?.some(tag => selectedTags.includes(tag))
      );
      
      return searchMatches && tagMatches;
    })
    // Filter to only show departments that have quotas assigned
    .map(place => {
      // Only show departments that have quotas assigned
      const departmentsWithQuotas = place.departments.filter(dept =>
        quotas.some(q => q.placeId === place.id && q.departmentId === dept.id)
      );
      return {
        ...place,
        departments: departmentsWithQuotas
      };
    })
    .filter(place => place.departments.length > 0); // Remove places with no departments

  // Get selected place and department info for summary
  const selectedPlace = selectedDepartment 
    ? praksisPlaces.find(p => p.id === selectedDepartment.placeId)
    : null;
  const selectedDept = selectedPlace && selectedDepartment
    ? selectedPlace.departments.find(d => d.id === selectedDepartment.departmentId)
    : null;

  // Helper to get capacity color
  const getCapacityColor = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Slide-over Panel - Wider for better table display */}
      <div className="fixed inset-y-0 right-0 w-[1200px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        
        {/* Header with Title and Buttons */}
        <div className="bg-gray-50 border-b border-gray-200 px-7 py-4.5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[17.5px] text-[#1e2939] tracking-[-0.4358px]">
              Assign to Praksis Place
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[6.75px] px-[15px] py-[8px] text-[#0a0a0a] text-[12.25px] font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedDepartment}
                className="bg-[#155dfc] rounded-[6.75px] px-[14px] py-[7px] text-white text-[12.25px] font-medium hover:bg-[#1250dd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign to Department
              </button>
            </div>
          </div>
        </div>

        {/* Selected Student Info */}
        {student && !students && (
          <div className="bg-[#eff6ff] border-b border-[#e5e7eb] px-7 pt-4.5 pb-3.5">
            <div className="bg-[#eff6ff] border border-[#bedbff] rounded-[8.75px] px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="bg-[#dbeafe] rounded-[8.75px] p-[7px] w-[28px] h-[28px] flex items-center justify-center">
                  <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 14 14">
                    <g>
                      <path d={svgPaths.p2d56ab00} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p1bd13108} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p28d55600} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p24f65af0} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    </g>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#1e2939] text-[12.25px] tracking-[-0.0179px]">{student.name}</div>
                  <div className="text-[#4a5565] text-[10.5px] mt-0.5 tracking-[0.0923px]">{student.email}</div>
                </div>
                <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[6.75px] px-2 py-0.5">
                  <span className="text-[#0a0a0a] text-[10.5px] font-medium tracking-[0.0923px]">{student.year}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Students Info */}
        {students && students.length > 0 && (
          <div className="bg-[#eff6ff] border-b border-[#e5e7eb] px-7 pt-4.5 pb-3.5">
            <div className="bg-[#eff6ff] border border-[#bedbff] rounded-[8.75px] px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="bg-[#dbeafe] rounded-[8.75px] p-[7px] w-[28px] h-[28px] flex items-center justify-center">
                  <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 14 14">
                    <g>
                      <path d={svgPaths.p2d56ab00} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p1bd13108} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p28d55600} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      <path d={svgPaths.p24f65af0} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                    </g>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#1e2939] text-[12.25px] mb-1 tracking-[-0.0179px]">
                    {students.length} student{students.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-auto">
                    {students.map((s) => (
                      <div key={s.id} className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[6.75px] px-2 py-0.5">
                        <span className="text-[#0a0a0a] text-[10.5px] font-medium tracking-[0.0923px]">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="px-7 pt-3.5 pb-3 border-b border-[#e5e7eb] space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search praksis places or departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f3f3f5] border-0 rounded-[6.75px] pl-[35px] pr-3 py-2 text-[#0a0a0a] text-[12.25px] placeholder:text-[#717182] focus:outline-none focus:ring-1 focus:ring-[#155dfc]"
            />
            <svg className="absolute left-[10.5px] top-1/2 -translate-y-1/2 w-[14px] h-[14px]" fill="none" viewBox="0 0 14 14">
              <g>
                <path d="M12.25 12.25L9.71834 9.71834" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                <path d={svgPaths.p8cdb700} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
              </g>
            </svg>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-[#6a7282] text-[10.5px] tracking-[0.0923px]">
                <svg className="w-[10.5px] h-[10.5px]" fill="none" viewBox="0 0 10.5 10.5">
                  <g clipPath="url(#clip0_91_3485)">
                    <path d={svgPaths.p29b46e00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.875" />
                  </g>
                  <defs>
                    <clipPath id="clip0_91_3485">
                      <rect fill="white" height="10.5" width="10.5" />
                    </clipPath>
                  </defs>
                </svg>
                <span>Tags:</span>
              </div>
              {allTags.slice(0, 10).map(tag => (
                <button
                  key={tag}
                  className={`rounded-[6.75px] px-2 py-0.5 text-[10.5px] font-medium tracking-[0.0923px] transition-colors border ${
                    selectedTags.includes(tag)
                      ? 'bg-white text-[#4a5565] border-[#d1d5dc]'
                      : 'bg-white text-[#4a5565] border-[#d1d5dc] hover:border-[#155dfc]'
                  }`}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Praksis Places List - Table-like Display */}
        <div className="flex-1 overflow-auto px-7 pt-3.5 pb-24">
          {/* Column Headers */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-tl-[8.75px] rounded-tr-[8.75px] px-[15px] pt-3 pb-2.5">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1"></div>
              <div className="col-span-3">
                <span className="text-[#364153] text-[10.5px] font-semibold uppercase tracking-[0.3548px]">
                  Praksis Place
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[#364153] text-[10.5px] font-semibold uppercase tracking-[0.3548px]">
                  Departments
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-[#364153] text-[10.5px] font-semibold uppercase tracking-[0.3548px]">
                  Added Quota
                </span>
              </div>
              <div className="col-span-1 text-center">
                <span className="text-[#364153] text-[10.5px] font-semibold uppercase tracking-[0.3548px]">
                  Requested
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-[#364153] text-[10.5px] font-semibold uppercase tracking-[0.3548px]">
                  Assigned
                </span>
              </div>
              <div className="col-span-1 text-center">
                <span className="text-[#364153] text-[10.5px] font-semibold uppercase tracking-[0.3548px]">
                  Available
                </span>
              </div>
            </div>
          </div>

          {filteredPlaces.length > 0 ? (
            <div className="border-l border-r border-[#e5e7eb]">
              {filteredPlaces.map((place) => {
                const totalCapacity = place.departments.reduce((sum, d) => sum + d.capacity, 0);
                const totalCurrent = place.departments.reduce((sum, d) => sum + (d.currentCapacity || 0), 0);
                
                return (
                  <div
                    key={place.id}
                    className="border-b border-[#f3f4f6]"
                  >
                    {/* Place Header - Clickable Row */}
                    <div
                      onClick={(e) => togglePlace(place.id, e)}
                      className="cursor-pointer hover:bg-[#f9fafb] transition-colors bg-[#f9fafb]"
                    >
                      <div className="grid grid-cols-12 gap-4 px-[15px] py-2.5 items-center">
                        {/* Expand Icon */}
                        <div className="col-span-1 flex items-center">
                          {expandedPlaces.has(place.id) ? (
                            <ChevronDown className="h-3.5 w-3.5 text-[#4a5565]" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-[#4a5565]" />
                          )}
                        </div>
                        
                        {/* Praksis Place Name */}
                        <div className="col-span-3">
                          <div className="font-medium text-[#1e2939] text-[12.25px] tracking-[-0.0179px]">{place.name}</div>
                          <div className="text-[#6a7282] text-[10.5px] mt-0.5 tracking-[0.0923px]">{place.address}, {place.city}</div>
                        </div>
                        
                        {/* Department Count */}
                        <div className="col-span-2">
                          <div className="text-[#4a5565] text-[12.25px] tracking-[-0.0179px]">
                            {place.departments.length} department{place.departments.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {/* Added Quota */}
                        <div className="col-span-2 text-center">
                          <div className="text-[#364153] text-[12.25px] font-medium tracking-[-0.0179px]">
                            {place.departments.reduce((sum, d) => {
                              const quota = quotas.find(q => q.placeId === place.id && q.departmentId === d.id);
                              return sum + (quota?.fixedQuota || 0);
                            }, 0)}
                          </div>
                        </div>
                        
                        {/* Requested Quota */}
                        <div className="col-span-1 text-center">
                          <div className="text-[#364153] text-[12.25px] font-medium tracking-[-0.0179px]">
                            {place.departments.reduce((sum, d) => {
                              const quota = quotas.find(q => q.placeId === place.id && q.departmentId === d.id);
                              return sum + (quota?.requestQuota || 0);
                            }, 0)}
                          </div>
                        </div>
                        
                        {/* Assigned */}
                        <div className="col-span-2 text-center">
                          <div className="text-[#364153] text-[12.25px] font-medium tracking-[-0.0179px]">
                            {place.departments.reduce((sum, d) => {
                              const assignedCount = allStudents?.filter(
                                s => s.assignedPraksisPlace?.placeId === place.id && 
                                     s.assignedPraksisPlace?.departmentId === d.id
                              ).length || 0;
                              return sum + assignedCount;
                            }, 0)}
                          </div>
                        </div>
                        
                        {/* Available */}
                        <div className="col-span-1 text-center">
                          <div className="text-[#364153] text-[12.25px] font-medium tracking-[-0.0179px]">
                            {place.departments.reduce((sum, d) => {
                              const quota = quotas.find(q => q.placeId === place.id && q.departmentId === d.id);
                              const totalQuota = (quota?.fixedQuota || 0) + (quota?.requestQuota || 0);
                              const assignedCount = allStudents?.filter(
                                s => s.assignedPraksisPlace?.placeId === place.id && 
                                     s.assignedPraksisPlace?.departmentId === d.id
                              ).length || 0;
                              return sum + Math.max(0, totalQuota - assignedCount);
                            }, 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Departments - Expanded View */}
                    {expandedPlaces.has(place.id) && (
                      <div className="bg-white">
                        {place.departments.map((dept) => {
                          const isSelected = 
                            selectedDepartment?.placeId === place.id &&
                            selectedDepartment?.departmentId === dept.id;
                          
                          // Get quota information for this department
                          const quota = quotas.find(q => q.placeId === place.id && q.departmentId === dept.id);
                          const fixedQuota = quota?.fixedQuota || 0;
                          const requestQuota = quota?.requestQuota || 0;
                          const totalQuota = fixedQuota + requestQuota;

                          // Calculate assigned students count
                          const assignedCount = allStudents?.filter(
                            s => s.assignedPraksisPlace?.placeId === place.id && 
                                 s.assignedPraksisPlace?.departmentId === dept.id
                          ).length || 0;

                          // Check if quota is full
                          const isQuotaFull = assignedCount >= totalQuota && totalQuota > 0;

                          return (
                            <div
                              key={dept.id}
                              onClick={() => !isQuotaFull && handleSelectDepartment(place.id, dept.id)}
                              className={`border-b border-[#f3f4f6] last:border-b-0 transition-colors ${
                                isQuotaFull
                                  ? 'bg-gray-100 cursor-not-allowed opacity-60'
                                  : `cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#eff6ff]'
                                        : 'hover:bg-gray-50'
                                    }`
                              }`}
                            >
                              <div className="grid grid-cols-12 gap-4 px-[15px] py-2.5 items-center">
                                {/* Selection Indicator */}
                                <div className="col-span-1 flex items-center justify-center">
                                  {isSelected && !isQuotaFull && (
                                    <div className="bg-blue-600 text-white rounded-full p-0.5">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                  {isQuotaFull && (
                                    <div className="bg-red-100 text-red-600 rounded-full p-0.5">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Department Name and Tags */}
                                <div className="col-span-5 pl-3.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#364153] text-[12.25px] font-medium tracking-[-0.0179px]">
                                      {dept.name}
                                    </span>
                                    {dept.tags && dept.tags.length > 0 && (
                                      <div className="flex gap-1">
                                        {dept.tags.slice(0, 2).map(tag => (
                                          <div key={tag} className="bg-white border border-[#bedbff] rounded-[6.75px] px-[6.25px] py-px">
                                            <span className="text-[#155dfc] text-[10.5px] font-medium tracking-[0.0923px]">{tag}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Added Quota */}
                                <div className="col-span-2 text-center">
                                  <div className="text-[#364153] text-[12.25px] font-medium tracking-[-0.0179px]">
                                    {fixedQuota}
                                  </div>
                                </div>
                                
                                {/* Requested Quota */}
                                <div className="col-span-1 text-center">
                                  <div className="text-[#364153] text-[12.25px] font-medium tracking-[-0.0179px]">
                                    {requestQuota}
                                  </div>
                                </div>
                                
                                {/* Assigned */}
                                <div className="col-span-2 text-center">
                                  <div className="text-[#364153] text-[12.25px] font-medium tracking-[-0.0179px]">
                                    {assignedCount}
                                  </div>
                                </div>
                                
                                {/* Available */}
                                <div className="col-span-1 text-center">
                                  <div className={`text-[12.25px] font-medium tracking-[-0.0179px] ${
                                    isQuotaFull ? 'text-red-600' : 'text-[#364153]'
                                  }`}>
                                    {Math.max(0, totalQuota - assignedCount)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No praksis places with assigned quotas found.
              {searchTerm && <p className="mt-2 text-sm">Try adjusting your search or filters.</p>}
            </div>
          )}
        </div>

        {/* Assignment Summary - Floating Card */}
        {selectedDepartment && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-56px)] max-w-[782px]">
            <div className="bg-[#eff6ff] border border-[#96b9ff] rounded-[20px] shadow-[2px_2px_12px_0px_rgba(0,51,115,0.2)] px-5 pt-5 pb-3">
              <h3 className="font-semibold text-[14px] text-[#193cb8] tracking-[-0.1504px] mb-2">
                Assignment Summary
              </h3>
              
              <div className="flex gap-[60px] mb-2">
                {/* Selected Students */}
                <div className="w-[200px]">
                  <p className="text-[#1447e6] text-[10.5px] font-medium tracking-[0.0923px] mb-1.5">
                    Selected Students ({students ? students.length : 1}):
                  </p>
                  {students && students.length > 0 ? (
                    <div className="space-y-1">
                      {students.map((s) => (
                        <div key={s.id} className="flex items-start gap-1">
                          <span className="text-[#99a1af] text-[12.25px]">•</span>
                          <span className="text-[#1c398e] text-[12.25px] font-bold tracking-[-0.0179px]">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : student ? (
                    <div className="flex items-start gap-1">
                      <span className="text-[#99a1af] text-[12.25px]">•</span>
                      <span className="text-[#1c398e] text-[12.25px] font-bold tracking-[-0.0179px]">{student.name}</span>
                    </div>
                  ) : null}
                </div>

                {/* Praksis Place */}
                <div className="w-[200px]">
                  <p className="text-[#1447e6] text-[10.5px] font-medium tracking-[0.0923px] mb-1.5">
                    Praksis Place:
                  </p>
                  <p className="text-[#1c398e] text-[12.25px] font-bold tracking-[-0.0179px]">
                    {selectedPlace?.name || 'N/A'}
                  </p>
                </div>

                {/* Department */}
                <div className="w-[200px]">
                  <p className="text-[#1447e6] text-[10.5px] font-medium tracking-[0.0923px] mb-1.5">
                    Department:
                  </p>
                  <p className="text-[#1c398e] text-[12.25px] font-bold tracking-[-0.0179px]">
                    {selectedDept?.name || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="h-px bg-[#e9eaeb] my-2" />

              {/* Request Approval Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div 
                  onClick={() => setRequestApproval(!requestApproval)}
                  className={`bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)] rounded-[4px] w-[14px] h-[14px] flex items-center justify-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
                    requestApproval ? 'bg-[#155dfc] border-[#155dfc]' : ''
                  }`}
                >
                  {requestApproval && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[#1447e6] text-[12.25px] tracking-[-0.0179px]">
                  Request approval from praksis place
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
