import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Building2, 
  Folder, 
  Users, 
  GraduationCap, 
  Mail,
  Phone,
  ChevronRight,
  Plus,
  Eye,
  Edit,
  UserCheck
} from 'lucide-react';
import { PraksisPlaceHierarchical, Unit, calculateUnitStats, calculatePlaceStats } from '../types/praksisPlaceHierarchy';
import { ContactPerson, Department } from '../types/praksisPlace';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface StructureOverviewTabProps {
  praksisPlace: PraksisPlaceHierarchical;
  onNavigateToUnit: (unitId: string) => void;
  onNavigateToPeople: (departmentId?: string) => void;
  onAddUnit: () => void;
  onAddMainContact: () => void;
  onEditUnit?: (unitId: string) => void;
  onEditDepartment?: (deptId: string) => void;
}

export function StructureOverviewTab({
  praksisPlace,
  onNavigateToUnit,
  onNavigateToPeople,
  onAddUnit,
  onAddMainContact,
  onEditUnit,
  onEditDepartment,
}: StructureOverviewTabProps) {
  const stats = calculatePlaceStats(praksisPlace);

  return (
    <div className="space-y-6">
      {/* Top-Level Place Card */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Building2}
              value={stats.totalUnits}
              label="Units"
              color="purple"
            />
            <StatCard
              icon={Folder}
              value={stats.totalDepartments}
              label="Departments"
              color="blue"
            />
            <StatCard
              icon={Users}
              value={stats.totalSupervisors}
              label="Supervisors"
              color="green"
            />
            <StatCard
              icon={GraduationCap}
              value={stats.totalStudents}
              label="Students"
              color="orange"
              badge={stats.unassignedStudents > 0 ? {
                value: stats.unassignedStudents,
                label: 'unassigned',
                variant: 'warning'
              } : undefined}
            />
          </div>

          {/* Main Contacts */}
          {praksisPlace.contactPersons.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Main Contacts ({praksisPlace.contactPersons.length})
              </h4>
              <div className="space-y-2">
                {praksisPlace.contactPersons.map((contact) => (
                  <ContactPersonCard key={contact.id} contact={contact} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onAddUnit} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Unit
            </Button>
            <Button onClick={onAddMainContact} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Main Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Units Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Units ({stats.totalUnits})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {praksisPlace.units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onViewDetails={() => onNavigateToUnit(unit.id)}
              onEdit={onEditUnit}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: 'purple' | 'blue' | 'green' | 'orange';
  badge?: {
    value: number;
    label: string;
    variant: 'warning' | 'success';
  };
}

function StatCard({ icon: Icon, value, label, color, badge }: StatCardProps) {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
          {badge && (
            <Badge 
              variant={badge.variant === 'warning' ? 'destructive' : 'default'}
              className="mt-1 text-xs"
            >
              {badge.value} {badge.label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Contact Person Card
function ContactPersonCard({ contact }: { contact: ContactPerson }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{contact.name}</span>
          <Badge variant="outline" className="text-xs">
            {contact.role || 'MC'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {contact.email}
          </span>
          {contact.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {contact.phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Unit Card Component
interface UnitCardProps {
  unit: Unit;
  onViewDetails: () => void;
  onEdit?: (unitId: string) => void;
}

function UnitCard({ unit, onViewDetails, onEdit }: UnitCardProps) {
  const stats = calculateUnitStats(unit);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">{unit.name}</CardTitle>
          </div>
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(unit.id);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
        {unit.description && (
          <CardDescription className="text-sm">{unit.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <StatBadge value={stats.totalDepartments} label="departments" />
          <StatBadge value={stats.totalSupervisors} label="supervisors" />
          <StatBadge value={stats.totalStudents} label="students" />
          {stats.totalContactPersons > 0 && (
            <StatBadge value={stats.totalContactPersons} label="contacts" />
          )}
        </div>
        
        <Button 
          onClick={onViewDetails} 
          className="w-full gap-2"
          variant="default"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StatBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center text-sm text-gray-600">
      <span className="font-medium text-gray-900">{value}</span>
      <span className="ml-1">{label}</span>
    </div>
  );
}

// Unit Detail View (shown when drilling down)
interface UnitDetailViewProps {
  unit: Unit;
  praksisPlaceName: string;
  onBack: () => void;
  onNavigateToPeople: (departmentId: string) => void;
  onAddDepartment: () => void;
  onAddContact: () => void;
  onAddSupervisor: () => void;
  onEditDepartment?: (deptId: string) => void;
}

export function UnitDetailView({
  unit,
  praksisPlaceName,
  onBack,
  onNavigateToPeople,
  onAddDepartment,
  onAddContact,
  onAddSupervisor,
  onEditDepartment,
}: UnitDetailViewProps) {
  const stats = calculateUnitStats(unit);
  const [quickViewDept, setQuickViewDept] = useState<Department | null>(null);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="gap-2 px-2"
      >
        ← Back to {praksisPlaceName}
      </Button>

      {/* Unit Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Folder className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{unit.name}</CardTitle>
              <CardDescription>
                {stats.totalDepartments} Departments | {stats.totalSupervisors} Supervisors | {stats.totalStudents} Students
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Unit Contacts */}
          {unit.contactPersons.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Unit Contacts ({unit.contactPersons.length})
              </h4>
              <div className="space-y-2">
                {unit.contactPersons.map((contact) => (
                  <ContactPersonCard key={contact.id} contact={contact} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={onAddDepartment} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
            <Button onClick={onAddSupervisor} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Supervisor
            </Button>
            <Button onClick={onAddContact} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Departments Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Departments ({stats.totalDepartments})
        </h3>
        <div className="space-y-3">
          {unit.departments.map((dept) => (
            <DepartmentRow
              key={dept.id}
              department={dept}
              onManageSupervisors={() => onNavigateToPeople(dept.id)}
              onQuickView={() => setQuickViewDept(dept)}
              onEdit={onEditDepartment}
            />
          ))}
        </div>
      </div>

      {/* Quick View Popover */}
      {quickViewDept && (
        <QuickViewPopover
          department={quickViewDept}
          isOpen={!!quickViewDept}
          onClose={() => setQuickViewDept(null)}
          onViewAll={() => {
            setQuickViewDept(null);
            onNavigateToPeople(quickViewDept.id);
          }}
        />
      )}
    </div>
  );
}

// Department Row Component
interface DepartmentRowProps {
  department: Department;
  onManageSupervisors: () => void;
  onQuickView: () => void;
  onEdit?: (deptId: string) => void;
}

function DepartmentRow({ department, onManageSupervisors, onQuickView, onEdit }: DepartmentRowProps) {
  const studentCount = department.students?.length || 0;
  const supervisorCount = department.supervisors.length;
  const contactCount = department.contactPerson ? 1 : 0;

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{department.name}</h4>
            {!department.isActive && (
              <Badge variant="outline" className="text-xs">Inactive</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{contactCount} DC</span>
            <span>•</span>
            <span>{supervisorCount} SU</span>
            <span>•</span>
            <span>{studentCount} ST</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Quick View
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">{department.name} - Supervisors</h4>
                  {department.supervisors.length > 0 ? (
                    <div className="space-y-2">
                      {department.supervisors.slice(0, 5).map((supervisor) => (
                        <div key={supervisor.id} className="flex items-center justify-between text-sm">
                          <span>{supervisor.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {supervisor.assignedStudents || 0}/
                              {department.capacity || 5}
                            </Badge>
                            {supervisor.isActive ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                                Available
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {department.supervisors.length > 5 && (
                        <p className="text-xs text-gray-500">
                          ... {department.supervisors.length - 5} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No supervisors added yet</p>
                  )}
                </div>
                <Button 
                  onClick={onManageSupervisors} 
                  className="w-full gap-2"
                  size="sm"
                >
                  View All & Edit →
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={onManageSupervisors} className="gap-2">
            Manage Supervisors
          </Button>
          
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(department.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick View Popover Component (alternative implementation)
interface QuickViewPopoverProps {
  department: Department;
  isOpen: boolean;
  onClose: () => void;
  onViewAll: () => void;
}

function QuickViewPopover({ department, isOpen, onClose, onViewAll }: QuickViewPopoverProps) {
  if (!isOpen) return null;

  return null; // Using inline Popover instead
}
