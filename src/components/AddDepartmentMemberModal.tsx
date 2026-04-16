import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, X, Trash2 } from 'lucide-react';
import { Department, Supervisor } from '../types/praksisPlace';
import { TagInput } from './TagInput';

interface AddDepartmentMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  praksisPlaceName: string;
  onSave: (departments: Omit<Department, 'id'>[]) => void;
}

export function AddDepartmentMemberModal({ 
  isOpen, 
  onClose, 
  praksisPlaceName,
  onSave 
}: AddDepartmentMemberModalProps) {
  const [departments, setDepartments] = useState<Array<Omit<Department, 'id'>>>([]);
  
  // Current department being added
  const [currentDepartment, setCurrentDepartment] = useState({
    name: '',
    description: '',
    capacity: 0,
    tags: [] as string[],
    supervisors: [] as Supervisor[],
    isActive: true
  });

  // Current supervisor being added
  const [currentSupervisor, setCurrentSupervisor] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddSupervisor = () => {
    if (!currentSupervisor.name || !currentSupervisor.email) {
      return;
    }

    const newSupervisor: Supervisor = {
      id: `temp-sup-${Date.now()}`,
      ...currentSupervisor
    };

    setCurrentDepartment({
      ...currentDepartment,
      supervisors: [...currentDepartment.supervisors, newSupervisor]
    });

    setCurrentSupervisor({
      name: '',
      email: '',
      phone: '',
      specialization: ''
    });
  };

  const handleRemoveSupervisor = (index: number) => {
    const updatedSupervisors = currentDepartment.supervisors.filter((_, i) => i !== index);
    setCurrentDepartment({
      ...currentDepartment,
      supervisors: updatedSupervisors
    });
  };

  const handleAddDepartment = () => {
    const newErrors: Record<string, string> = {};

    if (!currentDepartment.name.trim()) {
      newErrors.departmentName = 'Department name is required';
    }
    if (!currentDepartment.description.trim()) {
      newErrors.departmentDescription = 'Description is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setDepartments([...departments, currentDepartment]);
    setCurrentDepartment({
      name: '',
      description: '',
      capacity: 0,
      tags: [],
      supervisors: [],
      isActive: true
    });
    setErrors({});
  };

  const handleRemoveDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(departments);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[21px] font-bold text-[#364153]">
            Add Departments
          </DialogTitle>
          <DialogDescription className="text-[12.25px] text-[#6a7282] mt-2">
            Complete the setup for <span className="font-semibold text-[#364153]">{praksisPlaceName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Add Department Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h3 className="text-[12.25px] font-semibold text-[#364153] uppercase tracking-wider">
              Add New Department
            </h3>

            <div className="space-y-4">
              <div className="space-y-[7px]">
                <label className="font-medium text-[#364153] text-[12.25px]">
                  Department Name <span className="text-[#fb2c36]">*</span>
                </label>
                <Input
                  value={currentDepartment.name}
                  onChange={(e) => setCurrentDepartment({ ...currentDepartment, name: e.target.value })}
                  placeholder="Emergency Department"
                  className={`h-[35px] bg-[#f3f3f5] border-0 text-[12.25px] ${
                    errors.departmentName ? 'ring-2 ring-red-500' : ''
                  }`}
                />
                {errors.departmentName && (
                  <span className="text-[10.5px] text-red-500">{errors.departmentName}</span>
                )}
              </div>

              <div className="space-y-[7px]">
                <label className="font-medium text-[#364153] text-[12.25px]">
                  Description <span className="text-[#fb2c36]\">*</span>
                </label>
                <Textarea
                  value={currentDepartment.description}
                  onChange={(e) => setCurrentDepartment({ ...currentDepartment, description: e.target.value })}
                  placeholder="Acute care and emergency medicine"
                  className={`min-h-[70px] bg-[#f3f3f5] border-0 text-[12.25px] resize-none ${
                    errors.departmentDescription ? 'ring-2 ring-red-500' : ''
                  }`}
                />
                {errors.departmentDescription && (
                  <span className="text-[10.5px] text-red-500">{errors.departmentDescription}</span>
                )}
              </div>

              <div className="space-y-[7px]">
                <label className="font-medium text-[#364153] text-[12.25px]">
                  Capacity
                </label>
                <Input
                  type="number"
                  value={currentDepartment.capacity || ''}
                  onChange={(e) => setCurrentDepartment({ ...currentDepartment, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="20"
                  className="h-[35px] bg-[#f3f3f5] border-0 text-[12.25px]"
                />
              </div>

              <div className="space-y-[7px]">
                <label className="font-medium text-[#364153] text-[12.25px]">
                  Tags
                </label>
                <TagInput
                  tags={currentDepartment.tags}
                  onChange={(tags) => setCurrentDepartment({ ...currentDepartment, tags })}
                  placeholder="Add tags..."
                />
              </div>

              {/* Supervisors Section */}
              <div className="space-y-3">
                <label className="font-medium text-[#364153] text-[12.25px]">
                  Supervisors
                </label>
                
                {/* Add Supervisor Form */}
                <div className="bg-[#f9fafb] border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={currentSupervisor.name}
                      onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, name: e.target.value })}
                      placeholder="Name"
                      className="h-[35px] bg-white border-gray-200 text-[12.25px]"
                    />
                    <Input
                      value={currentSupervisor.email}
                      onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, email: e.target.value })}
                      placeholder="Email"
                      className="h-[35px] bg-white border-gray-200 text-[12.25px]"
                    />
                    <Input
                      value={currentSupervisor.phone}
                      onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, phone: e.target.value })}
                      placeholder="Phone"
                      className="h-[35px] bg-white border-gray-200 text-[12.25px]"
                    />
                    <Input
                      value={currentSupervisor.specialization}
                      onChange={(e) => setCurrentSupervisor({ ...currentSupervisor, specialization: e.target.value })}
                      placeholder="Specialization"
                      className="h-[35px] bg-white border-gray-200 text-[12.25px]"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddSupervisor}
                    variant="outline"
                    size="sm"
                    className="h-[30px] text-[11px]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Supervisor
                  </Button>
                </div>

                {/* Supervisor List */}
                {currentDepartment.supervisors.length > 0 && (
                  <div className="space-y-2">
                    {currentDepartment.supervisors.map((supervisor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <div>
                          <p className="text-[12.25px] font-medium text-[#364153]">{supervisor.name}</p>
                          <p className="text-[10.5px] text-[#6a7282]">
                            {supervisor.email} • {supervisor.specialization}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSupervisor(index)}
                          className="h-7 w-7 p-0 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddDepartment}
              className="w-full h-[35px] bg-[#155dfc] hover:bg-[#1147d4] text-white text-[12.25px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>

          {/* Added Departments List */}
          {departments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[12.25px] font-semibold text-[#364153]">
                Added Departments ({departments.length})
              </h3>
              {departments.map((dept, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#364153] text-[12.25px]">{dept.name}</h4>
                      <p className="text-[10.5px] text-[#6a7282] mt-1">{dept.description}</p>
                      {dept.capacity > 0 && (
                        <p className="text-[10.5px] text-[#6a7282] mt-1">Capacity: {dept.capacity}</p>
                      )}
                      {dept.supervisors.length > 0 && (
                        <p className="text-[10.5px] text-[#6a7282] mt-1">
                          Supervisors: {dept.supervisors.map(s => s.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDepartment(index)}
                      className="h-7 w-7 p-0 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            className="h-[35px] px-6 text-[12.25px]"
          >
            Skip for Now
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="h-[35px] px-6 bg-[#155dfc] hover:bg-[#1147d4] text-white text-[12.25px]"
          >
            Save & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
