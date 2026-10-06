import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from './ui/utils';
import { PlacePeriod, isValidMonthDay } from '../types/praksisLimit';

interface PlacePeriodDialogProps {
  placeName: string;
  period: PlacePeriod;
  onClose: () => void;
  onSave: (period: PlacePeriod) => void;
}

// The period every limit of a praksis place counts in
export function PlacePeriodDialog({ placeName, period, onClose, onSave }: PlacePeriodDialogProps) {
  const [limitType, setLimitType] = useState(period.limitType);
  const [periodStart, setPeriodStart] = useState(period.periodStart ?? '01/01');

  const error =
    limitType !== 'yearly'
      ? undefined
      : !isValidMonthDay(periodStart)
        ? 'Use MM/DD, e.g. 01/01'
        : periodStart === '02/29'
          ? 'Pick a day that exists every year'
          : undefined;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capacity period · {placeName}</DialogTitle>
          <DialogDescription>
            All capacity of this praksis place counts students in this period. Changing it applies to all of it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[auto_1fr] gap-6 py-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">Capacity type</label>
            <div className="inline-flex rounded-md border border-gray-200 p-0.5 bg-gray-50">
              {(['yearly', 'semester'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLimitType(type)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded transition-colors',
                    limitType === type ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {type === 'yearly' ? 'Yearly' : 'Semester'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">Reset date (MM/DD)</label>
            {limitType === 'semester' ? (
              <p className="text-sm text-gray-400 py-1">Not needed for semester</p>
            ) : (
              <>
                <Input
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  placeholder="01/01"
                  maxLength={5}
                  className={cn('w-20 text-center', error && 'border-red-500')}
                />
                {error ? (
                  <p className="text-xs text-red-600">{error}</p>
                ) : (
                  <p className="text-xs text-gray-500">Capacity starts over every year on this day</p>
                )}
              </>
            )}
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            disabled={!!error}
            onClick={() => {
              onSave(limitType === 'yearly' ? { limitType, periodStart } : { limitType });
              onClose();
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Save period
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
