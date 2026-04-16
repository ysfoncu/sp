import { useState, KeyboardEvent } from 'react';
import { Badge } from './ui/badge';
import { X, Plus } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function TagInput({ tags, onTagsChange, placeholder = "Add tag...", readOnly = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onTagsChange([...tags, trimmedValue]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsEditing(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-1 items-center" onClick={(e) => e.stopPropagation()}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5 flex items-center gap-1"
        >
          {tag}
          {!readOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag);
              }}
              className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      
      {!readOnly && (
        <>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!inputValue.trim()) {
                    setIsEditing(false);
                  }
                }}
                placeholder={placeholder}
                className="h-6 w-24 text-xs px-2"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddTag();
                  setIsEditing(false);
                }}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-blue-600 hover:bg-blue-50 rounded px-2 py-0.5 text-xs flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add tag
            </button>
          )}
        </>
      )}
    </div>
  );
}
