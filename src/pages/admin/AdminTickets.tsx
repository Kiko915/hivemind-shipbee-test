import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase'
import type { Ticket, Profile } from '@/types/supabase'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter, Loader2, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type TicketWithUser = Ticket & {
    profiles: Profile
}

export default function AdminTickets() {
    const [tickets, setTickets] = useState<TicketWithUser[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        setLoading(true)
        try {
            // Include profiles data
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    profiles (email, role)
                `)
                .order('updated_at', { ascending: false })

            if (error) throw error

            setTickets(data as unknown as TicketWithUser[])
        } catch (error) {
            console.error('Error fetching tickets:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredTickets = tickets.filter(ticket => {
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
        const matchesSearch =
            ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.includes(searchQuery)

        return matchesStatus && matchesSearch
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-500 hover:bg-blue-600'
            case 'resolved': return 'bg-green-500 hover:bg-green-600'
            case 'closed': return 'bg-zinc-500 hover:bg-zinc-600'
            default: return 'bg-zinc-500'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20'
            case 'medium': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/20'
            case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/20'
            default: return 'text-zinc-600 bg-zinc-50'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">All Tickets</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage and respond to customer inquiries.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchTickets()}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                    <Input
                        placeholder="Search by subject, email, or ID..."
                        className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <div className="flex items-center gap-2">
                            <Filter className="size-4 text-zinc-400" />
                            <SelectValue placeholder="Filter by status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50/50">
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="size-4 animate-spin" />
                                        Loading tickets...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    No tickets found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <TableRow key={ticket.id} className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        #{ticket.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {ticket.subject || 'No Subject'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{ticket.profiles?.email || 'Unknown User'}</span>
                                            <span className="text-xs text-muted-foreground">Customer</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${getStatusColor(ticket.status)} border-transparent font-medium shadow-none uppercase text-[10px]`}>
                                            {ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="size-4 text-zinc-400" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-muted-foreground text-center">
                Showing {filteredTickets.length} tickets
            </div>
        </div>
    )
}
