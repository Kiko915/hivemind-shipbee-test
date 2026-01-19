import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase'
import type { Ticket } from '@/types/supabase'

import { ArrowRight, MessageCircle, Loader2, Sparkles } from 'lucide-react'

interface HomeViewProps {
    onNavigate: (view: 'list' | 'new' | 'chat', ticketId?: string) => void
}

export default function HomeView({ onNavigate }: HomeViewProps) {
    const [recentTicket, setRecentTicket] = useState<Ticket | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRecentTicket()
    }, [])

    const fetchRecentTicket = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('tickets')
                .select('*')
                .eq('customer_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            setRecentTicket(data)
        } catch (error) {
            console.error('Error fetching recent ticket:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            {/* Branding Header */}
            <div className="p-6 pb-2 pt-10">
                <div className="mb-6">
                    <img src="/hivemind_blue.png" alt="HiveMind" className="size-15 object-contain mb-4" />
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Hello there.
                        <br />
                        <span className="text-zinc-500 dark:text-zinc-400">How can we help?</span>
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
                {/* Recent Message Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => recentTicket ? onNavigate('chat', recentTicket.id) : onNavigate('new')}
                >
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            {recentTicket ? 'Recent message' : 'Start a conversation'}
                        </span>
                        {recentTicket && (
                            <span className="text-xs text-zinc-400">
                                {new Date(recentTicket.updated_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="h-12 flex items-center">
                            <Loader2 className="animate-spin size-5 text-muted-foreground" />
                        </div>
                    ) : recentTicket ? (
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg shrink-0">
                                <img src="/hivemind_blue.png" className="size-6 object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm mb-0.5 truncate">{recentTicket.subject}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                    {/* We could fetch the last message here, but for now showing status is okay, or just generic text */}
                                    Click to continue your conversation.
                                </p>
                            </div>
                            <ArrowRight className="size-4 text-zinc-400 self-center" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full">
                                <MessageCircle className="size-5 text-zinc-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Send us a message</h3>
                                <p className="text-xs text-muted-foreground">We typically reply in a few minutes.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Promo / Placeholder Card */}
                <div className="relative overflow-hidden rounded-xl bg-primary text-white p-5 h-40 flex flex-col justify-between shadow-md group cursor-pointer border border-zinc-800 dark:border-zinc-700">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <img src="/hivemind_blue.png" alt="HiveMind" className="size-24 object-contain grayscale invert" />
                    </div>

                    <div className="relative z-10 flex items-center gap-2">
                        <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
                            <Sparkles className="size-4 text-blue-300" />
                        </div>
                        <span className="text-xs font-medium text-blue-200 uppercase tracking-widest">HiveMind</span>
                    </div>

                    <div className="relative z-10">
                        <h3 className="font-bold text-lg leading-tight mb-1">Instant Answers,<br />Always Available.</h3>
                        <p className="text-xs text-zinc-400">
                            Our agents are ready to help you 24/7.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
