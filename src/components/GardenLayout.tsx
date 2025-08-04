import { useState } from "react";
import { Plant } from "./PlantCard";
import { GardenBedManager, GardenBed } from "./GardenBedManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Move, Settings } from "lucide-react";

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
  const [beds, setBeds] = useState<GardenBed[]>([
    {
      id: "bed-1",
      name: "Main Vegetable Bed",
      width: 3,
      height: 2,
      x: 1,
      y: 1,
      type: 'raised'
    },
    {
      id: "bed-2", 
      name: "Herb Garden",
      width: 1,
      height: 1,
      x: 5,
      y: 1,
      type: 'container'
    }
  ]);

  const [plantPositions, setPlantPositions] = useState<PlantPosition[]>([]);
  const [draggedPlant, setDraggedPlant] = useState<string | null>(null);
  const [draggedBed, setDraggedBed] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Garden boundary settings
  const [gardenWidth, setGardenWidth] = useState(10); // meters
  const [gardenHeight, setGardenHeight] = useState(8); // meters
  const [showBoundaries, setShowBoundaries] = useState(true);
  
  // Editing state
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [editingBedName, setEditingBedName] = useState("");
  const [editingPlantName, setEditingPlantName] = useState("");

  const addBed = (newBed: Omit<GardenBed, 'id'>) => {
    const bed: GardenBed = {
      ...newBed,
      id: `bed-${Date.now()}`,
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="beds">Manage Beds</TabsTrigger>
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
                      className="cursor-move p-2 hover:bg-primary/10 flex items-center gap-1"
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

          {/* Garden Grid */}
          <div 
            className="relative bg-green-50 rounded-lg p-6 min-h-96 border-2 border-green-200"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const data = e.dataTransfer.getData('text/plain');
              const plantId = e.dataTransfer.getData('application/plant-id');
              
              console.log('Garden container drop:', { data, plantId, draggedBed, draggedPlant });
              
              // Only handle bed drops here, let plant drops bubble to beds
              if (data.startsWith('bed-') && draggedBed) {
                const bedId = data.replace('bed-', '');
                const rect = e.currentTarget.getBoundingClientRect();
                const newX = Math.round((e.clientX - rect.left - dragOffset.x) / 60);
                const newY = Math.round((e.clientY - rect.top - dragOffset.y - 40) / 60);
                handleBedDrag(bedId, newX, newY);
                setDraggedBed(null);
              }
            }}
          >
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
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Garden Layout
              </h4>
              
              {beds.map(bed => {
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
                    className={`absolute border-2 rounded-lg p-3 cursor-move ${
                      bed.type === 'raised' ? 'bg-amber-100 border-amber-400' :
                      bed.type === 'ground' ? 'bg-green-100 border-green-400' :
                      'bg-blue-100 border-blue-400'
                    } ${isOvercrowded ? 'ring-2 ring-red-400' : ''} ${
                      draggedBed === bed.id ? 'opacity-50' : ''
                    }`}
                    style={{
                      left: `${bed.x * 60}px`,
                      top: `${bed.y * 60 + 40}px`,
                      width: `${bed.width * 60}px`,
                      height: `${bed.height * 60}px`,
                      minWidth: '80px',
                      minHeight: '60px'
                    }}
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
                    <div className="text-xs text-muted-foreground mb-2">
                      {totalUsedSpace.toFixed(1)}/{totalSpace.toFixed(1)}m²
                    </div>
                    
                     {bedPlants.map(({ plant, x, y }) => (
                       <div
                         key={plant.id}
                         className="absolute bg-green-600 text-white text-xs p-1 rounded shadow-sm cursor-move"
                         style={{
                           left: `${x * 100}%`,
                           top: `${y * 100}%`,
                           transform: 'translate(-50%, -50%)',
                           minWidth: '40px',
                           textAlign: 'center'
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
