import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Scissors, Calendar, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Plant {
  id: string;
  name: string;
  type: string;
  plantedDate: string;
  lastWatered: string;
  lastFertilized: string;
  status: 'healthy' | 'needs-care' | 'critical';
  location: string;
}

interface PlantCardProps {
  plant: Plant;
  onWater: (id: string) => void;
  onFertilize: (id: string) => void;
  onEdit: (plant: Plant) => void;
}

const statusConfig = {
  healthy: { color: 'bg-healthy', text: 'Healthy' },
  'needs-care': { color: 'bg-needs-care', text: 'Needs Care' },
  critical: { color: 'bg-critical', text: 'Critical' }
};

export const PlantCard = ({ plant, onWater, onFertilize, onEdit }: PlantCardProps) => {
  const daysSinceWatered = Math.floor(
    (new Date().getTime() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground">{plant.name}</h3>
            <p className="text-sm text-muted-foreground">{plant.type}</p>
            <p className="text-xs text-muted-foreground">{plant.location}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              className={cn(
                "text-white border-0",
                statusConfig[plant.status].color
              )}
            >
              {statusConfig[plant.status].text}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(plant)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-4 w-4" />
              <span>Last watered</span>
            </div>
            <span className={cn(
              "font-medium",
              daysSinceWatered > 3 ? "text-needs-care" : "text-foreground"
            )}>
              {daysSinceWatered === 0 ? 'Today' : `${daysSinceWatered} days ago`}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Planted</span>
            </div>
            <span className="font-medium text-foreground">
              {new Date(plant.plantedDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onWater(plant.id)}
            className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Droplets className="h-4 w-4 mr-2" />
            Water
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFertilize(plant.id)}
            className="flex-1 hover:bg-secondary hover:text-secondary-foreground transition-colors"
          >
            <Scissors className="h-4 w-4 mr-2" />
            Care
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};