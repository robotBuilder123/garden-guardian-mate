import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Square, Trash2, Copy } from "lucide-react";
import { Plant } from "./PlantCard";

export interface GardenBed {
  id: string;
  name: string;
  width: number; // in meters
  height: number; // in meters
  x: number; // position in grid
  y: number; // position in grid
  type: 'raised' | 'ground' | 'container';
}

interface GardenBedManagerProps {
  beds: GardenBed[];
  plants: Plant[];
  onAddBed: (bed: Omit<GardenBed, 'id'>) => void;
  onRemoveBed: (bedId: string) => void;
  onPlantDrop: (plantId: string, bedId: string, x: number, y: number) => void;
}

type BedType = 'raised' | 'ground' | 'container';

const bedPresets = [
  { name: "Small Raised Bed", width: 1, height: 2, type: 'raised' as BedType },
  { name: "Medium Raised Bed", width: 2, height: 3, type: 'raised' as BedType },
  { name: "Large Raised Bed", width: 3, height: 4, type: 'raised' as BedType },
  { name: "Container Pot", width: 0.5, height: 0.5, type: 'container' as BedType },
  { name: "Large Container", width: 1, height: 1, type: 'container' as BedType },
  { name: "Ground Plot", width: 2, height: 2, type: 'ground' as BedType },
];

export const GardenBedManager = ({ beds, plants, onAddBed, onRemoveBed, onPlantDrop }: GardenBedManagerProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    width: number;
    height: number;
    type: BedType;
    quantity: number;
    useBulkMode: boolean;
  }>({
    name: "",
    width: 2,
    height: 2,
    type: 'raised',
    quantity: 1,
    useBulkMode: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.width || !formData.height) return;

    const quantity = formData.useBulkMode ? formData.quantity : 1;
    
    // Find starting position for beds
    const existingPositions = beds.map(bed => ({ x: bed.x, y: bed.y }));
    let startX = 0, startY = 0;
    
    // Create multiple beds
    for (let i = 0; i < quantity; i++) {
      // Find next available position for each bed
      let x = startX, y = startY;
      while (existingPositions.some(pos => pos.x === x && pos.y === y)) {
        x++;
        if (x > 8) {
          x = 0;
          y++;
        }
      }
      
      // Add this position to existing positions to avoid overlap
      existingPositions.push({ x, y });
      
      // Create bed name with numbering if bulk mode
      const bedName = quantity > 1 ? `${formData.name} ${i + 1}` : formData.name;
      
      onAddBed({
        name: bedName,
        width: formData.width,
        height: formData.height,
        type: formData.type,
        x,
        y,
      });
      
      // Update starting position for next bed
      startX = x + 1;
      if (startX > 8) {
        startX = 0;
        startY = y + 1;
      }
    }

    setFormData({
      name: "",
      width: 2,
      height: 2,
      type: 'raised',
      quantity: 1,
      useBulkMode: false,
    });
    setOpen(false);
  };

  const getPlantsByBed = (bedId: string) => {
    return plants.filter(plant => plant.location === bedId);
  };

  const getBedUtilization = (bed: GardenBed) => {
    const plantsInBed = getPlantsByBed(bed.id);
    const usedSpace = plantsInBed.reduce((sum, plant) => sum + plant.spaceRequired, 0);
    const totalSpace = bed.width * bed.height;
    return { usedSpace, totalSpace, percentage: (usedSpace / totalSpace) * 100 };
  };

  const getBedTypeColor = (type: BedType) => {
    switch (type) {
      case 'raised': return 'bg-amber-100 border-amber-300';
      case 'ground': return 'bg-green-100 border-green-300';
      case 'container': return 'bg-blue-100 border-blue-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const applyPreset = (preset: typeof bedPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      width: preset.width,
      height: preset.height,
      type: preset.type,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Garden Beds</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Garden Bed
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Garden Bed</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {bedPresets.map((preset, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="text-xs"
                    >
                      {preset.name} ({preset.width}×{preset.height}m)
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedName">Bed Name</Label>
                <Input
                  id="bedName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Vegetable Bed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (m)</Label>
                  <Input
                    id="width"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={formData.width}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData(prev => ({ ...prev, width: 0.5 }));
                      } else {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 0.5) {
                          setFormData(prev => ({ ...prev, width: num }));
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const num = parseFloat(e.target.value);
                      if (isNaN(num) || num < 0.5) {
                        setFormData(prev => ({ ...prev, width: 0.5 }));
                      }
                    }}
                    placeholder="2.0"
                    className="text-lg p-3"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (m)</Label>
                  <Input
                    id="height"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={formData.height}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData(prev => ({ ...prev, height: 0.5 }));
                      } else {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 0.5) {
                          setFormData(prev => ({ ...prev, height: num }));
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const num = parseFloat(e.target.value);
                      if (isNaN(num) || num < 0.5) {
                        setFormData(prev => ({ ...prev, height: 0.5 }));
                      }
                    }}
                    placeholder="2.0"
                    className="text-lg p-3"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedType">Bed Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: BedType) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raised">Raised Bed</SelectItem>
                    <SelectItem value="ground">Ground Plot</SelectItem>
                    <SelectItem value="container">Container/Pot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Creation Option */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bulkMode"
                    checked={formData.useBulkMode}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, useBulkMode: checked as boolean }))
                    }
                  />
                  <Label htmlFor="bulkMode" className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Create multiple beds
                  </Label>
                </div>
                
                {formData.useBulkMode && (
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Number of beds to create</Label>
                    <Input
                      id="quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData(prev => ({ ...prev, quantity: 1 }));
                        } else {
                          const num = parseInt(value);
                          if (!isNaN(num) && num >= 1 && num <= 20) {
                            setFormData(prev => ({ ...prev, quantity: num }));
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const num = parseInt(e.target.value);
                        if (isNaN(num) || num < 1) {
                          setFormData(prev => ({ ...prev, quantity: 1 }));
                        } else if (num > 20) {
                          setFormData(prev => ({ ...prev, quantity: 20 }));
                        }
                      }}
                      placeholder="5"
                      className="text-lg p-3"
                    />
                    <p className="text-xs text-muted-foreground">
                      Beds will be named "{formData.name} 1", "{formData.name} 2", etc.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Bed
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beds.map((bed) => {
          const utilization = getBedUtilization(bed);
          const plantsInBed = getPlantsByBed(bed.id);
          
          return (
            <Card key={bed.id} className={`${getBedTypeColor(bed.type)} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{bed.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveBed(bed.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {bed.width}m × {bed.height}m ({(bed.width * bed.height).toFixed(1)} m²)
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Space Used:</span>
                    <span className={utilization.percentage > 100 ? "text-red-600 font-medium" : ""}>
                      {utilization.usedSpace.toFixed(1)} / {utilization.totalSpace.toFixed(1)} m²
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        utilization.percentage > 100 ? 'bg-red-500' : 
                        utilization.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilization.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {plantsInBed.length} plants
                  </div>
                  {plantsInBed.length > 0 && (
                    <div className="text-xs">
                      {plantsInBed.map(plant => plant.name).join(", ")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};