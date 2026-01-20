import { useEffect, useState } from 'react'
import {
    Users,
    MessageSquare,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import supabase from '@/utils/supabase'
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalTickets: 0,
        activeUsers: 0,
        resolvedRate: 0,
        ticketsByStatus: [] as { name: string; value: number }[],
        ticketsByPriority: [] as { priority: string; count: number }[]
    })

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            const { data, error } = await supabase.rpc('get_dashboard_stats')

            if (error) throw error

            const stats = data as any

            // Calculations
            const total = stats.total_tickets
            const resolved = stats.status_counts.resolved + stats.status_counts.closed
            const rate = total > 0 ? Math.round((resolved / total) * 100) : 0

            setStats({
                totalTickets: total,
                activeUsers: stats.active_users,
                resolvedRate: rate,
                ticketsByStatus: [
                    { name: 'Open', value: stats.status_counts.open },
                    { name: 'Resolved', value: stats.status_counts.resolved },
                    { name: 'Closed', value: stats.status_counts.closed }
                ],
                ticketsByPriority: [
                    { priority: 'High', count: stats.priority_counts.high },
                    { priority: 'Medium', count: stats.priority_counts.medium },
                    { priority: 'Low', count: stats.priority_counts.low }
                ]
            })

        } catch (error) {
            console.error(error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const COLORS = {
        open: '#3b82f6', // blue-500
        resolved: '#22c55e', // green-500
        closed: '#64748b', // slate-500
        priority: '#18181b' // zinc-900
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Overview</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Platform usage and support performance metrics.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={fetchDashboardData}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button size="sm" className="h-9">
                        Download Report
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Tickets"
                    value={stats.totalTickets}
                    icon={MessageSquare}
                    trend={12}
                    loading={loading}
                />
                <KPICard
                    title="Active Customers"
                    value={stats.activeUsers}
                    icon={Users}
                    trend={5}
                    loading={loading}
                />
                <KPICard
                    title="Resolution Rate"
                    value={`${stats.resolvedRate}%`}
                    icon={CheckCircle2}
                    trend={2}
                    loading={loading}
                />
                <KPICard
                    title="Avg Response Time"
                    value="2h 15m"
                    icon={Clock}
                    trend={-8}
                    inverseTrend
                    loading={loading}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Priority Chart */}
                <Card className="col-span-1 lg:col-span-2 shadow-none border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Ticket Volume by Priority</CardTitle>
                        <CardDescription>Distribution of incoming support requests</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        {loading ? (
                            <Skeleton className="h-[300px] w-full rounded-md" />
                        ) : (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.ticketsByPriority} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="priority"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                                            fontSize={12}
                                            stroke="#888888"
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                            fontSize={12}
                                            stroke="#888888"
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Chart */}
                <Card className="col-span-1 shadow-none border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Ticket Status</CardTitle>
                        <CardDescription>Current workload distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[250px] w-full rounded-full" />
                        ) : (
                            <div className="h-[250px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.ticketsByStatus}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell key="open" fill={COLORS.open} />
                                            <Cell key="resolved" fill={COLORS.resolved} />
                                            <Cell key="closed" fill={COLORS.closed} />
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                fontSize: '12px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats.totalTickets}</span>
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Total</span>
                                </div>
                            </div>
                        )}
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full" style={{ backgroundColor: COLORS.open }} />
                                    <span className="text-zinc-600 dark:text-zinc-400">Open</span>
                                </div>
                                <span className="font-medium">{stats.ticketsByStatus.find(s => s.name === 'Open')?.value || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full" style={{ backgroundColor: COLORS.resolved }} />
                                    <span className="text-zinc-600 dark:text-zinc-400">Resolved</span>
                                </div>
                                <span className="font-medium">{stats.ticketsByStatus.find(s => s.name === 'Resolved')?.value || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full" style={{ backgroundColor: COLORS.closed }} />
                                    <span className="text-zinc-600 dark:text-zinc-400">Closed</span>
                                </div>
                                <span className="font-medium">{stats.ticketsByStatus.find(s => s.name === 'Closed')?.value || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, trend, inverseTrend, loading }: any) {
    const isPositive = trend > 0
    const isGood = inverseTrend ? !isPositive : isPositive

    return (
        <Card className="shadow-none border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {title}
                </CardTitle>
                <Icon className="size-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ) : (
                    <>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</div>
                        <div className="flex items-center text-xs mt-1">
                            <span className={cn(
                                "flex items-center font-medium",
                                isGood ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                            )}>
                                {isPositive ? <ArrowUpRight className="mr-1 size-3" /> : <ArrowDownRight className="mr-1 size-3" />}
                                {Math.abs(trend)}%
                            </span>
                            <span className="text-zinc-500 ml-1">vs last month</span>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
