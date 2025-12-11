"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Star, 
  AlertCircle,
  RefreshCw,
  Sun,
  Moon,
  Zap,
  Target,
  ListChecks,
  Battery,
  Brain,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DailyPlanResponse, DailyPlan, toggleTaskCompletion, generateMissingPlans, getDailyPlan, getAvailableDates } from '@/lib/api';

interface DailyPlannerClientProps {
  initialPlanResponse: DailyPlanResponse | null;
  availableDates: any;
  initialSelectedDate: string;
}

export function DailyPlannerClient({ initialPlanResponse, availableDates, initialSelectedDate }: DailyPlannerClientProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<DailyPlan | null>(initialPlanResponse?.plan || null);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [dates, setDates] = useState(availableDates);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        console.log('[Dashboard] Fetching initial data...');
        
        // First get available dates to see what data we have
        const datesData = await getAvailableDates();
        console.log('[Dashboard] Dates data:', datesData);
        console.log('[Dashboard] Available dates array:', datesData?.dailyPlanDates);
        console.log('[Dashboard] Needs generation:', datesData?.needsGeneration);
        setDates(datesData);
        
        // If no dates data, stop here
        if (!datesData || !datesData.dailyPlanDates) {
          console.error('[Dashboard] No dates data received from backend');
          setIsLoading(false);
          return;
        }
        
        // Determine which date to load
        let dateToLoad = selectedDate;
        
        // If today has no plan but there are other dates available, use the most recent
        if (datesData.dailyPlanDates.length > 0) {
          const latestDate = datesData.dailyPlanDates[datesData.dailyPlanDates.length - 1];
          
          // Check if today's date is in the available dates
          const todayHasPlan = datesData.dailyPlanDates.includes(selectedDate);
          
          if (!todayHasPlan) {
            console.log('[Dashboard] No plan for today, showing most recent date:', latestDate);
            dateToLoad = latestDate;
            setSelectedDate(latestDate);
          }
        }
        
        // Load the plan for the determined date
        console.log('[Dashboard] Loading plan for date:', dateToLoad);
        const planResponse = await getDailyPlan(dateToLoad);
        console.log('[Dashboard] Plan response:', planResponse);
        
        if (planResponse?.exists && planResponse.plan) {
          setCurrentPlan(planResponse.plan);
        } else {
          console.log('[Dashboard] No plan available for date:', dateToLoad);
          setCurrentPlan(null);
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInitialData();
  }, []);

  const handleGenerateMissingPlans = async () => {
    if (!dates?.needsGeneration) {
      alert('All daily plans are up to date! No generation needed.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMissingPlans();

      if (result?.ok) {
        alert(`Successfully generated ${result.generated?.length || 0} daily plan(s)!`);
        router.refresh();
      } else {
        console.error('Failed to generate plans');
        alert('Failed to generate plans. Please try again.');
      }
    } catch (error) {
      console.error('Error generating plans:', error);
      alert('Error generating plans. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateTodayPlan = async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const response = await fetch(`/api/generate-plan?date=${today}`, {
        method: 'POST',
        cache: 'no-cache',
      });

      if (response.ok) {
        alert('Today\'s plan has been regenerated with latest context!');
        if (selectedDate === today) {
          const planResponse = await getDailyPlan(today);
          setCurrentPlan(planResponse?.plan || null);
        }
        router.refresh();
      } else {
        console.error('Failed to regenerate today\'s plan');
        alert('Failed to regenerate today\'s plan. Please try again.');
      }
    } catch (error) {
      console.error('Error regenerating today\'s plan:', error);
      alert('Error regenerating today\'s plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    try {
      const planResponse = await getDailyPlan(newDate);
      setCurrentPlan(planResponse?.plan || null);
    } catch (error) {
      console.error('Error loading plan for date:', error);
    }
  };

  const handlePreviousDate = () => {
    const currentIndex = dates?.dailyPlanDates?.indexOf(selectedDate) ?? -1;
    if (currentIndex > 0) {
      handleDateChange(dates.dailyPlanDates[currentIndex - 1]);
    }
  };

  const handleNextDate = () => {
    const currentIndex = dates?.dailyPlanDates?.indexOf(selectedDate) ?? -1;
    if (currentIndex !== -1 && currentIndex < (dates?.dailyPlanDates?.length - 1)) {
      handleDateChange(dates.dailyPlanDates[currentIndex + 1]);
    }
  };

  const handleToggleTask = async (taskNumber: number, currentCompleted: boolean) => {
    if (!currentPlan) return;

    const newCompleted = !currentCompleted;
    
    try {
      setCurrentPlan(prevPlan => {
        if (!prevPlan) return prevPlan;
        
        return {
          ...prevPlan,
          focusTasks: prevPlan.focusTasks.map(task =>
            task.taskNumber === taskNumber ? { ...task, completed: newCompleted } : task
          ),
          otherTasks: prevPlan.otherTasks.map(task =>
            task.taskNumber === taskNumber ? { ...task, completed: newCompleted } : task
          ),
        };
      });

      const updatedPlan = await toggleTaskCompletion(taskNumber, newCompleted, currentPlan.date);
      
      if (updatedPlan) {
        setCurrentPlan(updatedPlan);
      } else {
        setCurrentPlan(prevPlan => {
          if (!prevPlan) return prevPlan;
          
          return {
            ...prevPlan,
            focusTasks: prevPlan.focusTasks.map(task =>
              task.taskNumber === taskNumber ? { ...task, completed: currentCompleted } : task
            ),
            otherTasks: prevPlan.otherTasks.map(task =>
              task.taskNumber === taskNumber ? { ...task, completed: currentCompleted } : task
            ),
          };
        });
        console.error('Failed to update task completion');
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      setCurrentPlan(prevPlan => {
        if (!prevPlan) return prevPlan;
        
        return {
          ...prevPlan,
          focusTasks: prevPlan.focusTasks.map(task =>
            task.taskNumber === taskNumber ? { ...task, completed: currentCompleted } : task
          ),
          otherTasks: prevPlan.otherTasks.map(task =>
            task.taskNumber === taskNumber ? { ...task, completed: currentCompleted } : task
          ),
        };
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-lg">Loading your daily plan...</p>
        </div>
      </div>
    );
  }

  const dateStr = formatDate(selectedDate);
  const currentIndex = dates?.dailyPlanDates?.indexOf(selectedDate) ?? -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < (dates?.dailyPlanDates?.length - 1);

  // Handle no plan case
  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-3">
              <Calendar className="h-8 w-8 text-blue-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Daily Planner
              </h1>
            </div>
            <p className="text-slate-400 text-lg">{dateStr}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto space-y-4"
          >
            {dates?.needsGeneration ? (
              <Alert variant="warning" className="border-yellow-500/30 bg-yellow-500/5">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg">Daily Plans Need Generation</AlertTitle>
                <AlertDescription className="mt-2 text-base space-y-2">
                  <p>You have <strong>{dates.missingDailyPlans.length} day(s)</strong> with processed data but no daily plan:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dates.missingDailyPlans.map((date: string) => (
                      <Badge key={date} variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        {date}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2">Click the button below to generate plans for all missing dates.</p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-500/30 bg-green-500/5">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <AlertTitle className="text-lg text-green-300">All Plans Up to Date</AlertTitle>
                <AlertDescription className="mt-2 text-base text-green-200">
                  All available daily plans have been generated. You have <strong>{dates?.dailyPlanDates?.length || 0} daily plan(s)</strong> ready to view.
                </AlertDescription>
              </Alert>
            )}

            {dates?.dailyPlanDates && dates.dailyPlanDates.length > 0 && (
              <div className="text-center text-slate-400">
                <p>Available dates: {dates.dailyPlanDates.join(', ')}</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            {dates?.needsGeneration ? (
              <Button
                onClick={handleGenerateMissingPlans}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Generating Plans...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Missing Plans ({dates.missingDailyPlans.length})
                  </>
                )}
              </Button>
            ) : dates?.dailyPlanDates && dates.dailyPlanDates.length > 0 ? (
              <Button
                onClick={() => handleDateChange(dates.dailyPlanDates[dates.dailyPlanDates.length - 1])}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Calendar className="mr-2 h-5 w-5" />
                View Latest Plan ({dates.dailyPlanDates[dates.dailyPlanDates.length - 1]})
              </Button>
            ) : null}
          </motion.div>
        </div>
      </div>
    );
  }

  const plan = currentPlan!;

  const dayStats = [
    { icon: Battery, label: 'Energy Level', value: 'High', color: 'from-green-500 to-emerald-500', emoji: '🌤️' },
    { icon: CheckCircle2, label: 'Completed Today', value: '8/12', color: 'from-blue-500 to-cyan-500', emoji: '📊' },
    { icon: Brain, label: 'Focus Time', value: '9-11 AM', color: 'from-purple-500 to-pink-500', emoji: '⚡' }
  ];

  const priorityColors = ['border-blue-500', 'border-purple-500', 'border-cyan-500', 'border-pink-500', 'border-green-500'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Calendar className="h-8 w-8 text-blue-400" />
                  <div className="absolute inset-0 blur-xl bg-blue-400/50 -z-10" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Daily Planner
                </h1>
              </div>
              <p className="text-slate-400 text-lg">{dateStr}</p>
            </div>

            <div className="flex gap-3">
              {dates?.needsGeneration && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-300" />
                  <Button
                    onClick={handleGenerateMissingPlans}
                    disabled={isGenerating}
                    className="relative bg-slate-900/80 hover:bg-slate-800/80 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-300 hover:text-yellow-200 rounded-xl backdrop-blur-xl shadow-lg hover:shadow-yellow-500/30 transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate {dates.missingDailyPlans.length} Missing Plan{dates.missingDailyPlans.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {(() => {
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const isViewingToday = selectedDate === today;
                
                if (isViewingToday && currentPlan) {
                  return (
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-300" />
                      <Button
                        onClick={handleRegenerateTodayPlan}
                        disabled={isGenerating}
                        className="relative bg-slate-900/80 hover:bg-slate-800/80 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 rounded-xl backdrop-blur-xl shadow-lg hover:shadow-purple-500/30 transition-all"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                            Regenerate Today's Plan
                          </>
                        )}
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {dates?.dailyPlanDates && dates.dailyPlanDates.length > 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={handlePreviousDate}
                  disabled={!hasPrevious}
                  variant="ghost"
                  className="text-slate-400 hover:text-slate-200 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {selectedDate}
                  </Badge>
                  <span className="text-slate-500 text-sm">
                    ({currentIndex + 1} of {dates.dailyPlanDates.length})
                  </span>
                </div>

                <Button
                  onClick={handleNextDate}
                  disabled={!hasNext}
                  variant="ghost"
                  className="text-slate-400 hover:text-slate-200 disabled:opacity-30"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </div>

              {(() => {
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const isViewingToday = selectedDate === today;
                
                if (isViewingToday) {
                  return (
                    <div className="text-center">
                      <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <span>Viewing today's plan - Use "Regenerate Today's Plan" to update with latest context</span>
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {dayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="relative p-4 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 backdrop-blur-xl hover:border-slate-600 transition-all group overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className="relative flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">{stat.emoji} {stat.label}</p>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Day Summary Card - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative group"
        >
          {/* Holographic border effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
          
          <Card className="relative rounded-3xl border-slate-700/50 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative">
              <div className="flex items-center gap-3">
                {/* Icon with glow */}
                <div className="relative">
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                  <div className="absolute inset-0 blur-lg bg-yellow-400/50" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Day Summary
                </h2>
              </div>
              {/* Divider line */}
              <div className="h-0.5 w-full bg-gradient-to-r from-yellow-500/20 via-purple-500/20 to-pink-500/20 mt-3" />
            </CardHeader>
            <CardContent className="relative">
              <p className="text-slate-300 text-lg leading-relaxed">
                {plan.daySummary}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Focus Tasks Card - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          {/* Neon border effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-3xl opacity-30 group-hover:opacity-50 blur transition duration-500" />
          
          <Card className="relative rounded-3xl border-blue-500/30 bg-gradient-to-br from-blue-950/60 to-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Icon with glow */}
                  <div className="relative">
                    <Target className="h-6 w-6 text-blue-400" />
                    <div className="absolute inset-0 blur-lg bg-blue-400/50" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Focus Tasks
                  </h2>
                </div>
                <Badge variant="info" className="rounded-full px-3 bg-blue-500/20 border-blue-400/30">
                  {plan.focusTasks.length} tasks
                </Badge>
              </div>
              {/* Divider line */}
              <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 mt-3" />
            </CardHeader>
            
            <CardContent className="space-y-4 relative">
              {plan.focusTasks.map((task, index) => {
                const isCompleted = task.completed || false;
                return (
                  <motion.div
                    key={task.taskNumber}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="group/item relative"
                  >
                    {/* Colored side bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${priorityColors[index % priorityColors.length]}`} />
                    
                    {/* Glassmorphic card */}
                    <div className={`pl-5 p-5 rounded-2xl bg-gradient-to-r from-slate-800/40 to-slate-900/40 backdrop-blur-md border border-slate-700/30 hover:border-blue-400/50 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 ${isCompleted ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleTask(task.taskNumber, isCompleted)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-2 transition-all duration-200 ${
                            isCompleted
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-slate-500 hover:border-blue-400'
                          }`}
                        >
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-lg">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <h3 className={`font-semibold text-lg group-hover/item:text-blue-300 transition-all ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                            {task.title}
                          </h3>
                          <p className={`text-sm leading-relaxed transition-all ${isCompleted ? 'line-through text-slate-500' : 'text-slate-400'}`}>
                            {task.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Other Tasks Card - Enhanced */}
        {plan.otherTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            {/* Subtle holographic border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 rounded-3xl opacity-10 group-hover:opacity-20 blur transition duration-500" />
            
            <Card className="relative rounded-3xl border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 to-slate-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardHeader className="pb-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Icon with glow */}
                    <div className="relative">
                      <ListChecks className="h-6 w-6 text-slate-400" />
                      <div className="absolute inset-0 blur-lg bg-slate-400/30" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">
                      Other Tasks
                    </h2>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 bg-slate-700/30 border-slate-600/30">
                    {plan.otherTasks.length} tasks
                  </Badge>
                </div>
                {/* Divider line */}
                <div className="h-0.5 w-full bg-gradient-to-r from-slate-600/20 to-slate-700/20 mt-3" />
              </CardHeader>
              
              <CardContent className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.otherTasks.map((task, index) => {
                    const isCompleted = task.completed || false;
                    return (
                      <motion.div
                        key={task.taskNumber}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.02 }}
                        className="relative group/task"
                      >
                        {/* Colored side bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${priorityColors[index % priorityColors.length]}`} />
                        
                        {/* Glassmorphic card */}
                        <div className={`pl-4 p-4 rounded-2xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 hover:border-slate-600 hover:scale-[1.02] transition-all duration-300 hover:bg-slate-800/60 ${isCompleted ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleToggleTask(task.taskNumber, isCompleted)}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                isCompleted
                                  ? 'bg-slate-500 border-slate-500'
                                  : 'border-slate-500 hover:border-slate-400'
                              }`}
                            >
                              {isCompleted && (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              )}
                            </button>
                            
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 text-xs font-semibold shadow-md">
                              {index + 1}
                            </div>
                            <span className={`text-sm font-medium group-hover/task:text-white transition-all ${isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task.title}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bottom Grid: Reminders & Schedule - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reminders - Enhanced */}
          {plan.reminders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl opacity-20 group-hover:opacity-30 blur transition duration-500" />
              
              <Card className="relative rounded-3xl border-orange-500/30 bg-gradient-to-br from-orange-950/40 to-slate-900/95 backdrop-blur-xl shadow-xl h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="pb-4 relative">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <AlertCircle className="h-6 w-6 text-orange-400" />
                      <div className="absolute inset-0 blur-lg bg-orange-400/50" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                      Reminders
                    </h2>
                  </div>
                  <div className="h-0.5 w-full bg-gradient-to-r from-orange-500/30 to-red-500/30 mt-3" />
                </CardHeader>
                
                <CardContent className="space-y-3 relative">
                  {plan.reminders.map((reminder, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="relative group/reminder"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-orange-500" />
                      <div className="pl-4 p-4 rounded-2xl bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 hover:bg-orange-500/15 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0 animate-pulse" />
                          <span className="text-slate-300 text-sm leading-relaxed">{reminder}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Schedule Suggestions - Enhanced */}
          {plan.scheduleSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl opacity-20 group-hover:opacity-30 blur transition duration-500" />
              
              <Card className="relative rounded-3xl border-green-500/30 bg-gradient-to-br from-green-950/40 to-slate-900/95 backdrop-blur-xl shadow-xl h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="pb-4 relative">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Clock className="h-6 w-6 text-green-400" />
                      <div className="absolute inset-0 blur-lg bg-green-400/50" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      Schedule Suggestions
                    </h2>
                  </div>
                  <div className="h-0.5 w-full bg-gradient-to-r from-green-500/30 to-emerald-500/30 mt-3" />
                </CardHeader>
                
                <CardContent className="space-y-3 relative">
                  {plan.scheduleSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.timeOfDay.toLowerCase().includes('morning') 
                      ? Sun 
                      : suggestion.timeOfDay.toLowerCase().includes('afternoon')
                      ? Zap
                      : Moon;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="relative group/schedule"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-green-500" />
                        <div className="pl-4 p-4 rounded-2xl bg-green-500/10 backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 hover:bg-green-500/15 transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-5 w-5 text-green-400" />
                            <span className="text-green-300 text-sm font-semibold">
                              {suggestion.timeOfDay}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm ml-7 leading-relaxed">
                            {suggestion.suggestion}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Stats Footer - Enhanced */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative group"
        >
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/30 hover:border-slate-600 transition-all">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Total Tasks:</span>
                <span className="text-white font-bold text-lg">{plan.totalTasks}</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-slate-500">Focus:</span>
                <span className="text-blue-400 font-bold text-lg">{plan.focusTasks.length}</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Other:</span>
                <span className="text-slate-300 font-bold text-lg">{plan.otherTasks.length}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
