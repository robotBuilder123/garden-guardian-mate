import React, { useState, useRef } from 'react';
import { Plant } from './PlantCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Leaf, TreePine, Flower2, Grid3X3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlantPosition {
  id: string;
  x: number;
  y: number;
}

interface GardenLayoutProps {
  plants: Plant[];
  onUpdatePlantPosition?: (plantId: string, x: number, y: number) => void;
}

const getPlantIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'vegetable':
      return Leaf;
    case 'tree':
    case 'fruit':
      return TreePine;
    case 'flower':
      return Flower2;
    default:
      return Leaf;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-healthy';
    case 'needs-care':
      return 'bg-needs-care';
    case 'critical':
      return 'bg-critical';
    default:
      return 'bg-muted';
  }
};

export const GardenLayout: React.FC<GardenLayoutProps> = ({ 
  plants, 
  onUpdatePlantPosition 
}) => {
  const { toast } = useToast();
  const [plantPositions, setPlantPositions] = useState<PlantPosition[]>([]);
  const [draggedPlant, setDraggedPlant] = useState<Plant | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const gardenRef = useRef<HTMLDivElement>(null);

  const GRID_SIZE = 40;
  const GARDEN_WIDTH = 800;
  const GARDEN_HEIGHT = 600;

  const handleDragStart = (e: React.DragEvent, plant: Plant) => {
    setDraggedPlant(plant);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedPlant || !gardenRef.current) return;

    const rect = gardenRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Snap to grid
    const snappedX = showGrid ? Math.round(x / GRID_SIZE) * GRID_SIZE : x;
    const snappedY = showGrid ? Math.round(y / GRID_SIZE) * GRID_SIZE : y;

    // Check bounds
    if (snappedX < 0 || snappedY < 0 || 
        snappedX > GARDEN_WIDTH - 60 || snappedY > GARDEN_HEIGHT - 60) {
      toast({
        title: "Out of bounds",
        description: "Please place the plant within the garden area.",
        variant: "destructive"
      });
      return;
    }

    // Update or add position
    setPlantPositions(prev => {
      const existing = prev.findIndex(p => p.id === draggedPlant.id);
      const newPosition = { id: draggedPlant.id, x: snappedX, y: snappedY };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newPosition;
        return updated;
      } else {
        return [...prev, newPosition];
      }
    });

    onUpdatePlantPosition?.(draggedPlant.id, snappedX, snappedY);
    setDraggedPlant(null);

    toast({
      title: "Plant placed!",
      description: `${draggedPlant.name} has been positioned in your garden.`,
    });
  };

  const getPlantPosition = (plantId: string) => {
    return plantPositions.find(p => p.id === plantId);
  };

  const unplacedPlants = plants.filter(plant => !getPlantPosition(plant.id));
  const placedPlants = plants.filter(plant => getPlantPosition(plant.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-foreground">Garden Layout</h2>
          <Badge variant="outline" className="gap-1">
            <Leaf className="h-3 w-3" />
            {placedPlants.length} of {plants.length} placed
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className="gap-2"
        >
          <Grid3X3 className="h-4 w-4" />
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Plant Palette */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-foreground mb-4">Available Plants</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {unplacedPlants.map((plant) => {
              const IconComponent = getPlantIcon(plant.type);
              return (
                <div
                  key={plant.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, plant)}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-move hover:bg-accent transition-colors"
                >
                  <div className={`p-2 rounded-full ${getStatusColor(plant.status)}/20`}>
                    <IconComponent className={`h-4 w-4 text-${plant.status === 'healthy' ? 'healthy' : plant.status === 'needs-care' ? 'needs-care' : 'critical'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{plant.name}</p>
                    <p className="text-xs text-muted-foreground">{plant.type}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(plant.status)}`} />
                </div>
              );
            })}
            {unplacedPlants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Leaf className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All plants have been placed!</p>
              </div>
            )}
          </div>
        </div>

        {/* Garden Canvas */}
        <div className="lg:col-span-3">
          <h3 className="text-lg font-medium text-foreground mb-4">Garden Map</h3>
          <div className="relative border-2 border-dashed border-border rounded-lg overflow-hidden">
            <div
              ref={gardenRef}
              className="relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20"
              style={{ width: GARDEN_WIDTH, height: GARDEN_HEIGHT }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Grid */}
              {showGrid && (
                <svg
                  className="absolute inset-0 pointer-events-none opacity-30"
                  width={GARDEN_WIDTH}
                  height={GARDEN_HEIGHT}
                >
                  <defs>
                    <pattern
                      id="grid"
                      width={GRID_SIZE}
                      height={GRID_SIZE}
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              )}

              {/* Drop zone instructions */}
              {placedPlants.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Leaf className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-lg font-medium">Drag plants here to place them</p>
                    <p className="text-sm">Organize your garden layout visually</p>
                  </div>
                </div>
              )}

              {/* Placed Plants */}
              {placedPlants.map((plant) => {
                const position = getPlantPosition(plant.id);
                if (!position) return null;

                const IconComponent = getPlantIcon(plant.type);
                return (
                  <div
                    key={plant.id}
                    className="absolute cursor-move group"
                    style={{
                      left: position.x,
                      top: position.y,
                      transform: 'translate(-50%, -50%)'
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, plant)}
                  >
                    <div className={`relative p-3 rounded-full bg-card border-2 shadow-lg transition-all group-hover:scale-110 ${
                      plant.status === 'healthy' ? 'border-healthy' : 
                      plant.status === 'needs-care' ? 'border-needs-care' : 'border-critical'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        plant.status === 'healthy' ? 'text-healthy' : 
                        plant.status === 'needs-care' ? 'text-needs-care' : 'text-critical'
                      }`} />
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(plant.status)}`} />
                    </div>
                    
                    {/* Plant label on hover */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md border whitespace-nowrap">
                        {plant.name}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Drag preview */}
              {draggedPlant && (
                <div className="absolute pointer-events-none opacity-50 z-10">
                  <div className="p-3 rounded-full bg-card border-2 border-primary">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Drag plants from the left panel to place them in your garden. 
            {showGrid && " Plants will snap to the grid for organized placement."}
          </p>
        </div>
      </div>
    </div>
  );
};