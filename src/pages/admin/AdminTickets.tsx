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
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    Search,
    MoreHorizontal,
    ArrowUpRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from '@/components/ui/skeleton'

type TicketWithUser = Ticket & {
    profiles: Profile
}

export default function AdminTickets() {
    const [tickets, setTickets] = useState<TicketWithUser[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setCurrentUserId(user.id)

            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    profiles (email, role),
                    messages (sender_id, created_at)
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
        const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
        const matchesSearch =
            ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.includes(searchQuery)

        return matchesStatus && matchesPriority && matchesSearch
    })

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
            case 'resolved': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
            case 'closed': return 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
            default: return 'bg-zinc-100 text-zinc-700 border-zinc-200'
        }
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high': return <span className="size-2 rounded-full bg-red-500 mr-2" />
            case 'medium': return <span className="size-2 rounded-full bg-orange-400 mr-2" />
            case 'low': return <span className="size-2 rounded-full bg-blue-400 mr-2" />
            default: return null
        }
    }

    const updateTicketStatus = async (ticketId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('tickets')
                .update({ status: newStatus })
                .eq('id', ticketId)

            if (error) throw error

            setTickets(tickets.map(t =>
                t.id === ticketId ? { ...t, status: newStatus as any } : t
            ))
            toast.success('Status updated')
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Failed to update status')
        }
    }

    const updateTicketPriority = async (ticketId: string, newPriority: string) => {
        try {
            const { error } = await supabase
                .from('tickets')
                .update({ priority: newPriority })
                .eq('id', ticketId)

            if (error) throw error

            setTickets(tickets.map(t =>
                t.id === ticketId ? { ...t, priority: newPriority as any } : t
            ))
            toast.success('Priority updated')
        } catch (error) {
            console.error('Error updating priority:', error)
            toast.error('Failed to update priority')
        }
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">All Tickets</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        View and manage customer support requests.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchTickets()} className="h-9">
                        Refresh
                    </Button>
                    <Button size="sm" className="h-9 gap-2">
                        <ArrowUpRight className="size-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                        placeholder="Search tickets..."
                        className="pl-9 h-9 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-900"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 w-[130px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="h-9 w-[130px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/80">
                            <TableHead className="w-[100px] font-medium text-xs uppercase tracking-wider text-zinc-500">ID</TableHead>
                            <TableHead className="w-[400px] font-medium text-xs uppercase tracking-wider text-zinc-500">Subject</TableHead>
                            <TableHead className="font-medium text-xs uppercase tracking-wider text-zinc-500">Customer</TableHead>
                            <TableHead className="font-medium text-xs uppercase tracking-wider text-zinc-500">Status</TableHead>
                            <TableHead className="font-medium text-xs uppercase tracking-wider text-zinc-500">Priority</TableHead>
                            <TableHead className="font-medium text-xs uppercase tracking-wider text-zinc-500">Updated</TableHead>
                            <TableHead className="text-right font-medium text-xs uppercase tracking-wider text-zinc-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredTickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-zinc-500">
                                        <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-full mb-3">
                                            <Search className="size-6 text-zinc-400" />
                                        </div>
                                        <p className="font-medium text-zinc-900 dark:text-zinc-50">No tickets found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => {
                                                setStatusFilter('all')
                                                setPriorityFilter('all')
                                                setSearchQuery('')
                                            }}
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTickets.map((ticket) => {
                                // Unread Logic
                                const lastMsg = ticket.messages?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                                const lastReadStr = localStorage.getItem(`hivemind_admin_last_read_${ticket.id}`)
                                const isUnread = lastMsg
                                    && lastMsg.sender_id !== currentUserId
                                    && (!lastReadStr || new Date(lastMsg.created_at).getTime() > new Date(lastReadStr).getTime())

                                return (
                                    <TableRow
                                        key={ticket.id}
                                        onClick={() => window.location.assign(`/admin/tickets/${ticket.id}`)}
                                        className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-zinc-100 dark:border-zinc-800/50 cursor-pointer"
                                    >
                                        <TableCell className="font-mono text-xs text-zinc-500">
                                            #{ticket.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col relative">
                                                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                                    {isUnread && (
                                                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                                                    )}
                                                    {ticket.subject}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                        {ticket.profiles?.email?.[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                                    {ticket.profiles?.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div onClick={(e) => e.stopPropagation()} className="w-[110px]">
                                                <Select
                                                    defaultValue={ticket.status}
                                                    onValueChange={(val) => updateTicketStatus(ticket.id, val)}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-7 text-xs border-0 shadow-none font-medium px-2 py-0 h-auto min-h-[24px]",
                                                        getStatusStyles(ticket.status)
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="open">Open</SelectItem>
                                                        <SelectItem value="resolved">Resolved</SelectItem>
                                                        <SelectItem value="closed">Closed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div onClick={(e) => e.stopPropagation()} className="w-[110px]">
                                                <Select
                                                    defaultValue={ticket.priority}
                                                    onValueChange={(val) => updateTicketPriority(ticket.id, val)}
                                                >
                                                    <SelectTrigger className="h-7 text-xs border-0 shadow-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2">
                                                        <div className="flex items-center gap-2">
                                                            {getPriorityIcon(ticket.priority)}
                                                            <SelectValue />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="high">High</SelectItem>
                                                        <SelectItem value="medium">Medium</SelectItem>
                                                        <SelectItem value="low">Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-500">
                                            {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600">Delete Ticket</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="text-xs text-zinc-500">
                    Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> tickets
                </div>
                {/* Pagination placeholder */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                        &lt;
                    </Button>
                    <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                        &gt;
                    </Button>
                </div>
            </div>
        </div>
    )
}
