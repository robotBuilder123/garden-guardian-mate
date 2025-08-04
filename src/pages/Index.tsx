import { useState } from "react";
import { PlantCard, Plant } from "@/components/PlantCard";
import { AddPlantDialog } from "@/components/AddPlantDialog";
import { GardenLayout } from "@/components/GardenLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Leaf, Droplets, Calendar, Map, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import gardenHero from "@/assets/garden-hero.jpg";

const Index = () => {
  const { toast } = useToast();
  const [plants, setPlants] = useState<Plant[]>([
    {
      id: "1",
      name: "Cherry Tomatoes",
      type: "Vegetable",
      plantedDate: "2024-07-15",
      lastWatered: "2024-08-02",
      lastFertilized: "2024-07-20",
      status: "needs-care",
      location: "Garden Bed A",
      totalHarvest: 2.5,
      lastHarvest: "2024-07-30"
    },
    {
      id: "2",
      name: "Basil",
      type: "Herb",
      plantedDate: "2024-07-20",
      lastWatered: "2024-08-04",
      lastFertilized: "2024-07-25",
      status: "healthy",
      location: "Herb Planter",
      totalHarvest: 0.3
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const addPlant = (newPlant: Omit<Plant, 'id'>) => {
    const plant: Plant = {
      ...newPlant,
      id: Date.now().toString(),
      totalHarvest: 0,
    };
    setPlants(prev => [...prev, plant]);
    toast({
      title: "Plant added!",
      description: `${plant.name} has been added to your garden.`,
    });
  };

  const waterPlant = (id: string) => {
    setPlants(prev => prev.map(plant => 
      plant.id === id 
        ? { ...plant, lastWatered: new Date().toISOString(), status: 'healthy' as const }
        : plant
    ));
    toast({
      title: "Plant watered!",
      description: "Your plant will be happy and healthy.",
    });
  };

  const fertilizePlant = (id: string) => {
    setPlants(prev => prev.map(plant => 
      plant.id === id 
        ? { ...plant, lastFertilized: new Date().toISOString(), status: 'healthy' as const }
        : plant
    ));
    toast({
      title: "Plant cared for!",
      description: "Your plant received some TLC.",
    });
  };

  const harvestPlant = (id: string, amount: number) => {
    setPlants(prev => prev.map(plant => 
      plant.id === id 
        ? { 
            ...plant, 
            totalHarvest: plant.totalHarvest + amount,
            lastHarvest: new Date().toISOString()
          }
        : plant
    ));
    toast({
      title: "Harvest recorded!",
      description: `Added ${amount} kg to your harvest total.`,
    });
  };

  const editPlant = (plant: Plant) => {
    // For now, just show a toast - can implement edit dialog later
    toast({
      title: "Edit feature",
      description: "Plant editing will be available soon!",
    });
  };

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plant.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || plant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: plants.length,
    healthy: plants.filter(p => p.status === 'healthy').length,
    'needs-care': plants.filter(p => p.status === 'needs-care').length,
    critical: plants.filter(p => p.status === 'critical').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={gardenHero} 
          alt="Beautiful garden" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Leaf className="h-8 w-8" />
              <h1 className="text-4xl font-bold">My Garden</h1>
            </div>
            <p className="text-lg opacity-90">Track and care for your plants</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search plants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <AddPlantDialog onAddPlant={addPlant} />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="gap-2"
            >
              {status === 'all' && <Leaf className="h-4 w-4" />}
              {status === 'healthy' && <div className="w-2 h-2 rounded-full bg-healthy" />}
              {status === 'needs-care' && <div className="w-2 h-2 rounded-full bg-needs-care" />}
              {status === 'critical' && <div className="w-2 h-2 rounded-full bg-critical" />}
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')} ({count})
            </Button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Plants</p>
                <p className="text-2xl font-semibold text-foreground">{plants.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-needs-care/10">
                <Droplets className="h-5 w-5 text-needs-care" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Need Attention</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statusCounts['needs-care'] + statusCounts.critical}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-healthy/10">
                <Calendar className="h-5 w-5 text-healthy" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Healthy Plants</p>
                <p className="text-2xl font-semibold text-foreground">{statusCounts.healthy}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Scale className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Harvest</p>
                <p className="text-2xl font-semibold text-foreground">
                  {plants.reduce((sum, plant) => sum + plant.totalHarvest, 0).toFixed(1)} kg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards" className="gap-2">
              <Leaf className="h-4 w-4" />
              Plant Cards
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-2">
              <Map className="h-4 w-4" />
              Garden Layout
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards" className="mt-6">
            {/* Plants Grid */}
            {filteredPlants.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {plants.length === 0 ? "No plants yet" : "No plants found"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {plants.length === 0 
                    ? "Start your garden by adding your first plant!" 
                    : "Try adjusting your search or filters."
                  }
                </p>
                {plants.length === 0 && <AddPlantDialog onAddPlant={addPlant} />}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onWater={waterPlant}
                    onFertilize={fertilizePlant}
                    onHarvest={harvestPlant}
                    onEdit={editPlant}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="layout" className="mt-6">
            <GardenLayout plants={plants} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;