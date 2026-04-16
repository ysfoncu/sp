import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface FilterChipsProps {
  searchTerm: string;
  selectedYear: string;
  selectedSemester: string;
  selectedSubject: string;
  selectedStatus: string;
  onSearchChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSemesterChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function FilterChips({
  searchTerm,
  selectedYear,
  selectedSemester,
  selectedSubject,
  selectedStatus,
  onSearchChange,
  onYearChange,
  onSemesterChange,
  onSubjectChange,
  onStatusChange
}: FilterChipsProps) {
  const getStatusLabel = (value: string) => {
    switch (value) {
      case 'upload': return 'Upload students';
      case 'select': return 'Select praksis places';
      case 'publish': return 'First publish';
      case 'completed': return 'Completed';
      default: return value;
    }
  };

  return (
    <>
      {searchTerm && (
        <Badge 
          variant="secondary" 
          className="gap-1 pr-1 cursor-pointer hover:bg-gray-200"
          onClick={() => onSearchChange('')}
        >
          Search: {searchTerm}
          <X className="h-3 w-3" />
        </Badge>
      )}
      {selectedYear !== 'all' && (
        <Badge 
          variant="secondary" 
          className="gap-1 pr-1 cursor-pointer hover:bg-gray-200"
          onClick={() => onYearChange('all')}
        >
          Year: {selectedYear}
          <X className="h-3 w-3" />
        </Badge>
      )}
      {selectedSemester !== 'all' && (
        <Badge 
          variant="secondary" 
          className="gap-1 pr-1 cursor-pointer hover:bg-gray-200"
          onClick={() => onSemesterChange('all')}
        >
          Semester: {selectedSemester}
          <X className="h-3 w-3" />
        </Badge>
      )}
      {selectedSubject !== 'all' && (
        <Badge 
          variant="secondary" 
          className="gap-1 pr-1 cursor-pointer hover:bg-gray-200"
          onClick={() => onSubjectChange('all')}
        >
          Emne: {selectedSubject}
          <X className="h-3 w-3" />
        </Badge>
      )}
      {selectedStatus !== 'all' && (
        <Badge 
          variant="secondary" 
          className="gap-1 pr-1 cursor-pointer hover:bg-gray-200"
          onClick={() => onStatusChange('all')}
        >
          Status: {getStatusLabel(selectedStatus)}
          <X className="h-3 w-3" />
        </Badge>
      )}
    </>
  );
}
