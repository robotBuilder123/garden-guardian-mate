import { useState, useEffect } from "react";
import { Plant } from "./PlantCard";
import { GardenBedManager, GardenBed } from "./GardenBedManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Move, Settings, Square, Trash2 } from "lucide-react";

interface GardenLayoutProps {
  plants: Plant[];
  onUpdatePlant?: (plantId: string, updates: Partial<Plant>) => void;
}

interface PlantPosition {
  plantId: string;
  bedId: string;
  x: number;
  y: number;
}

export const GardenLayout = ({ plants, onUpdatePlant }: GardenLayoutProps) => {
  // Load garden data from localStorage
  const loadGardenDataFromStorage = () => {
    try {
      const savedBeds = localStorage.getItem('garden-beds');
      const savedPositions = localStorage.getItem('garden-plant-positions');
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
  const [draggedPlant, setDraggedPlant] = useState<string | null>(null);
  const [draggedBed, setDraggedBed] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Garden boundary settings
  const [gardenWidth, setGardenWidth] = useState(initialSettings.width);
  const [gardenHeight, setGardenHeight] = useState(initialSettings.height);
  const [showBoundaries, setShowBoundaries] = useState(initialSettings.showBoundaries);
  
  // Editing state
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [editingBedName, setEditingBedName] = useState("");
  const [editingPlantName, setEditingPlantName] = useState("");
  
  // Touch support state
  const [touchData, setTouchData] = useState<{
    isDragging: boolean;
    dragType: 'bed' | 'plant' | null;
    dragId: string | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({
    isDragging: false,
    dragType: null,
    dragId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  // Save garden data to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('garden-beds', JSON.stringify(beds));
    } catch (error) {
      console.error('Error saving beds to storage:', error);
    }
  }, [beds]);

  useEffect(() => {
    try {
      localStorage.setItem('garden-plant-positions', JSON.stringify(plantPositions));
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

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent, type: 'bed' | 'plant', id: string) => {
    e.preventDefault();
    const touch = e.touches[0];
    setTouchData({
      isDragging: true,
      dragType: type,
      dragId: id,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });
    
    if (type === 'bed') {
      setDraggedBed(id);
    } else {
      setDraggedPlant(id);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchData.isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    setTouchData(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchData.isDragging) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (touchData.dragType === 'bed' && touchData.dragId) {
      // Find the garden container
      const gardenContainer = elementBelow?.closest('[data-garden-container]');
      if (gardenContainer) {
        const rect = gardenContainer.getBoundingClientRect();
        const rawX = (touch.clientX - rect.left - 40) / 60;
        const rawY = (touch.clientY - rect.top - 80) / 60;
        const newX = Math.max(0, Math.round(rawX));
        const newY = Math.max(0, Math.round(rawY));
        
        const bed = beds.find(b => b.id === touchData.dragId);
        if (bed) {
          const maxX = Math.max(0, gardenWidth - bed.width);
          const maxY = Math.max(0, gardenHeight - bed.height);
          const clampedX = Math.min(newX, maxX);
          const clampedY = Math.min(newY, maxY);
          handleBedDrag(touchData.dragId, clampedX, clampedY);
        }
      }
      setDraggedBed(null);
    } else if (touchData.dragType === 'plant' && touchData.dragId) {
      // Find the bed element
      const bedElement = elementBelow?.closest('[data-bed-id]');
      if (bedElement) {
        const bedId = bedElement.getAttribute('data-bed-id');
        const rect = bedElement.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / rect.width;
        const y = (touch.clientY - rect.top) / rect.height;
        
        if (bedId) {
          handlePlantDrop(touchData.dragId, bedId, x, y);
        }
      }
      setDraggedPlant(null);
    }
    
    setTouchData({
      isDragging: false,
      dragType: null,
      dragId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
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
                      className={`relative cursor-move p-4 rounded-lg border-2 hover:opacity-80 transition-opacity ${
                        bed.type === 'raised' ? 'bg-amber-50 border-amber-400' :
                        bed.type === 'ground' ? 'bg-green-50 border-green-400' :
                        'bg-blue-50 border-blue-400'
                      } ${draggedBed === bed.id ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedBed(bed.id);
                        setDragOffset({ x: 0, y: 0 });
                        e.dataTransfer.setData('text/plain', `bed-${bed.id}`);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        setDraggedBed(null);
                      }}
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
                        Drag to garden layout to place
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
                    type="number"
                    value={gardenWidth}
                    onChange={(e) => setGardenWidth(Number(e.target.value) || 1)}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <Label htmlFor="garden-height">Garden Height (meters)</Label>
                  <Input
                    id="garden-height"
                    type="number"
                    value={gardenHeight}
                    onChange={(e) => setGardenHeight(Number(e.target.value) || 1)}
                    min="1"
                    max="50"
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
                    <Badge
                      key={plant.id}
                      variant="outline"
                      className="cursor-move p-4 min-h-12 min-w-20 hover:bg-primary/10 flex items-center gap-1 select-none text-sm font-medium border-2 hover:border-primary/50 hover:shadow-md transition-all duration-200 touch-manipulation"
                      draggable
                      onDragStart={(e) => {
                        console.log('Starting plant drag:', plant.id);
                        setDraggedPlant(plant.id);
                        e.dataTransfer.setData('text/plain', plant.id);
                        e.dataTransfer.setData('application/plant-id', plant.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        console.log('Plant drag ended');
                        setDraggedPlant(null);
                      }}
                      onTouchStart={(e) => handleTouchStart(e, 'plant', plant.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
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
                          onClick={() => startEditingPlant(plant.id, plant.name)}
                        >
                          {plant.name}
                        </span>
                      )}
                      <span className="text-xs opacity-70">({plant.spaceRequired}m²)</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unplaced Garden Beds */}
          {unplacedBeds.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Unplaced Garden Beds
                  <span className="text-xs text-muted-foreground ml-2">
                    (Drag beds to place them in your garden)
                  </span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {unplacedBeds.map(bed => (
                    <div
                      key={bed.id}
                      className={`relative cursor-grab active:cursor-grabbing p-6 min-h-20 min-w-32 rounded-lg border-3 hover:shadow-xl transition-all duration-200 select-none touch-manipulation ${
                        bed.type === 'raised' ? 'bg-amber-100 border-amber-400 hover:bg-amber-150 hover:border-amber-500' :
                        bed.type === 'ground' ? 'bg-green-100 border-green-400 hover:bg-green-150 hover:border-green-500' :
                        'bg-blue-100 border-blue-400 hover:bg-blue-150 hover:border-blue-500'
                      } ${draggedBed === bed.id ? 'opacity-60 scale-95 shadow-2xl ring-4 ring-primary/30' : 'hover:scale-110'}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedBed(bed.id);
                        setDragOffset({ x: 0, y: 0 });
                        e.dataTransfer.setData('text/plain', `bed-${bed.id}`);
                        e.dataTransfer.effectAllowed = 'move';
                        
                        // Create drag image with better styling
                        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                        dragImage.style.transform = 'rotate(5deg)';
                        dragImage.style.opacity = '0.8';
                        document.body.appendChild(dragImage);
                        e.dataTransfer.setDragImage(dragImage, 50, 25);
                        setTimeout(() => document.body.removeChild(dragImage), 0);
                      }}
                      onDragEnd={() => {
                        setDraggedBed(null);
                      }}
                      onTouchStart={(e) => handleTouchStart(e, 'bed', bed.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
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
              draggedBed ? 'border-green-400 bg-green-100 border-dashed shadow-inner' : 'border-green-200'
            } ${draggedPlant ? 'bg-blue-50 border-blue-300' : ''}`}
            data-garden-container
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDragEnter={(e) => {
              e.preventDefault();
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDrop={(e) => {
              e.preventDefault();
              const data = e.dataTransfer.getData('text/plain');
              const plantId = e.dataTransfer.getData('application/plant-id');
              
              console.log('Garden container drop:', { data, plantId, draggedBed, draggedPlant });
              
              // Only handle bed drops here, let plant drops bubble to beds
              if (data.startsWith('bed-') && draggedBed) {
                const bedId = data.replace('bed-', '');
                const rect = e.currentTarget.getBoundingClientRect();
                // Improved snap-to-grid calculation with proper offset
                const rawX = (e.clientX - rect.left - 40) / 60; // Account for padding
                const rawY = (e.clientY - rect.top - 80) / 60; // Account for header and padding
                const newX = Math.max(0, Math.round(rawX));
                const newY = Math.max(0, Math.round(rawY));
                
                // Ensure bed fits within garden boundaries
                const bed = beds.find(b => b.id === bedId);
                if (bed) {
                  const maxX = Math.max(0, gardenWidth - bed.width);
                  const maxY = Math.max(0, gardenHeight - bed.height);
                  const clampedX = Math.min(newX, maxX);
                  const clampedY = Math.min(newY, maxY);
                  handleBedDrag(bedId, clampedX, clampedY);
                }
                setDraggedBed(null);
              }
            }}
          >
            {/* Snap-to-grid overlay when dragging */}
            {draggedBed && (
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
                {draggedBed && (
                  <div className="text-sm text-green-600 font-semibold animate-pulse bg-green-100 px-3 py-2 rounded-lg border border-green-300">
                    🎯 Drop bed anywhere in the garden area
                  </div>
                )}
                {draggedPlant && (
                  <div className="text-sm text-blue-600 font-semibold animate-pulse bg-blue-100 px-3 py-2 rounded-lg border border-blue-300">
                    🌱 Drop plant on any garden bed
                  </div>
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
                    className={`absolute border-3 rounded-lg p-4 cursor-move select-none touch-manipulation hover:shadow-xl transition-all duration-200 ${
                      bed.type === 'raised' ? 'bg-amber-100 border-amber-400 hover:bg-amber-150' :
                      bed.type === 'ground' ? 'bg-green-100 border-green-400 hover:bg-green-150' :
                      'bg-blue-100 border-blue-400 hover:bg-blue-150'
                    } ${isOvercrowded ? 'ring-4 ring-red-400 animate-pulse' : ''} ${
                      draggedBed === bed.id ? 'opacity-60 shadow-2xl ring-4 ring-primary/30' : ''
                    } ${draggedPlant ? 'ring-2 ring-blue-300 border-blue-400' : ''}`}
                    style={{
                      left: `${bed.x * 60}px`,
                      top: `${bed.y * 60 + 40}px`,
                      width: `${bed.width * 60}px`,
                      height: `${bed.height * 60}px`,
                      minWidth: '80px',
                      minHeight: '60px'
                    }}
                    data-bed-id={bed.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedBed(bed.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect = e.currentTarget.parentElement!.getBoundingClientRect();
                      setDragOffset({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                      e.dataTransfer.setData('text/plain', `bed-${bed.id}`);
                    }}
                    onDragEnd={() => {
                      setDraggedBed(null);
                    }}
                    onTouchStart={(e) => handleTouchStart(e, 'bed', bed.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const data = e.dataTransfer.getData('text/plain');
                      const plantId = e.dataTransfer.getData('application/plant-id');
                      
                      console.log('Drop event:', { data, plantId, draggedPlant });
                      
                      // Handle plant drops
                      if ((data || plantId) && !data.startsWith('bed-') && draggedPlant) {
                        const actualPlantId = plantId || data;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const y = (e.clientY - rect.top) / rect.height;
                        
                        console.log('Dropping plant:', actualPlantId, 'into bed:', bed.id, 'at position:', { x, y });
                        handlePlantDrop(actualPlantId, bed.id, x, y);
                        setDraggedPlant(null);
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
                           className="absolute bg-green-600 text-white text-sm p-3 min-h-12 min-w-16 rounded-lg shadow-lg cursor-move select-none border-2 border-white hover:bg-green-700 hover:shadow-xl transition-all duration-200 touch-manipulation"
                           style={{
                             left: `${x * 100}%`,
                             top: `${y * 100}%`,
                             transform: 'translate(-50%, -50%)',
                             textAlign: 'center',
                             fontSize: '12px',
                             lineHeight: '1.2'
                           }}
                           draggable
                           onDragStart={(e) => {
                             setDraggedPlant(plant.id);
                             e.dataTransfer.setData('text/plain', plant.id);
                             e.dataTransfer.setData('application/plant-id', plant.id);
                           }}
                           onDragEnd={() => {
                             setDraggedPlant(null);
                           }}
                           onTouchStart={(e) => handleTouchStart(e, 'plant', plant.id)}
                         onTouchMove={handleTouchMove}
                         onTouchEnd={handleTouchEnd}
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
                           plant.name
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
