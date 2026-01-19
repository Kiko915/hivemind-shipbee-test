import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase'
import type { Ticket } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, MessageCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TicketListProps {
    onSelectTicket: (ticketId: string) => void
    onNewTicket: () => void
}

export default function TicketList({
    onSelectTicket,
    onNewTicket,
}: TicketListProps) {
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return
            setCurrentUserId(user.id)

            const { data, error } = await supabase
                .from('tickets')
                .select('*, messages(sender_id, created_at)')
                .eq('customer_id', user.id)
                .order('updated_at', { ascending: false })

            if (error) throw error
            setTickets(data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Loading skeleton...
    if (loading) {
        return (
            <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
                <div className="flex items-center justify-between p-6 pb-2">
                    <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 font-sans">
            {/* Minimal Header */}
            <div className="flex flex-col p-6 pb-2 bg-zinc-50 dark:bg-zinc-950 z-10">
                <h2 className="font-semibold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">Inbox</h2>
                <p className="text-xs text-muted-foreground mt-1">Your recent support conversations</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scroller">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-48 text-destructive text-center p-6 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 mx-2">
                        <AlertCircle className="size-6 mb-2" />
                        <p className="text-xs font-medium">{error}</p>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                                setLoading(true)
                                setError(null)
                                fetchTickets()
                            }}
                            className="mt-1 h-auto p-0 text-red-600 dark:text-red-400"
                        >
                            Tap to retry
                        </Button>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60%] text-center px-6">
                        <div className="size-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-sm mb-4 transform rotate-3">
                            <MessageCircle className="size-8 text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No messages yet</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
                            Start a new conversation to get help from our team.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 pt-2">
                        {tickets.map((ticket) => {
                            // Unread Logic
                            const lastMsg = ticket.messages?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                            const lastReadStr = localStorage.getItem(`hivemind_last_read_${ticket.id}`)
                            const isUnread = lastMsg
                                && lastMsg.sender_id !== currentUserId
                                && (!lastReadStr || new Date(lastMsg.created_at).getTime() > new Date(lastReadStr).getTime())

                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => onSelectTicket(ticket.id)}
                                    className="w-full text-left p-4 rounded-xl bg-white dark:bg-zinc-900 hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:shadow-md border border-zinc-100 dark:border-zinc-900 dark:hover:border-zinc-800 transition-all duration-200 group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn(
                                            "font-medium truncate pr-4 text-sm text-zinc-900 dark:text-zinc-100 transition-colors group-hover:text-primary flex items-center gap-2",
                                            ticket.status === 'open' ? "font-semibold" : ""
                                        )}>
                                            {isUnread && (
                                                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                                            )}
                                            {ticket.subject}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "uppercase text-[10px] h-5 px-1.5 tracking-wider font-semibold border-none",
                                                ticket.status === 'open'
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                            )}
                                        >
                                            {ticket.status}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <Clock className="size-3" />
                                            <span>
                                                {new Date(ticket.updated_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                            <span className="font-mono opacity-80">#{ticket.id.slice(0, 5)}</span>
                                        </div>

                                        <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-700 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Fixed Bottom Action */}
            <div className="p-4 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-900 sticky bottom-0 z-20">
                <Button
                    onClick={onNewTicket}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium"
                >
                    <Plus className="size-4 mr-2" />
                    Start New Conversation
                </Button>
            </div>
        </div>
    )
}
