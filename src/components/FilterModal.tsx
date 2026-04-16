import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Filter, Search, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';

interface FilterModalProps {
  searchTerm: string;
  selectedYear: string;
  selectedSemester: string;
  selectedSubject: string;
  selectedStatus: string;
  showCompleted: boolean;
  onSearchChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSemesterChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onShowCompletedChange: (value: boolean) => void;
  onClearAll: () => void;
}

export function FilterModal({
  searchTerm,
  selectedYear,
  selectedSemester,
  selectedSubject,
  selectedStatus,
  showCompleted,
  onSearchChange,
  onYearChange,
  onSemesterChange,
  onSubjectChange,
  onStatusChange,
  onShowCompletedChange,
  onClearAll
}: FilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFiltersCount = [
    selectedYear !== 'all',
    selectedSemester !== 'all',
    selectedSubject !== 'all',
    selectedStatus !== 'all',
    searchTerm !== '',
    showCompleted
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
          <DialogTitle>Filter Placements</DialogTitle>
          <DialogDescription>Filter placements based on different criteria.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search placements..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Year</label>
            <Select value={selectedYear} onValueChange={onYearChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Semester */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Semester</label>
            <Select value={selectedSemester} onValueChange={onSemesterChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                <SelectItem value="Fall 2024">Fall 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Emne</label>
            <Select value={selectedSubject} onValueChange={onSubjectChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Fall">Fall</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upload">Upload students</SelectItem>
                <SelectItem value="select">Select praksis places</SelectItem>
                <SelectItem value="publish">First publish</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show Completed */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <Checkbox
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={(value) => onShowCompletedChange(value as boolean)}
              />
              <label 
                htmlFor="show-completed"
                className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
              >
                Show completed placements
              </label>
            </div>
            <p className="text-xs text-gray-500 pl-3">
              By default, only ongoing placements (end date ≥ today) are displayed
            </p>
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