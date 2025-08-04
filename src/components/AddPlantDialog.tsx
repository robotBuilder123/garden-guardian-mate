import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Plant } from "./PlantCard";

interface AddPlantDialogProps {
  onAddPlant: (plant: Omit<Plant, 'id'>) => void;
}

const plantTypes = [
  "Vegetable",
  "Herb",
  "Flower",
  "Fruit",
  "Succulent",
  "Tree",
  "Shrub",
  "Other"
];

export const AddPlantDialog = ({ onAddPlant }: AddPlantDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    location: "",
    plantedDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.location) return;

    const today = new Date().toISOString();
    onAddPlant({
      ...formData,
      lastWatered: today,
      lastFertilized: today,
      status: 'healthy' as const,
    });

    setFormData({
      name: "",
      type: "",
      location: "",
      plantedDate: new Date().toISOString().split('T')[0],
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Add Plant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Plant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Cherry Tomato"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Plant Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plant type" />
              </SelectTrigger>
              <SelectContent>
                {plantTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Garden Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Front yard, Pot 3, Garden bed A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plantedDate">Planted Date</Label>
            <Input
              id="plantedDate"
              type="date"
              value={formData.plantedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, plantedDate: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Plant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};