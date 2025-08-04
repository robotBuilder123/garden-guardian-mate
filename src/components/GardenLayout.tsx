import { useState, useEffect } from "react";
import { Plant } from "./PlantCard";
import { GardenBedManager, GardenBed } from "./GardenBedManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Move, Settings, Square, Trash2, Copy, Plus } from "lucide-react";

interface GardenLayoutProps {
  plants: Plant[];
  onUpdatePlant?: (plantId: string, updates: Partial<Plant>) => void;
  onDuplicatePlant?: (plant: Plant, newName: string) => void;
  onHarvest?: (plantId: string, amount: number) => void;
}

interface PlantPosition {
  plantId: string;
  bedId: string;
  x: number;
  y: number;
}

export const GardenLayout = ({ plants, onUpdatePlant, onDuplicatePlant, onHarvest }: GardenLayoutProps) => {
  // Get current season from localStorage for proper data separation
  const getCurrentSeason = () => {
    try {
      return localStorage.getItem('current-season') || '2024 Season';
    } catch {
      return '2024 Season';
    }
  };
  
  // Load garden data from localStorage with season-specific keys
  const loadGardenDataFromStorage = () => {
    const currentSeason = getCurrentSeason();
    try {
      const savedBeds = localStorage.getItem('garden-beds');
      const savedPositions = localStorage.getItem(`garden-plant-positions-${currentSeason}`);
      const savedSettings = localStorage.getItem('garden-settings');
      
      let beds: GardenBed[] = [];
      let positions: PlantPosition[] = [];
      let settings = { width: 10, height: 8, showBoundaries: true };
      
      if (savedBeds) {
        beds = JSON.parse(savedBeds) as GardenBed[];
      } else {
        // Default beds if nothing in storage
        beds = [
          {
            id: "bed-1",
            name: "Main Vegetable Bed",
            width: 3,
            height: 2,
            x: 1,
            y: 1,
            type: 'raised' as const
          },
          {
            id: "bed-2", 
            name: "Herb Garden",
            width: 1,
            height: 1,
            x: 5,
            y: 1,
            type: 'container' as const
          }
        ];
      }
      
      if (savedPositions) {
        positions = JSON.parse(savedPositions);
      }
      
      if (savedSettings) {
        settings = JSON.parse(savedSettings);
      }
      
      return { beds, positions, settings };
    } catch (error) {
      console.error('Error loading garden data from storage:', error);
      return {
        beds: [
          {
            id: "bed-1",
            name: "Main Vegetable Bed",
            width: 3,
            height: 2,
            x: 1,
            y: 1,
            type: 'raised' as const
          },
          {
            id: "bed-2", 
            name: "Herb Garden",
            width: 1,
            height: 1,
            x: 5,
            y: 1,
            type: 'container' as const
          }
        ] as GardenBed[],
        positions: [] as PlantPosition[],
        settings: { width: 10, height: 8, showBoundaries: true }
      };
    }
  };

  const { beds: initialBeds, positions: initialPositions, settings: initialSettings } = loadGardenDataFromStorage();
  
  const [beds, setBeds] = useState<GardenBed[]>(initialBeds);
  const [plantPositions, setPlantPositions] = useState<PlantPosition[]>(initialPositions);
  // Selection state for click-to-place
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<'bed' | 'plant' | null>(null);
  
  // Garden boundary settings
  const [gardenWidth, setGardenWidth] = useState(initialSettings.width);
  const [gardenHeight, setGardenHeight] = useState(initialSettings.height);
  const [showBoundaries, setShowBoundaries] = useState(initialSettings.showBoundaries);
  
  // Editing state
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [editingBedName, setEditingBedName] = useState("");
  const [editingPlantName, setEditingPlantName] = useState("");
  
  // Duplication state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [plantToDuplicate, setPlantToDuplicate] = useState<Plant | null>(null);
  const [duplicateName, setDuplicateName] = useState("");

  // Drag state for removing plants
  const [draggedPlantId, setDraggedPlantId] = useState<string | null>(null);
  const [isDraggingOut, setIsDraggingOut] = useState(false);

  // Save garden data to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('garden-beds', JSON.stringify(beds));
    } catch (error) {
      console.error('Error saving beds to storage:', error);
    }
  }, [beds]);

  useEffect(() => {
    const currentSeason = getCurrentSeason();
    try {
      localStorage.setItem(`garden-plant-positions-${currentSeason}`, JSON.stringify(plantPositions));
    } catch (error) {
      console.error('Error saving plant positions to storage:', error);
    }
  }, [plantPositions]);

  useEffect(() => {
    try {
      const settings = { width: gardenWidth, height: gardenHeight, showBoundaries };
      localStorage.setItem('garden-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving garden settings to storage:', error);
    }
  }, [gardenWidth, gardenHeight, showBoundaries]);

  const addBed = (newBed: Omit<GardenBed, 'id'>) => {
    const bed: GardenBed = {
      ...newBed,
      id: `bed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: -1, // Unplaced beds start at -1, -1
      y: -1,
    };
    setBeds(prev => [...prev, bed]);
  };

  const removeBed = (bedId: string) => {
    setBeds(prev => prev.filter(bed => bed.id !== bedId));
    // Remove plants from deleted bed
    setPlantPositions(prev => prev.filter(pos => pos.bedId !== bedId));
  };

  const handlePlantDrop = (plantId: string, bedId: string, x: number, y: number) => {
    setPlantPositions(prev => {
      const filtered = prev.filter(pos => pos.plantId !== plantId);
      return [...filtered, { plantId, bedId, x, y }];
    });
  };

  const handleBedDrag = (bedId: string, newX: number, newY: number) => {
    setBeds(prev => prev.map(bed => 
      bed.id === bedId 
        ? { ...bed, x: Math.max(0, newX), y: Math.max(0, newY) }
        : bed
    ));
  };

  const startEditingBed = (bedId: string, currentName: string) => {
    setEditingBedId(bedId);
    setEditingBedName(currentName);
  };

  const saveBedName = () => {
    if (editingBedId && editingBedName.trim()) {
      setBeds(prev => prev.map(bed => 
        bed.id === editingBedId 
          ? { ...bed, name: editingBedName.trim() }
          : bed
      ));
    }
    setEditingBedId(null);
    setEditingBedName("");
  };

  const startEditingPlant = (plantId: string, currentName: string) => {
    setEditingPlantId(plantId);
    setEditingPlantName(currentName);
  };

  const savePlantName = () => {
    if (editingPlantId && editingPlantName.trim() && onUpdatePlant) {
      onUpdatePlant(editingPlantId, { name: editingPlantName.trim() });
    }
    setEditingPlantId(null);
    setEditingPlantName("");
  };

  const unplacedPlants = plants.filter(plant => 
    !plantPositions.some(pos => pos.plantId === plant.id)
  );

  const unplacedBeds = beds.filter(bed => bed.x === -1 && bed.y === -1);
  const placedBeds = beds.filter(bed => bed.x !== -1 && bed.y !== -1);

  // Click handlers for selection and placement
  const handlePlantSelect = (plantId: string) => {
    if (editingPlantId === plantId) return; // Don't select if editing
    
    setSelectedPlant(selectedPlant === plantId ? null : plantId);
    setSelectedBed(null);
    setPlacementMode(selectedPlant === plantId ? null : 'plant');
  };

  const handleBedSelect = (bedId: string) => {
    if (editingBedId === bedId) return; // Don't select if editing
    
    setSelectedBed(selectedBed === bedId ? null : bedId);
    setSelectedPlant(null);
    setPlacementMode(selectedBed === bedId ? null : 'bed');
  };

  const handleGardenClick = (e: React.MouseEvent) => {
    if (!selectedBed || placementMode !== 'bed') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - 40) / 60;
    const rawY = (e.clientY - rect.top - 80) / 60;
    const newX = Math.max(0, Math.round(rawX));
    const newY = Math.max(0, Math.round(rawY));
    
    const bed = beds.find(b => b.id === selectedBed);
    if (bed) {
      const maxX = Math.max(0, gardenWidth - bed.width);
      const maxY = Math.max(0, gardenHeight - bed.height);
      const clampedX = Math.min(newX, maxX);
      const clampedY = Math.min(newY, maxY);
      handleBedDrag(selectedBed, clampedX, clampedY);
    }
    
    // Clear selection after placement
    setSelectedBed(null);
    setPlacementMode(null);
  };

  const handleBedClick = (bedId: string, e: React.MouseEvent) => {
    if (!selectedPlant || placementMode !== 'plant') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    handlePlantDrop(selectedPlant, bedId, x, y);
    
    // Clear selection after placement
    setSelectedPlant(null);
    setPlacementMode(null);
  };

  const clearSelection = () => {
    setSelectedPlant(null);
    setSelectedBed(null);
    setPlacementMode(null);
  };

  const handleDuplicatePlant = (plant: Plant) => {
    setPlantToDuplicate(plant);
    setDuplicateName(`${plant.name} Copy`);
    setDuplicateDialogOpen(true);
  };

  const submitDuplication = () => {
    if (plantToDuplicate && duplicateName.trim() && onDuplicatePlant) {
      onDuplicatePlant(plantToDuplicate, duplicateName.trim());
      setDuplicateDialogOpen(false);
      setPlantToDuplicate(null);
      setDuplicateName("");
    }
  };

  // Drag-to-remove handlers
  const handlePlantDragStart = (e: React.DragEvent, plantId: string) => {
    console.log('Drag start for plant:', plantId);
    setDraggedPlantId(plantId);
    e.dataTransfer.setData('application/json', JSON.stringify({ plantId, action: 'remove' }));
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation(); // Prevent garden click handler
  };

  const handlePlantDragEnd = () => {
    console.log('Drag end');
    setDraggedPlantId(null);
    setIsDraggingOut(false);
  };

  const handleRemoveZoneDragOver = (e: React.DragEvent) => {
    console.log('Drag over remove zone');
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOut(true);
  };

  const handleRemoveZoneDragLeave = () => {
    console.log('Drag leave remove zone');
    setIsDraggingOut(false);
  };

  const handleRemoveZoneDrop = (e: React.DragEvent) => {
    console.log('Drop on remove zone');
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      console.log('Drop data:', data);
      if (data.action === 'remove' && data.plantId) {
        console.log('Removing plant:', data.plantId);
        // Remove plant from its current position
        setPlantPositions(prev => prev.filter(pos => pos.plantId !== data.plantId));
        setIsDraggingOut(false);
        setDraggedPlantId(null);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  const getBedTypeIcon = (type: string) => {
    switch (type) {
      case 'raised': return '🌱';
      case 'ground': return '🌍';
      case 'container': return '🪴';
      default: return '🌿';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="beds" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="beds">Manage Beds</TabsTrigger>
          <TabsTrigger value="unplaced">Unplaced Beds</TabsTrigger>
          <TabsTrigger value="layout">Garden Layout</TabsTrigger>
        </TabsList>
        
        <TabsContent value="beds">
          <GardenBedManager
            beds={beds}
            plants={plants}
            onAddBed={addBed}
            onRemoveBed={removeBed}
            onPlantDrop={handlePlantDrop}
          />
        </TabsContent>

        <TabsContent value="unplaced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Unplaced Garden Beds
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unplacedBeds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No unplaced beds. Create new beds in the "Manage Beds" tab.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unplacedBeds.map(bed => (
                    <div
                       key={bed.id}
                       className={`relative cursor-pointer p-4 rounded-lg border-2 hover:opacity-80 transition-opacity ${
                         bed.type === 'raised' ? 'bg-amber-50 border-amber-400' :
                         bed.type === 'ground' ? 'bg-green-50 border-green-400' :
                         'bg-blue-50 border-blue-400'
                       } ${selectedBed === bed.id ? 'ring-2 ring-primary scale-105' : ''}`}
                       onClick={() => handleBedSelect(bed.id)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeBed(bed.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getBedTypeIcon(bed.type)}</span>
                          {editingBedId === bed.id ? (
                            <Input
                              value={editingBedName}
                              onChange={(e) => setEditingBedName(e.target.value)}
                              onBlur={saveBedName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveBedName();
                                if (e.key === 'Escape') {
                                  setEditingBedId(null);
                                  setEditingBedName("");
                                }
                              }}
                              className="h-6 text-sm flex-1"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="font-medium cursor-pointer hover:underline flex-1"
                              onClick={() => startEditingBed(bed.id, bed.name)}
                            >
                              {bed.name}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {bed.type} bed
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Dimensions: {bed.width}m × {bed.height}m</div>
                        <div>Area: {(bed.width * bed.height).toFixed(1)}m²</div>
                      </div>
                      
                       <div className="mt-3 text-xs text-muted-foreground">
                         Click to select, then click in garden to place
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="layout" className="space-y-6">
          {/* Garden Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Garden Boundaries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="garden-width">Garden Width (meters)</Label>
                  <Input
                    id="garden-width"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={gardenWidth}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty input for easier editing
                      if (value === '') {
                        setGardenWidth(1);
                      } else {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 1 && num <= 50) {
                          setGardenWidth(num);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure we have a valid value on blur
                      const num = parseFloat(e.target.value);
                      if (isNaN(num) || num < 1) {
                        setGardenWidth(1);
                      } else if (num > 50) {
                        setGardenWidth(50);
                      }
                    }}
                    placeholder="10"
                    className="text-lg p-3"
                  />
                </div>
                <div>
                  <Label htmlFor="garden-height">Garden Height (meters)</Label>
                  <Input
                    id="garden-height"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={gardenHeight}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty input for easier editing
                      if (value === '') {
                        setGardenHeight(1);
                      } else {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 1 && num <= 50) {
                          setGardenHeight(num);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure we have a valid value on blur
                      const num = parseFloat(e.target.value);
                      if (isNaN(num) || num < 1) {
                        setGardenHeight(1);
                      } else if (num > 50) {
                        setGardenHeight(50);
                      }
                    }}
                    placeholder="8"
                    className="text-lg p-3"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBoundaries(!showBoundaries)}
                >
                  {showBoundaries ? 'Hide' : 'Show'} Boundaries
                </Button>
                <span className="text-sm text-muted-foreground">
                  Garden area: {gardenWidth}m × {gardenHeight}m = {gardenWidth * gardenHeight}m²
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Unplaced Plants */}
          {unplacedPlants.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Unplaced Plants
                </h4>
                <div className="flex flex-wrap gap-2">
                  {unplacedPlants.map(plant => (
                    <div key={plant.id} className="relative group">
                      <Badge
                        variant={selectedPlant === plant.id ? "default" : "outline"}
                        className={`cursor-pointer p-4 min-h-12 min-w-20 flex items-center gap-1 select-none text-sm font-medium border-2 transition-all duration-200 touch-manipulation ${
                          selectedPlant === plant.id 
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-2 ring-primary/30' 
                            : 'hover:bg-primary/10 hover:border-primary/50 hover:shadow-md'
                        }`}
                        onClick={() => handlePlantSelect(plant.id)}
                      >
                        {editingPlantId === plant.id ? (
                          <Input
                            value={editingPlantName}
                            onChange={(e) => setEditingPlantName(e.target.value)}
                            onBlur={savePlantName}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePlantName();
                              if (e.key === 'Escape') {
                                setEditingPlantId(null);
                                setEditingPlantName("");
                              }
                            }}
                            className="h-5 text-xs border-0 p-0 bg-transparent focus:bg-white focus:border focus:px-1 min-w-20"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingPlant(plant.id, plant.name);
                            }}
                          >
                            {plant.name}
                          </span>
                        )}
                        <span className="text-xs opacity-70">({plant.spaceRequired}m²)</span>
                      </Badge>
                      
                      {/* Duplicate button - appears on hover */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm hover:bg-primary hover:text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePlant(plant);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Status message */}
                {placementMode === 'plant' && selectedPlant && (
                  <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded text-sm text-primary">
                    Selected plant: <strong>{unplacedPlants.find(p => p.id === selectedPlant)?.name}</strong>
                    <br />Click on a garden bed to place it there.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Drag-to-Remove Zone */}
          {draggedPlantId && (
            <div
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
                isDraggingOut 
                  ? 'bg-red-100 border-red-400 text-red-700 scale-110' 
                  : 'bg-gray-100 border-gray-400 text-gray-600'
              }`}
              onDragOver={handleRemoveZoneDragOver}
              onDragLeave={handleRemoveZoneDragLeave}
              onDrop={handleRemoveZoneDrop}
            >
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                <span className="font-medium">
                  {isDraggingOut ? 'Release to remove plant' : 'Drag plant here to remove'}
                </span>
              </div>
            </div>
          )}

          {/* Plant Duplication Dialog */}
          <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Duplicate Plant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create a copy of <strong>{plantToDuplicate?.name}</strong>
                  </p>
                  <Label htmlFor="duplicate-name">New Plant Name/ID</Label>
                  <Input
                    id="duplicate-name"
                    value={duplicateName}
                    onChange={(e) => setDuplicateName(e.target.value)}
                    placeholder="e.g., Tomato Plant #2"
                    className="mt-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitDuplication();
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDuplicateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitDuplication}
                    disabled={!duplicateName.trim()}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Plant
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Unplaced Garden Beds */}
          {unplacedBeds.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Unplaced Garden Beds
                   <span className="text-xs text-muted-foreground ml-2">
                     (Click to select, then click in garden to place)
                   </span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {unplacedBeds.map(bed => (
                    <div
                      key={bed.id}
                      className={`relative cursor-pointer p-6 min-h-20 min-w-32 rounded-lg border-3 hover:shadow-xl transition-all duration-200 select-none touch-manipulation ${
                        bed.type === 'raised' ? 'bg-amber-100 border-amber-400 hover:bg-amber-150 hover:border-amber-500' :
                        bed.type === 'ground' ? 'bg-green-100 border-green-400 hover:bg-green-150 hover:border-green-500' :
                        'bg-blue-100 border-blue-400 hover:bg-blue-150 hover:border-blue-500'
                      } ${
                        selectedBed === bed.id 
                          ? 'shadow-2xl ring-4 ring-primary scale-105' 
                          : 'hover:scale-110'
                      }`}
                      onClick={() => handleBedSelect(bed.id)}
                    >
                      <div className="text-xs font-medium mb-1 flex items-center gap-1">
                        {getBedTypeIcon(bed.type)}
                        {editingBedId === bed.id ? (
                          <Input
                            value={editingBedName}
                            onChange={(e) => setEditingBedName(e.target.value)}
                            onBlur={saveBedName}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveBedName();
                              if (e.key === 'Escape') {
                                setEditingBedId(null);
                                setEditingBedName("");
                              }
                            }}
                            className="h-4 text-xs border-0 p-0 bg-transparent focus:bg-white focus:border focus:px-1"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="cursor-pointer hover:underline"
                            onClick={() => startEditingBed(bed.id, bed.name)}
                          >
                            {bed.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {bed.width}m × {bed.height}m ({(bed.width * bed.height).toFixed(1)}m²)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

           {/* Garden Grid */}
          <div 
            className={`relative bg-green-50 rounded-lg p-6 min-h-96 border-2 transition-all duration-200 touch-manipulation ${
              placementMode === 'bed' ? 'border-green-400 bg-green-100 border-dashed shadow-inner cursor-crosshair' : 'border-green-200'
            } ${placementMode === 'plant' ? 'bg-blue-50 border-blue-300 cursor-crosshair' : ''}`}
            data-garden-container
            onClick={handleGardenClick}
          >
            {/* Snap-to-grid overlay when in placement mode */}
            {placementMode === 'bed' && (
              <div
                className="absolute pointer-events-none z-10"
                style={{
                  left: '40px',
                  top: '80px',
                  width: `${gardenWidth * 60}px`,
                  height: `${gardenHeight * 60}px`,
                }}
              >
                {/* Grid dots for visual snapping feedback */}
                {Array.from({ length: gardenWidth + 1 }).map((_, x) =>
                  Array.from({ length: gardenHeight + 1 }).map((_, y) => (
                    <div
                      key={`${x}-${y}`}
                      className="absolute w-2 h-2 bg-green-500 rounded-full opacity-60 animate-pulse"
                      style={{
                        left: `${x * 60 - 4}px`,
                        top: `${y * 60 - 4}px`,
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* Garden Boundaries with Grid */}
            {showBoundaries && (
              <div
                className="absolute border-4 border-dashed border-green-600 bg-green-100/20 rounded-lg overflow-hidden"
                style={{
                  left: '40px',
                  top: '80px',
                  width: `${gardenWidth * 60}px`,
                  height: `${gardenHeight * 60}px`,
                  minWidth: '120px',
                  minHeight: '120px'
                }}
              >
                {/* Grid overlay inside garden boundaries */}
                <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,_#22c55e_1px,_transparent_1px),_linear-gradient(to_bottom,_#22c55e_1px,_transparent_1px)] bg-[length:60px_60px]" />
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_1px_1px,_#22c55e_1px,_transparent_0)] bg-[length:20px_20px]" />
                
                <div className="absolute -top-6 left-0 text-xs font-medium text-green-700">
                  Garden Area: {gardenWidth}m × {gardenHeight}m
                </div>
              </div>
            )}
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Garden Layout
                </h4>
                {placementMode === 'bed' && (
                  <div className="text-sm text-green-600 font-semibold animate-pulse bg-green-100 px-3 py-2 rounded-lg border border-green-300">
                    🎯 Click anywhere in the garden area to place bed
                  </div>
                )}
                {placementMode === 'plant' && (
                  <div className="text-sm text-blue-600 font-semibold animate-pulse bg-blue-100 px-3 py-2 rounded-lg border border-blue-300">
                    🌱 Click on any garden bed to place plant
                  </div>
                )}
                {(placementMode || selectedPlant || selectedBed) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="ml-2"
                  >
                    Cancel
                  </Button>
                )}
              </div>
              
              {placedBeds.map(bed => {
                const bedPlants = plantPositions
                  .filter(pos => pos.bedId === bed.id)
                  .map(pos => ({ 
                    ...pos, 
                    plant: plants.find(p => p.id === pos.plantId)! 
                  }))
                  .filter(item => item.plant);

                const totalUsedSpace = bedPlants.reduce((sum, item) => sum + item.plant.spaceRequired, 0);
                const totalSpace = bed.width * bed.height;
                const isOvercrowded = totalUsedSpace > totalSpace;

                return (
                  <div
                    key={bed.id}
                    className={`absolute border-3 rounded-lg p-4 select-none touch-manipulation hover:shadow-xl transition-all duration-200 ${
                      bed.type === 'raised' ? 'bg-amber-100 border-amber-400 hover:bg-amber-150' :
                      bed.type === 'ground' ? 'bg-green-100 border-green-400 hover:bg-green-150' :
                      'bg-blue-100 border-blue-400 hover:bg-blue-150'
                    } ${isOvercrowded ? 'ring-4 ring-red-400 animate-pulse' : ''} ${
                      selectedBed === bed.id ? 'shadow-2xl ring-4 ring-primary scale-105' : ''
                    } ${placementMode === 'plant' ? 'ring-2 ring-blue-300 border-blue-400 cursor-crosshair' : 'cursor-pointer'}`}
                    style={{
                      left: `${bed.x * 60}px`,
                      top: `${bed.y * 60 + 40}px`,
                      width: `${bed.width * 60}px`,
                      height: `${bed.height * 60}px`,
                      minWidth: '80px',
                      minHeight: '60px'
                    }}
                    data-bed-id={bed.id}
                    onClick={(e) => {
                      if (placementMode === 'plant') {
                        handleBedClick(bed.id, e);
                      } else {
                        handleBedSelect(bed.id);
                      }
                    }}
                  >
                    <div className="text-xs font-medium mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {getBedTypeIcon(bed.type)}
                        {editingBedId === bed.id ? (
                          <Input
                            value={editingBedName}
                            onChange={(e) => setEditingBedName(e.target.value)}
                            onBlur={saveBedName}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveBedName();
                              if (e.key === 'Escape') {
                                setEditingBedId(null);
                                setEditingBedName("");
                              }
                            }}
                            className="h-4 text-xs border-0 p-0 bg-transparent focus:bg-white focus:border focus:px-1"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="cursor-pointer hover:underline"
                            onClick={() => startEditingBed(bed.id, bed.name)}
                          >
                            {bed.name}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-60 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBed(bed.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {totalUsedSpace.toFixed(1)}/{totalSpace.toFixed(1)}m²
                    </div>
                    
                       {bedPlants.map(({ plant, x, y }) => (
                         <div
                           key={plant.id}
                            className={`absolute text-white text-xs p-1 min-h-6 min-w-8 rounded shadow-md cursor-move select-none border border-white hover:shadow-lg transition-all duration-200 touch-manipulation ${
                              selectedPlant === plant.id 
                                ? 'bg-primary ring-2 ring-primary/50 scale-110' 
                                : 'bg-green-600 hover:bg-green-700'
                            } ${draggedPlantId === plant.id ? 'opacity-50 scale-90' : ''}`}
                            style={{
                              left: `${x * 100}%`,
                              top: `${y * 100}%`,
                              transform: 'translate(-50%, -50%)',
                              textAlign: 'center',
                              fontSize: '12px',
                              lineHeight: '1.2'
                            }}
                            draggable={editingPlantId !== plant.id} // Only draggable when not editing
                            onDragStart={(e) => {
                              console.log('Plant drag start event triggered');
                              handlePlantDragStart(e, plant.id);
                            }}
                            onDragEnd={(e) => {
                              console.log('Plant drag end event triggered');
                              handlePlantDragEnd();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!draggedPlantId) { // Only handle click if not dragging
                                if (onHarvest) {
                                  const amount = prompt("Enter harvest amount (kg):");
                                  if (amount && !isNaN(Number(amount))) {
                                    onHarvest(plant.id, Number(amount));
                                  }
                                } else {
                                  handlePlantSelect(plant.id);
                                }
                              }
                            }}
                            onDoubleClick={() => startEditingPlant(plant.id, plant.name)}
                       >
                         {editingPlantId === plant.id ? (
                           <Input
                             value={editingPlantName}
                             onChange={(e) => setEditingPlantName(e.target.value)}
                             onBlur={savePlantName}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') savePlantName();
                               if (e.key === 'Escape') {
                                 setEditingPlantId(null);
                                 setEditingPlantName("");
                               }
                             }}
                             className="h-4 text-xs border-0 p-0 bg-transparent focus:bg-white focus:border focus:px-1 text-black"
                             autoFocus
                           />
                          ) : (
                            <>
                              <div>{plant.name}</div>
                              <div className="text-xs opacity-75 mt-1">Drag to remove</div>
                            </>
                          )}
                       </div>
                     ))}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
