import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PraksisPlace, Contract, Department, Supervisor } from '../types/praksisPlace';
import { Plus, X, Mail, Phone, MapPin, Building, Users, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PraksisPlaceDetailModalProps {
  place: PraksisPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (place: PraksisPlace) => void;
}

export function PraksisPlaceDetailModal({ place, isOpen, onClose, onUpdate }: PraksisPlaceDetailModalProps) {
  const [showAddContract, setShowAddContract] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showAddSupervisor, setShowAddSupervisor] = useState<string | null>(null);

  const [newContract, setNewContract] = useState<Partial<Contract>>({
    contractNumber: '',
    startDate: '',
    endDate: '',
    status: 'pending',
    terms: ''
  });

  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
    name: '',
    description: '',
    capacity: 0,
    supervisors: []
  });

  const [newSupervisor, setNewSupervisor] = useState<Partial<Supervisor>>({
    name: '',
    email: '',
    phone: '',
    specialization: ''
  });

  if (!place) return null;

  const handleAddContract = () => {
    if (!newContract.contractNumber || !newContract.startDate || !newContract.endDate) return;
    
    const contract: Contract = {
      id: `c${Date.now()}`,
      contractNumber: newContract.contractNumber,
      startDate: newContract.startDate,
      endDate: newContract.endDate,
      status: newContract.status as 'active' | 'expired' | 'pending',
      terms: newContract.terms || ''
    };

    const updatedPlace = {
      ...place,
      contracts: [...place.contracts, contract]
    };

    onUpdate(updatedPlace);
    setNewContract({ contractNumber: '', startDate: '', endDate: '', status: 'pending', terms: '' });
    setShowAddContract(false);
  };

  const handleRemoveContract = (contractId: string) => {
    const updatedPlace = {
      ...place,
      contracts: place.contracts.filter(c => c.id !== contractId)
    };
    onUpdate(updatedPlace);
  };

  const handleAddDepartment = () => {
    if (!newDepartment.name) return;
    
    const department: Department = {
      id: `d${Date.now()}`,
      name: newDepartment.name,
      description: newDepartment.description || '',
      capacity: newDepartment.capacity || 0,
      supervisors: []
    };

    const updatedPlace = {
      ...place,
      departments: [...place.departments, department]
    };

    onUpdate(updatedPlace);
    setNewDepartment({ name: '', description: '', capacity: 0, supervisors: [] });
    setShowAddDepartment(false);
  };

  const handleRemoveDepartment = (departmentId: string) => {
    const updatedPlace = {
      ...place,
      departments: place.departments.filter(d => d.id !== departmentId)
    };
    onUpdate(updatedPlace);
  };

  const handleAddSupervisor = (departmentId: string) => {
    if (!newSupervisor.name || !newSupervisor.email) return;
    
    const supervisor: Supervisor = {
      id: `s${Date.now()}`,
      name: newSupervisor.name,
      email: newSupervisor.email,
      phone: newSupervisor.phone || '',
      specialization: newSupervisor.specialization || ''
    };

    const updatedPlace = {
      ...place,
      departments: place.departments.map(dept => 
        dept.id === departmentId 
          ? { ...dept, supervisors: [...dept.supervisors, supervisor] }
          : dept
      )
    };

    onUpdate(updatedPlace);
    setNewSupervisor({ name: '', email: '', phone: '', specialization: '' });
    setShowAddSupervisor(null);
  };

  const handleRemoveSupervisor = (departmentId: string, supervisorId: string) => {
    const updatedPlace = {
      ...place,
      departments: place.departments.map(dept =>
        dept.id === departmentId
          ? { ...dept, supervisors: dept.supervisors.filter(s => s.id !== supervisorId) }
          : dept
      )
    };
    onUpdate(updatedPlace);
  };

  const getContractStatusColor = (status: 'active' | 'expired' | 'pending') => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'expired':
        return 'bg-red-50 text-red-600 border-red-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-bold text-gray-700 text-xl">
            {place.name}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Manage praksis place details, contacts, contracts, and departments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-500">Address</div>
                <div className="text-sm font-medium text-gray-700">
                  {place.address}<br />
                  {place.postalCode} {place.city}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-500">Capacity</div>
                <div className="text-sm font-medium text-gray-700">
                  {place.currentStudents} / {place.totalCapacity} students
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="contracts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
            </TabsList>

            {/* Contracts Tab */}
            <TabsContent value="contracts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Contracts</h3>
                <Button
                  size="sm"
                  onClick={() => setShowAddContract(!showAddContract)}
                  className="h-8 gap-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  Add Contract
                </Button>
              </div>

              {showAddContract && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
                  <Input
                    placeholder="Contract Number *"
                    value={newContract.contractNumber}
                    onChange={(e) => setNewContract({ ...newContract, contractNumber: e.target.value })}
                    className="h-9"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Start Date *"
                      type="date"
                      value={newContract.startDate}
                      onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                      className="h-9"
                    />
                    <Input
                      placeholder="End Date *"
                      type="date"
                      value={newContract.endDate}
                      onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <Select 
                    value={newContract.status} 
                    onValueChange={(value) => setNewContract({ ...newContract, status: value as 'active' | 'expired' | 'pending' })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <textarea
                    placeholder="Terms and conditions"
                    value={newContract.terms}
                    onChange={(e) => setNewContract({ ...newContract, terms: e.target.value })}
                    className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-md resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddContract} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Add
                    </Button>
                    <Button onClick={() => setShowAddContract(false)} size="sm" variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {place.contracts.map((contract) => (
                  <div key={contract.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div className="font-medium text-gray-700">{contract.contractNumber}</div>
                        <Badge 
                          variant="outline" 
                          className={`${getContractStatusColor(contract.status)} text-xs`}
                        >
                          {contract.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        Valid from {new Date(contract.startDate).toLocaleDateString()} to {new Date(contract.endDate).toLocaleDateString()}
                      </div>
                      {contract.terms && (
                        <div className="text-xs text-gray-500 italic">{contract.terms}</div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveContract(contract.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {place.contracts.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-8">
                    No contracts added yet
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Departments</h3>
                <Button
                  size="sm"
                  onClick={() => setShowAddDepartment(!showAddDepartment)}
                  className="h-8 gap-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  Add Department
                </Button>
              </div>

              {showAddDepartment && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
                  <Input
                    placeholder="Department Name *"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    className="h-9"
                  />
                  <Input
                    placeholder="Description"
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                    className="h-9"
                  />
                  <Input
                    placeholder="Capacity"
                    type="number"
                    value={newDepartment.capacity}
                    onChange={(e) => setNewDepartment({ ...newDepartment, capacity: parseInt(e.target.value) || 0 })}
                    className="h-9"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddDepartment} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Add
                    </Button>
                    <Button onClick={() => setShowAddDepartment(false)} size="sm" variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {place.departments.map((department) => (
                  <div key={department.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-start justify-between p-3 bg-gray-50">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <div className="font-medium text-gray-700">{department.name}</div>
                          <Badge variant="outline" className="text-xs">
                            Capacity: {department.capacity}
                          </Badge>
                        </div>
                        {department.description && (
                          <div className="text-xs text-gray-500 ml-6">{department.description}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveDepartment(department.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Supervisors */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-gray-600">Supervisors</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAddSupervisor(showAddSupervisor === department.id ? null : department.id)}
                          className="h-6 text-xs gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <Plus className="h-3 w-3" />
                          Add Supervisor
                        </Button>
                      </div>

                      {showAddSupervisor === department.id && (
                        <div className="p-3 border border-gray-200 rounded-lg space-y-2 bg-white">
                          <Input
                            placeholder="Name *"
                            value={newSupervisor.name}
                            onChange={(e) => setNewSupervisor({ ...newSupervisor, name: e.target.value })}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Email *"
                            type="email"
                            value={newSupervisor.email}
                            onChange={(e) => setNewSupervisor({ ...newSupervisor, email: e.target.value })}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Phone"
                            value={newSupervisor.phone}
                            onChange={(e) => setNewSupervisor({ ...newSupervisor, phone: e.target.value })}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Specialization"
                            value={newSupervisor.specialization}
                            onChange={(e) => setNewSupervisor({ ...newSupervisor, specialization: e.target.value })}
                            className="h-8 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => handleAddSupervisor(department.id)} size="sm" className="h-7 bg-blue-600 hover:bg-blue-700">
                              Add
                            </Button>
                            <Button onClick={() => setShowAddSupervisor(null)} size="sm" variant="outline" className="h-7">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {department.supervisors.map((supervisor) => (
                        <div key={supervisor.id} className="flex items-start justify-between p-2 border border-gray-200 rounded bg-white text-xs">
                          <div className="flex-1">
                            <div className="font-medium text-gray-700">{supervisor.name}</div>
                            <div className="text-gray-500">{supervisor.specialization}</div>
                            <div className="flex gap-2 text-gray-600 mt-1">
                              <span>{supervisor.email}</span>
                              {supervisor.phone && <span>{supervisor.phone}</span>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveSupervisor(department.id, supervisor.id)}
                            className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {department.supervisors.length === 0 && showAddSupervisor !== department.id && (
                        <div className="text-center text-xs text-gray-400 py-2">
                          No supervisors assigned
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {place.departments.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-8">
                    No departments added yet
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}