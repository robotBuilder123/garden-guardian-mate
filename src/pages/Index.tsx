import { useState, useEffect } from "react";
import { PlantCard, Plant, Comment } from "@/components/PlantCard";
import { AddPlantDialog } from "@/components/AddPlantDialog";
import { GardenLayout } from "@/components/GardenLayout";
import { PlantCommentsDialog } from "@/components/PlantCommentsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Leaf, Droplets, Calendar, Map, Scale, BarChart3, Plus, History, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import gardenHero from "@/assets/garden-hero.jpg";

interface SeasonReport {
  id: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  plants: Plant[];
  totalHarvest: number;
  createdAt: string;
}

const Index = () => {
  const { toast } = useToast();
  const [commentsDialogPlant, setCommentsDialogPlant] = useState<Plant | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<string>("2024 Season");
  const [seasonReports, setSeasonReports] = useState<SeasonReport[]>([]);
  
  // Load plants and season data from localStorage
  const loadPlantsFromStorage = (): Plant[] => {
    try {
      const savedPlants = localStorage.getItem(`garden-plants-${currentSeason}`);
      if (savedPlants) {
        return JSON.parse(savedPlants);
      }
    } catch (error) {
      console.error('Error loading plants from storage:', error);
    }
    
    // Default plants if nothing in storage
    return [
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
        lastHarvest: "2024-07-30",
        spaceRequired: 1.5,
        comments: []
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
        totalHarvest: 0.3,
        spaceRequired: 0.5,
        comments: []
      }
    ];
  };

  const [plants, setPlants] = useState<Plant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load current season and reports on component mount
  useEffect(() => {
    try {
      const savedSeason = localStorage.getItem('current-season');
      if (savedSeason) {
        setCurrentSeason(savedSeason);
      }
      
      const savedReports = localStorage.getItem('season-reports');
      if (savedReports) {
        setSeasonReports(JSON.parse(savedReports));
      }
    } catch (error) {
      console.error('Error loading season data:', error);
    }
  }, []);

  // Load plants when season changes
  useEffect(() => {
    setPlants(loadPlantsFromStorage());
  }, [currentSeason]);

  // Save plants to localStorage whenever plants state changes
  useEffect(() => {
    try {
      localStorage.setItem(`garden-plants-${currentSeason}`, JSON.stringify(plants));
    } catch (error) {
      console.error('Error saving plants to storage:', error);
    }
  }, [plants, currentSeason]);

  // Save season reports whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('season-reports', JSON.stringify(seasonReports));
    } catch (error) {
      console.error('Error saving season reports:', error);
    }
  }, [seasonReports]);

  const addPlant = (newPlant: Omit<Plant, 'id' | 'totalHarvest' | 'comments'>) => {
    const plant: Plant = {
      ...newPlant,
      id: Date.now().toString(),
      totalHarvest: 0,
      comments: [],
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

  const updatePlant = (plantId: string, updates: Partial<Plant>) => {
    setPlants(prev => prev.map(plant => 
      plant.id === plantId 
        ? { ...plant, ...updates }
        : plant
    ));
    toast({
      title: "Plant updated!",
      description: "Plant information has been saved.",
    });
  };

  const editPlant = (plant: Plant) => {
    // For now, just show a toast - can implement edit dialog later
    toast({
      title: "Edit feature",
      description: "Plant editing will be available soon!",
    });
  };

  const deletePlant = (id: string) => {
    const plant = plants.find(p => p.id === id);
    if (plant && window.confirm(`Are you sure you want to delete ${plant.name}?`)) {
      setPlants(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Plant deleted",
        description: `${plant.name} has been removed from your garden.`,
        variant: "destructive",
      });
    }
  };

  const viewComments = (plant: Plant) => {
    setCommentsDialogPlant(plant);
    setIsCommentsDialogOpen(true);
  };

  const addComment = (plantId: string, commentText: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText,
      timestamp: new Date().toISOString(),
    };

    setPlants(prev => prev.map(plant => 
      plant.id === plantId 
        ? { ...plant, comments: [...(plant.comments || []), newComment] }
        : plant
    ));

    // Update the dialog plant to reflect the new comment
    setCommentsDialogPlant(prev => 
      prev?.id === plantId 
        ? { ...prev, comments: [...(prev.comments || []), newComment] }
        : prev
    );

    toast({
      title: "Comment added",
      description: "Your comment has been saved.",
    });
  };

  const duplicatePlant = (originalPlant: Plant, newName: string) => {
    const duplicatedPlant: Plant = {
      ...originalPlant,
      id: Date.now().toString(),
      name: newName,
      plantedDate: new Date().toISOString().split('T')[0], // Today's date
      totalHarvest: 0, // Reset harvest for new plant
      lastHarvest: undefined,
      comments: [] // Reset comments for new plant
    };
    
    setPlants(prev => [...prev, duplicatedPlant]);
    toast({
      title: "Plant duplicated!",
      description: `${newName} has been created from ${originalPlant.name}.`,
    });
  };

  const createNewGarden = (seasonName: string) => {
    // Save current season as a report if it has plants
    if (plants.length > 0) {
      const currentReport: SeasonReport = {
        id: Date.now().toString(),
        seasonName: currentSeason,
        startDate: plants.reduce((earliest, plant) => 
          plant.plantedDate < earliest ? plant.plantedDate : earliest, 
          plants[0]?.plantedDate || new Date().toISOString()
        ),
        endDate: new Date().toISOString(),
        plants: [...plants],
        totalHarvest: plants.reduce((sum, plant) => sum + plant.totalHarvest, 0),
        createdAt: new Date().toISOString()
      };
      
      setSeasonReports(prev => [...prev, currentReport]);
      
      toast({
        title: "Season archived!",
        description: `${currentSeason} has been saved to your harvest history.`,
      });
    }

    // Clear current plants and start new season
    setCurrentSeason(seasonName);
    localStorage.setItem('current-season', seasonName);
    setPlants([]);
    
    // Clear plant positions from garden beds while keeping the bed layout
    try {
      localStorage.removeItem(`garden-plant-positions-${currentSeason}`);
      localStorage.setItem(`garden-plant-positions-${seasonName}`, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing plant positions:', error);
    }
    
    toast({
      title: "New garden started!",
      description: `Welcome to your ${seasonName}! Garden beds preserved, plants and harvest data cleared.`,
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
            <p className="text-lg opacity-90">{currentSeason}</p>
            <p className="text-sm opacity-75">Track and care for your plants</p>
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
          <div className="flex gap-2">
            <Link to="/stats">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Stats Overview
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Season
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start New Garden Season</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will save your current season's harvest data and start fresh with a new garden. 
                    Your current plants and harvest data will be archived.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    const newSeasonName = prompt("Enter name for new season:", `${new Date().getFullYear()} Season`);
                    if (newSeasonName?.trim()) {
                      createNewGarden(newSeasonName.trim());
                    }
                  }}>
                    Start New Season
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AddPlantDialog onAddPlant={addPlant} />
          </div>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cards" className="gap-2">
              <Leaf className="h-4 w-4" />
              Plant Cards
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-2">
              <Map className="h-4 w-4" />
              Garden Layout
            </TabsTrigger>
            <TabsTrigger value="harvest" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Harvest Tracker
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Season History
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
                     onDelete={deletePlant}
                     onViewComments={viewComments}
                   />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="layout" className="mt-6">
            <GardenLayout 
              plants={plants} 
              onUpdatePlant={updatePlant} 
              onDuplicatePlant={duplicatePlant}
              onHarvest={harvestPlant}
            />
          </TabsContent>
          
          <TabsContent value="harvest" className="mt-6">
            <div className="space-y-6">
              {/* Harvest Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Scale className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Harvest</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {plants.reduce((sum, plant) => sum + plant.totalHarvest, 0).toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Leaf className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Producing Plants</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {plants.filter(p => p.totalHarvest > 0).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card rounded-lg p-6 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average per Plant</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {plants.length > 0 
                          ? (plants.reduce((sum, plant) => sum + plant.totalHarvest, 0) / plants.length).toFixed(1)
                          : "0.0"
                        } kg
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Harvest Table */}
              <div className="bg-card rounded-lg border border-border/50">
                <div className="p-6 border-b border-border/50">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Harvest Overview
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your harvest progress for each plant
                  </p>
                </div>
                
                <div className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plant Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Total Harvest</TableHead>
                        <TableHead>Last Harvest</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No plants added yet. Start by adding your first plant!
                          </TableCell>
                        </TableRow>
                      ) : (
                        plants
                          .sort((a, b) => b.totalHarvest - a.totalHarvest) // Sort by harvest amount descending
                          .map((plant) => (
                            <TableRow key={plant.id}>
                              <TableCell className="font-medium">{plant.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {plant.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {plant.location}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Scale className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">
                                    {plant.totalHarvest.toFixed(1)} kg
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {plant.lastHarvest 
                                  ? new Date(plant.lastHarvest).toLocaleDateString()
                                  : "Never"
                                }
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={plant.status === 'healthy' ? 'default' : 'secondary'}
                                  className={`text-xs ${
                                    plant.status === 'healthy' 
                                      ? 'bg-healthy/10 text-healthy border-healthy/20' 
                                      : plant.status === 'needs-care'
                                      ? 'bg-needs-care/10 text-needs-care border-needs-care/20'
                                      : 'bg-critical/10 text-critical border-critical/20'
                                  }`}
                                >
                                  {plant.status === 'needs-care' ? 'Needs Care' : plant.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="space-y-6">
              {/* Current Season Info */}
              <div className="bg-card rounded-lg border border-border/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Leaf className="h-5 w-5" />
                      Current Season: {currentSeason}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plants.length} plants • {plants.reduce((sum, plant) => sum + plant.totalHarvest, 0).toFixed(1)} kg harvested
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Archive className="h-4 w-4" />
                        Archive Season
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive Current Season</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will save your current season's data to history and clear your current garden. 
                          You can start fresh or create a new season afterward.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          createNewGarden(`${new Date().getFullYear()} New Season`);
                        }}>
                          Archive & Start Fresh
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Season Reports */}
              <div className="bg-card rounded-lg border border-border/50">
                <div className="p-6 border-b border-border/50">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Previous Seasons
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your archived harvest reports and garden history
                  </p>
                </div>
                
                <div className="p-6">
                  {seasonReports.length === 0 ? (
                    <div className="text-center py-8">
                      <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-foreground mb-2">No previous seasons</h4>
                      <p className="text-muted-foreground">
                        When you start a new season, your current garden data will be archived here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {seasonReports
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((report) => (
                          <div key={report.id} className="border border-border/50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-foreground">{report.seasonName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-foreground">{report.totalHarvest.toFixed(1)} kg</p>
                                <p className="text-sm text-muted-foreground">Total Harvest</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="bg-background/50 rounded p-3">
                                <div className="flex items-center gap-2">
                                  <Leaf className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">Plants: {report.plants.length}</span>
                                </div>
                              </div>
                              <div className="bg-background/50 rounded p-3">
                                <div className="flex items-center gap-2">
                                  <Scale className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium">
                                    Producers: {report.plants.filter(p => p.totalHarvest > 0).length}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-background/50 rounded p-3">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm font-medium">
                                    Avg: {report.plants.length > 0 ? (report.totalHarvest / report.plants.length).toFixed(1) : "0.0"} kg
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Top performers */}
                            {report.plants.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-foreground mb-2">Top Performers:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {report.plants
                                    .filter(p => p.totalHarvest > 0)
                                    .sort((a, b) => b.totalHarvest - a.totalHarvest)
                                    .slice(0, 3)
                                    .map((plant) => (
                                      <Badge key={plant.id} variant="outline" className="text-xs">
                                        {plant.name}: {plant.totalHarvest.toFixed(1)} kg
                                      </Badge>
                                    ))}
                                  {report.plants.filter(p => p.totalHarvest > 0).length === 0 && (
                                    <span className="text-sm text-muted-foreground">No harvest recorded</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PlantCommentsDialog
        plant={commentsDialogPlant}
        open={isCommentsDialogOpen}
        onOpenChange={setIsCommentsDialogOpen}
        onAddComment={addComment}
      />
    </div>
  );
};

export default Index;