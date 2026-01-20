import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import supabase from '@/utils/supabase'
import type { Profile, Ticket } from '@/types/supabase'
import {
    ArrowLeft,
    Mail,
    Calendar,
    Shield,
    MessageSquare,
    ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow, format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default function AdminCustomerDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) fetchCustomerData(id)
    }, [id])

    const fetchCustomerData = async (userId: string) => {
        setLoading(true)
        try {
            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileError) throw profileError
            setProfile(profileData)

            // Fetch Recent Tickets
            const { data: ticketsData, error: ticketsError } = await supabase
                .from('tickets')
                .select('*')
                .eq('customer_id', userId)
                .order('created_at', { ascending: false })
                .limit(5)

            if (ticketsError) throw ticketsError
            setTickets(ticketsData)

        } catch (error) {
            console.error('Error fetching customer details:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Customer Not Found</h2>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/customers')}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Customers
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/customers')}>
                    <ArrowLeft className="size-5 text-zinc-500" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Customer Details</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="md:col-span-1 shadow-none border-zinc-200 dark:border-zinc-800 h-fit">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-4">
                            <Avatar className="h-24 w-24 border-4 border-zinc-100 dark:border-zinc-800">
                                <AvatarImage src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${profile.email}`} />
                                <AvatarFallback className="text-2xl">{profile.email?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle className="text-lg text-wrap break-all">{profile.email}</CardTitle>
                        <CardDescription className="text-xs font-mono text-zinc-400">
                            ID: {profile.id}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <Mail className="size-4 shrink-0" />
                            <span className="truncate">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <Shield className="size-4 shrink-0" />
                            <span className="capitalize">{profile.role}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <Calendar className="size-4 shrink-0" />
                            <span>Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity / Tickets */}
                <Card className="md:col-span-2 shadow-none border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base">Recent Tickets</CardTitle>
                            <CardDescription>Latest support requests from this customer</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/tickets?userId=${profile.id}`)}>
                            View All <ExternalLink className="ml-2 size-3" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {tickets.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                                <MessageSquare className="size-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                                <p>No tickets found for this customer.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                                        className="flex items-start justify-between p-4 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                                                    {ticket.subject}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase font-normal text-zinc-500">
                                                    {ticket.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-zinc-500 w-full sm:w-auto truncate max-w-[300px]">
                                                Ticket #{ticket.id.slice(0, 8)}
                                            </p>
                                        </div>
                                        <div className="text-xs text-zinc-400 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
