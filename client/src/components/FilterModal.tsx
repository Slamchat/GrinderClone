import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Filters {
  ageMin: number;
  ageMax: number;
  maxDistance: number;
  onlineOnly: boolean;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function FilterModal({ open, onClose, filters, onFiltersChange }: FilterModalProps) {
  const [tempFilters, setTempFilters] = useState<Filters>(filters);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const handleAgeRangeChange = (values: number[]) => {
    setTempFilters(prev => ({
      ...prev,
      ageMin: values[0],
      ageMax: values[1],
    }));
  };

  const handleDistanceChange = (values: number[]) => {
    setTempFilters(prev => ({
      ...prev,
      maxDistance: values[0],
    }));
  };

  const handleOnlineOnlyChange = (checked: boolean) => {
    setTempFilters(prev => ({
      ...prev,
      onlineOnly: checked,
    }));
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      ageMin: 18,
      ageMax: 35,
      maxDistance: 10,
      onlineOnly: false,
    };
    setTempFilters(resetFilters);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-surface text-white border-gray-800 rounded-t-3xl">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-bold text-white">Filters</SheetTitle>
        </SheetHeader>

        <div className="space-y-8">
          {/* Age Range */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-white">Age Range</Label>
            <div className="px-2">
              <Slider
                value={[tempFilters.ageMin, tempFilters.ageMax]}
                onValueChange={handleAgeRangeChange}
                min={18}
                max={65}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>{tempFilters.ageMin}</span>
                <span>{tempFilters.ageMax}</span>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-white">Distance</Label>
            <div className="px-2">
              <Slider
                value={[tempFilters.maxDistance]}
                onValueChange={handleDistanceChange}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>1 mi</span>
                <span className="font-medium">{tempFilters.maxDistance} mi</span>
                <span>50+ mi</span>
              </div>
            </div>
          </div>

          {/* Looking For */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-white">Looking For</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Chat', 'Meet', 'Friends', 'Dating'].map((option) => (
                <Button
                  key={option}
                  variant={option === 'Chat' ? 'default' : 'outline'}
                  className={`py-3 ${
                    option === 'Chat'
                      ? 'bg-primary text-white'
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          {/* Online Status */}
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-white">Show Online Only</Label>
            <Switch
              checked={tempFilters.onlineOnly}
              onCheckedChange={handleOnlineOnlyChange}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-8 pt-6">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
