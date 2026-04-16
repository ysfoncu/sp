import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Filter, Search } from 'lucide-react';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

interface PraksisPlacesFilterModalProps {
  searchTerm: string;
  selectedCity: string;
  selectedContractStatus: string;
  selectedCapacity: string;
  selectedPlaceStatus: string;
  selectedContactStatus: string;
  displayMode: 'all' | 'departments' | 'members';
  cities: string[];
  onSearchChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onContractStatusChange: (value: string) => void;
  onCapacityChange: (value: string) => void;
  onPlaceStatusChange: (value: string) => void;
  onContactStatusChange: (value: string) => void;
  onDisplayModeChange: (value: 'all' | 'departments' | 'members') => void;
  onClearAll: () => void;
}

export function PraksisPlacesFilterModal({
  searchTerm,
  selectedCity,
  selectedContractStatus,
  selectedCapacity,
  selectedPlaceStatus,
  selectedContactStatus,
  displayMode,
  cities,
  onSearchChange,
  onCityChange,
  onContractStatusChange,
  onCapacityChange,
  onPlaceStatusChange,
  onContactStatusChange,
  onDisplayModeChange,
  onClearAll
}: PraksisPlacesFilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters (excluding displayMode)
  const activeFiltersCount = [
    selectedCity !== 'all',
    selectedContractStatus !== 'all',
    selectedCapacity !== 'all',
    selectedPlaceStatus !== 'all',
    selectedContactStatus !== 'all',
    searchTerm !== '',
  ].filter(Boolean).length;

  const handleClearAll = () => {
    onClearAll();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 gap-2 relative"
        >
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-1 px-1.5 min-w-[20px] h-5 flex items-center justify-center bg-blue-600"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Praksis Places</DialogTitle>
          <DialogDescription>Filter praksis places, departments, and members based on different criteria.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search places, departments, members..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Display Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Display</label>
            <RadioGroup value={displayMode} onValueChange={(value) => onDisplayModeChange(value as 'all' | 'departments' | 'members')}>
              <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="all" id="display-all" />
                <Label htmlFor="display-all" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                  Show all (places, departments & members)
                </Label>
              </div>
              <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="departments" id="display-departments" />
                <Label htmlFor="display-departments" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                  Show only departments
                </Label>
              </div>
              <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="members" id="display-members" />
                <Label htmlFor="display-members" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                  Show only members
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">City</label>
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contract Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Contract Status</label>
            <Select value={selectedContractStatus} onValueChange={onContractStatusChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select contract status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contract Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Place Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Place Status</label>
            <Select value={selectedPlaceStatus} onValueChange={onPlaceStatusChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select place status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Contact Status</label>
            <Select value={selectedContactStatus} onValueChange={onContactStatusChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select contact status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="sick">Sick</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Capacity</label>
            <Select value={selectedCapacity} onValueChange={onCapacityChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Capacities</SelectItem>
                <SelectItem value="high">High (&gt;= 30)</SelectItem>
                <SelectItem value="medium">Medium (15-29)</SelectItem>
                <SelectItem value="low">Low (&lt; 15)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="ghost"
            onClick={handleClearAll}
            className="text-gray-600"
          >
            Clear all
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}