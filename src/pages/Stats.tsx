import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Leaf, Target, Calendar, BarChart3, PieChart as PieChartIcon, Activity, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Plant } from "@/components/PlantCard";
import { GardenBed } from "@/components/GardenBedManager";

interface PlantPosition {
  plantId: string;
  bedId: string;
  x: number;
  y: number;
}

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316'];

const Stats = () => {
  // Load data from localStorage
  const [plants, setPlants] = useState<Plant[]>([]);
  const [beds, setBeds] = useState<GardenBed[]>([]);
  const [plantPositions, setPlantPositions] = useState<PlantPosition[]>([]);
  const [currentSeason, setCurrentSeason] = useState<string>("2024 Season");

  useEffect(() => {
    // Load current season
    const savedSeason = localStorage.getItem('current-season') || "2024 Season";
    setCurrentSeason(savedSeason);

    // Load plants for current season
    try {
      const savedPlants = localStorage.getItem(`garden-plants-${savedSeason}`);
      if (savedPlants) {
        setPlants(JSON.parse(savedPlants));
      }
    } catch (error) {
      console.error('Error loading plants:', error);
    }

    // Load garden beds
    try {
      const savedBeds = localStorage.getItem('garden-beds');
      if (savedBeds) {
        setBeds(JSON.parse(savedBeds));
      }
    } catch (error) {
      console.error('Error loading beds:', error);
    }

    // Load plant positions
    try {
      const savedPositions = localStorage.getItem(`garden-plant-positions-${savedSeason}`);
      if (savedPositions) {
        setPlantPositions(JSON.parse(savedPositions));
      }
    } catch (error) {
      console.error('Error loading plant positions:', error);
    }
  }, []);
  const [selectedMetric, setSelectedMetric] = useState<'space' | 'harvest' | 'plants'>('space');

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalGardenSpace = beds.reduce((sum, bed) => sum + (bed.width * bed.height), 0);
    const plantsInBeds = plantPositions.map(pos => {
      const plant = plants.find(p => p.id === pos.plantId);
      return plant ? { ...plant, bedId: pos.bedId } : null;
    }).filter(Boolean);
    
    const totalUsedSpace = plantsInBeds.reduce((sum, plant) => sum + (plant?.spaceRequired || 0), 0);
    const spaceUtilization = totalGardenSpace > 0 ? (totalUsedSpace / totalGardenSpace) * 100 : 0;
    
    const totalHarvested = plants.reduce((sum, plant) => sum + plant.totalHarvest, 0);
    const totalPlants = plants.length;
    const plantsWithHarvest = plants.filter(p => p.totalHarvest > 0).length;
    
    // Plant status distribution
    const statusCounts = plants.reduce((acc, plant) => {
      acc[plant.status] = (acc[plant.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Bed utilization data
    const bedUtilization = beds.map(bed => {
      const bedPlants = plantsInBeds.filter(p => p?.bedId === bed.id);
      const usedSpace = bedPlants.reduce((sum, plant) => sum + (plant?.spaceRequired || 0), 0);
      const totalSpace = bed.width * bed.height;
      const utilization = totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0;
      
      return {
        name: bed.name,
        utilized: utilization,
        plants: bedPlants.length,
        usedSpace: usedSpace,
        totalSpace: totalSpace
      };
    });

    // Plant type distribution
    const plantTypes = plants.reduce((acc, plant) => {
      const type = plant.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly harvest simulation (since we don't have real dates, we'll simulate)
    const monthlyHarvest = [
      { month: 'Jan', harvest: totalHarvested * 0.05 },
      { month: 'Feb', harvest: totalHarvested * 0.08 },
      { month: 'Mar', harvest: totalHarvested * 0.15 },
      { month: 'Apr', harvest: totalHarvested * 0.20 },
      { month: 'May', harvest: totalHarvested * 0.25 },
      { month: 'Jun', harvest: totalHarvested * 0.27 }
    ];

    return {
      totalGardenSpace,
      totalUsedSpace,
      spaceUtilization,
      totalHarvested,
      totalPlants,
      plantsWithHarvest,
      statusCounts,
      bedUtilization,
      plantTypes,
      monthlyHarvest
    };
  }, [plants, beds, plantPositions]);

  const statusData = Object.entries(stats.statusCounts).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count
  }));

  const plantTypeData = Object.entries(stats.plantTypes).map(([type, count]) => ({
    name: type,
    value: count
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Garden
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Garden Statistics</h1>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Activity className="h-4 w-4 mr-2" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Space Utilization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.spaceUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsedSpace.toFixed(1)}m² of {stats.totalGardenSpace.toFixed(1)}m²
            </p>
            <Progress 
              value={Math.min(stats.spaceUtilization, 100)} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHarvested.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              From {stats.plantsWithHarvest} producing plants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlants}</div>
            <p className="text-xs text-muted-foreground">
              Across {beds.length} garden beds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Garden Beds</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{beds.length}</div>
            <p className="text-xs text-muted-foreground">
              {beds.filter(bed => stats.bedUtilization.find(b => b.name === bed.name)?.utilized > 80).length} near capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="space">Space Analysis</TabsTrigger>
          <TabsTrigger value="harvest">Harvest Tracking</TabsTrigger>
          <TabsTrigger value="plants">Plant Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="space" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Bed Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.bedUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
                      labelFormatter={(label) => `Bed: ${label}`}
                    />
                    <Bar 
                      dataKey="utilized" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Overall Space Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Used Space</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.totalUsedSpace.toFixed(1)}m²
                    </span>
                  </div>
                  <Progress value={stats.spaceUtilization} className="h-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Available Space</span>
                    <span className="text-sm text-muted-foreground">
                      {(stats.totalGardenSpace - stats.totalUsedSpace).toFixed(1)}m²
                    </span>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {stats.spaceUtilization.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Space Utilization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="harvest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Harvest Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.monthlyHarvest}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Harvest']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="harvest" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plants" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Plant Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Plant Varieties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={plantTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stats;