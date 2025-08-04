import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { DollarSign, Clock, TrendingUp, TrendingDown, Calculator, Plus, ArrowLeft, Trash2, Edit, ShoppingCart, Coins, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Plant } from "@/components/PlantCard";
import { useToast } from "@/hooks/use-toast";

interface GardenExpense {
  id: string;
  name: string;
  category: 'seeds' | 'tools' | 'soil' | 'fertilizer' | 'water' | 'containers' | 'other';
  cost: number;
  date: string;
  notes?: string;
}

interface TimeEntry {
  id: string;
  activity: string;
  hours: number;
  date: string;
  plantIds?: string[];
}

interface ProducePricing {
  plantType: string;
  storePrice: number; // per kg
  organicStorePrice: number; // per kg
}

const defaultProducePricing: ProducePricing[] = [
  { plantType: 'Tomato', storePrice: 4.50, organicStorePrice: 7.50 },
  { plantType: 'Lettuce', storePrice: 3.00, organicStorePrice: 5.50 },
  { plantType: 'Carrot', storePrice: 2.50, organicStorePrice: 4.00 },
  { plantType: 'Herb', storePrice: 15.00, organicStorePrice: 25.00 },
  { plantType: 'Vegetable', storePrice: 5.00, organicStorePrice: 8.00 },
  { plantType: 'Fruit', storePrice: 6.00, organicStorePrice: 10.00 },
];

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316'];
const EXPENSE_CATEGORIES = [
  { value: 'seeds', label: 'Seeds & Plants', icon: '🌱' },
  { value: 'tools', label: 'Tools & Equipment', icon: '🔧' },
  { value: 'soil', label: 'Soil & Compost', icon: '🪴' },
  { value: 'fertilizer', label: 'Fertilizer & Nutrients', icon: '🧪' },
  { value: 'water', label: 'Water & Irrigation', icon: '💧' },
  { value: 'containers', label: 'Pots & Containers', icon: '🪣' },
  { value: 'other', label: 'Other Expenses', icon: '📦' },
];

const CostAnalysis = () => {
  const { toast } = useToast();
  const [currentSeason, setCurrentSeason] = useState<string>("2024 Season");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [expenses, setExpenses] = useState<GardenExpense[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [producePricing, setProducePricing] = useState<ProducePricing[]>(defaultProducePricing);
  
  // Settings states
  const [currency, setCurrency] = useState<string>('USD');
  const [metricSystem, setMetricSystem] = useState<'metric' | 'imperial'>('metric');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Dialog states
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);

  // Form states
  const [newExpense, setNewExpense] = useState<Partial<GardenExpense>>({
    category: 'seeds',
    date: new Date().toISOString().split('T')[0]
  });
  const [newTimeEntry, setNewTimeEntry] = useState<Partial<TimeEntry>>({
    date: new Date().toISOString().split('T')[0]
  });

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

    // Load expenses
    try {
      const savedExpenses = localStorage.getItem(`garden-expenses-${savedSeason}`);
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }

    // Load time entries
    try {
      const savedTimeEntries = localStorage.getItem(`garden-time-${savedSeason}`);
      if (savedTimeEntries) {
        setTimeEntries(JSON.parse(savedTimeEntries));
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
    }

    // Load custom pricing
    try {
      const savedPricing = localStorage.getItem('garden-produce-pricing');
      if (savedPricing) {
        setProducePricing(JSON.parse(savedPricing));
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
    }

    // Load settings
    try {
      const savedCurrency = localStorage.getItem('garden-currency');
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
      const savedMetricSystem = localStorage.getItem('garden-metric-system');
      if (savedMetricSystem) {
        setMetricSystem(savedMetricSystem as 'metric' | 'imperial');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`garden-expenses-${currentSeason}`, JSON.stringify(expenses));
  }, [expenses, currentSeason]);

  useEffect(() => {
    localStorage.setItem(`garden-time-${currentSeason}`, JSON.stringify(timeEntries));
  }, [timeEntries, currentSeason]);

  useEffect(() => {
    localStorage.setItem('garden-produce-pricing', JSON.stringify(producePricing));
  }, [producePricing]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('garden-currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('garden-metric-system', metricSystem);
  }, [metricSystem]);

  const addExpense = () => {
    if (!newExpense.name || !newExpense.cost || !newExpense.category) return;

    const expense: GardenExpense = {
      id: Date.now().toString(),
      name: newExpense.name,
      category: newExpense.category as any,
      cost: convertToUSD(Number(newExpense.cost)), // Convert to USD for storage
      date: newExpense.date || new Date().toISOString().split('T')[0],
      notes: newExpense.notes
    };

    setExpenses(prev => [...prev, expense]);
    setNewExpense({
      category: 'seeds',
      date: new Date().toISOString().split('T')[0]
    });
    setExpenseDialogOpen(false);

    toast({
      title: "Expense added!",
      description: `Added ${formatCurrency(expense.cost)} for ${expense.name}`,
    });
  };

  const addTimeEntry = () => {
    if (!newTimeEntry.activity || !newTimeEntry.hours) return;

    const timeEntry: TimeEntry = {
      id: Date.now().toString(),
      activity: newTimeEntry.activity,
      hours: Number(newTimeEntry.hours),
      date: newTimeEntry.date || new Date().toISOString().split('T')[0],
    };

    setTimeEntries(prev => [...prev, timeEntry]);
    setNewTimeEntry({
      date: new Date().toISOString().split('T')[0]
    });
    setTimeDialogOpen(false);

    toast({
      title: "Time logged!",
      description: `Added ${timeEntry.hours} hours for ${timeEntry.activity}`,
    });
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast({
      title: "Expense removed",
      description: "The expense has been deleted",
      variant: "destructive"
    });
  };

  const removeTimeEntry = (id: string) => {
    setTimeEntries(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Time entry removed",
      description: "The time entry has been deleted",
      variant: "destructive"
    });
  };

  // Currency conversion and formatting functions
  const currencies = {
    'USD': { symbol: '$', rate: 1, name: 'US Dollar' },
    'EUR': { symbol: '€', rate: 0.85, name: 'Euro' },
    'GBP': { symbol: '£', rate: 0.73, name: 'British Pound' },
    'CAD': { symbol: 'C$', rate: 1.25, name: 'Canadian Dollar' },
    'AUD': { symbol: 'A$', rate: 1.35, name: 'Australian Dollar' },
    'JPY': { symbol: '¥', rate: 110, name: 'Japanese Yen' },
    'SEK': { symbol: 'kr', rate: 10.5, name: 'Swedish Krona' },
  };

  const formatCurrency = (amount: number) => {
    const rate = currencies[currency as keyof typeof currencies]?.rate || 1;
    const symbol = currencies[currency as keyof typeof currencies]?.symbol || '$';
    const converted = amount * rate;
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Convert from selected currency to USD for storage
  const convertToUSD = (amount: number) => {
    const rate = currencies[currency as keyof typeof currencies]?.rate || 1;
    return amount / rate;
  };

  // Convert from USD to selected currency for display in input
  const convertFromUSD = (usdAmount: number) => {
    const rate = currencies[currency as keyof typeof currencies]?.rate || 1;
    return usdAmount * rate;
  };

  const formatWeight = (kg: number) => {
    if (metricSystem === 'metric') {
      return `${kg.toFixed(2)} kg`;
    } else {
      const lbs = kg * 2.20462;
      return `${lbs.toFixed(2)} lbs`;
    }
  };

  const formatArea = (sqm: number) => {
    if (metricSystem === 'metric') {
      return `${sqm.toFixed(2)} m²`;
    } else {
      const sqft = sqm * 10.7639;
      return `${sqft.toFixed(2)} ft²`;
    }
  };

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.cost, 0);
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    // Calculate savings based on harvest
    const totalSavings = plants.reduce((sum, plant) => {
      const pricing = producePricing.find(p => p.plantType === plant.type) || 
                     { storePrice: 5.00, organicStorePrice: 8.00 };
      
      // Use organic store price for savings calculation (assuming homegrown is organic quality)
      return sum + (plant.totalHarvest * pricing.organicStorePrice);
    }, 0);

    const netProfit = totalSavings - totalExpenses;
    const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100) : 0;
    const hourlyWage = totalHours > 0 ? (netProfit / totalHours) : 0;
    const breakEvenPoint = totalExpenses;

    // Expense breakdown by category
    const expensesByCategory = EXPENSE_CATEGORIES.map(category => ({
      name: category.label,
      value: expenses
        .filter(e => e.category === category.value)
        .reduce((sum, e) => sum + e.cost, 0)
    })).filter(item => item.value > 0);

    // Monthly trends (simplified)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - i));
      const monthStr = month.toISOString().slice(0, 7);
      
      const monthExpenses = expenses
        .filter(e => e.date.startsWith(monthStr))
        .reduce((sum, e) => sum + e.cost, 0);
      
      const monthHarvest = plants.reduce((sum, plant) => {
        // Simulate monthly harvest distribution
        return sum + (plant.totalHarvest / 6);
      }, 0);
      
      const monthSavings = monthHarvest * 8; // Average organic price
      
      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        expenses: monthExpenses,
        savings: monthSavings,
        net: monthSavings - monthExpenses
      };
    });

    return {
      totalExpenses,
      totalSavings,
      netProfit,
      roi,
      hourlyWage,
      totalHours,
      breakEvenPoint,
      expensesByCategory,
      monthlyData
    };
  }, [expenses, timeEntries, plants, producePricing]);

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
          <h1 className="text-3xl font-bold">Garden Economics</h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Garden Economics Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currency-select">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(currencies).map(([code, info]) => (
                        <SelectItem key={code} value={code}>
                          {info.symbol} {info.name} ({code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="metric-select">Measurement System</Label>
                  <Select value={metricSystem} onValueChange={(value) => setMetricSystem(value as 'metric' | 'imperial')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (kg, m²)</SelectItem>
                      <SelectItem value="imperial">Imperial (lbs, ft²)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Badge variant="outline" className="px-3 py-1">
            <Coins className="h-4 w-4 mr-2" />
            {currentSeason}
          </Badge>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialMetrics.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Across {expenses.length} purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Value Saved</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialMetrics.totalSavings)}</div>
            <p className="text-xs text-muted-foreground">
              Based on organic store prices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {financialMetrics.netProfit >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financialMetrics.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              ROI: {financialMetrics.roi.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hourly Wage</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialMetrics.hourlyWage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financialMetrics.hourlyWage)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialMetrics.totalHours} hours logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="pricing">Store Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={financialMetrics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                    <Area type="monotone" dataKey="savings" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={financialMetrics.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {financialMetrics.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Spent']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Garden Expenses</h3>
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Garden Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expense-name">Item Name</Label>
                    <Input
                      id="expense-name"
                      placeholder="e.g., Tomato Seeds"
                      value={newExpense.name || ''}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense-category">Category</Label>
                    <Select 
                      value={newExpense.category} 
                      onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expense-cost">Cost ({currencies[currency as keyof typeof currencies]?.symbol || '$'})</Label>
                        <Input
                          id="expense-cost"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newExpense.cost || ''}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, cost: Number(e.target.value) }))}
                        />
                    </div>
                    <div>
                      <Label htmlFor="expense-date">Date</Label>
                      <Input
                        id="expense-date"
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="expense-notes">Notes (optional)</Label>
                    <Input
                      id="expense-notes"
                      placeholder="Additional details..."
                      value={newExpense.notes || ''}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addExpense} className="flex-1">Add Expense</Button>
                    <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No expenses recorded. Add your first garden expense above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map(expense => {
                      const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                      return (
                        <TableRow key={expense.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{expense.name}</div>
                              {expense.notes && (
                                <div className="text-sm text-muted-foreground">{expense.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {category?.icon} {category?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(expense.cost)}</TableCell>
                          <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExpense(expense.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Time Tracking</h3>
            <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Time
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Garden Time</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="time-activity">Activity</Label>
                    <Input
                      id="time-activity"
                      placeholder="e.g., Planting, Watering, Harvesting"
                      value={newTimeEntry.activity || ''}
                      onChange={(e) => setNewTimeEntry(prev => ({ ...prev, activity: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time-hours">Hours</Label>
                      <Input
                        id="time-hours"
                        type="number"
                        step="0.25"
                        placeholder="2.5"
                        value={newTimeEntry.hours || ''}
                        onChange={(e) => setNewTimeEntry(prev => ({ ...prev, hours: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time-date">Date</Label>
                      <Input
                        id="time-date"
                        type="date"
                        value={newTimeEntry.date}
                        onChange={(e) => setNewTimeEntry(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addTimeEntry} className="flex-1">Log Time</Button>
                    <Button variant="outline" onClick={() => setTimeDialogOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No time entries recorded. Start tracking your garden work above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.activity}</TableCell>
                        <TableCell>{entry.hours} hrs</TableCell>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Store Price Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Set local store prices to calculate your savings accurately
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Produce Pricing (per {formatWeight(1).split(' ')[1]})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {producePricing.map((pricing, index) => (
                  <div key={pricing.plantType} className="grid grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                    <div className="font-medium">{pricing.plantType}</div>
                    <div>
                      <Label className="text-xs">Regular Store Price</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{currencies[currency as keyof typeof currencies]?.symbol || '$'}</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={pricing.storePrice}
                          onChange={(e) => {
                            const newPricing = [...producePricing];
                            newPricing[index].storePrice = Number(e.target.value);
                            setProducePricing(newPricing);
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">/{formatWeight(1).split(' ')[1]}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Organic Store Price</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{currencies[currency as keyof typeof currencies]?.symbol || '$'}</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={pricing.organicStorePrice}
                          onChange={(e) => {
                            const newPricing = [...producePricing];
                            newPricing[index].organicStorePrice = Number(e.target.value);
                            setProducePricing(newPricing);
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">/{formatWeight(1).split(' ')[1]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostAnalysis;