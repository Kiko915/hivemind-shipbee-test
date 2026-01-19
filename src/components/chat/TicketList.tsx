import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase'
import type { Ticket } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Plus, MessageCircle, AlertCircle } from 'lucide-react'

interface TicketListProps {
    onSelectTicket: (ticketId: string) => void
    onNewTicket: () => void
}

export default function TicketList({
    onSelectTicket,
    onNewTicket,
}: TicketListProps) {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return

            const { data, error } = await supabase
                .from('tickets')
                .select('*')
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-lg">Your Tickets</h2>
                <Button size="sm" onClick={onNewTicket} className="gap-1">
                    <Plus className="size-4" />
                    New
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-32 text-destructive text-center p-4">
                        <AlertCircle className="size-8 mb-2" />
                        <p className="text-sm">{error}</p>
                        <Button
                            variant="link"
                            onClick={() => {
                                setLoading(true)
                                setError(null)
                                fetchTickets()
                            }}
                        >
                            Try Again
                        </Button>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                        <MessageCircle className="size-12 mb-3 opacity-20" />
                        <p className="text-sm">No tickets yet.</p>
                        <p className="text-xs">Start a conversation to get help!</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <button
                            key={ticket.id}
                            onClick={() => onSelectTicket(ticket.id)}
                            className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium truncate pr-2 text-sm">
                                    {ticket.subject}
                                </span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold ${ticket.status === 'open'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                                        : ticket.status === 'resolved'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200'
                                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                        }`}
                                >
                                    {ticket.status}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                ID: {ticket.id.slice(0, 8)}...
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-2">
                                Last updated: {new Date(ticket.updated_at).toLocaleDateString()}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
