import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase'
import type { Profile } from '@/types/supabase'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    MoreHorizontal,
    Users
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminCustomers() {
    const navigate = useNavigate()
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'customer')
                .order('created_at', { ascending: false })

            if (error) throw error

            setUsers(data as Profile[])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.includes(searchQuery)
    )

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Customers</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage your customer base.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchUsers()} className="h-9">
                        Refresh
                    </Button>

                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                        placeholder="Search customers..."
                        className="pl-9 h-9 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-900"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/80">
                            <TableHead className="w-[400px] font-medium text-xs uppercase tracking-wider text-zinc-500">Customer</TableHead>
                            <TableHead className="font-medium text-xs uppercase tracking-wider text-zinc-500">Email</TableHead>
                            <TableHead className="font-medium text-xs uppercase tracking-wider text-zinc-500">Role</TableHead>
                            <TableHead className="font-medium text-xs uppercase tracking-wider text-zinc-500">Joined</TableHead>
                            <TableHead className="text-right font-medium text-xs uppercase tracking-wider text-zinc-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-9 w-9 rounded-full" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-zinc-500">
                                        <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-full mb-3">
                                            <Users className="size-6 text-zinc-400" />
                                        </div>
                                        <p className="font-medium text-zinc-900 dark:text-zinc-50">No customers found</p>
                                        <p className="text-sm mt-1">Try adjusting your search query.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-zinc-100 dark:border-zinc-800/50"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-700">
                                                <AvatarImage src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${user.email}`} />
                                                <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                                                    {user.email?.split('@')[0] || 'No Name'}
                                                </span>
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    {user.id.slice(0, 8)}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                                            {user.email}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-zinc-500">
                                        {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'N/A'}
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
                                                <DropdownMenuItem onClick={() => navigate(`/admin/customers/${user.id}`)}>
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate(`/admin/tickets?userId=${user.id}`)}>
                                                    View Tickets
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="text-xs text-zinc-500">
                    Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> customers
                </div>
            </div>
        </div>
    )
}
