import { useState, useEffect } from 'react'
import supabase from '@/utils/supabase'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import AuthView from './AuthView'
import TicketList from './TicketList'
import NewTicketForm from './NewTicketForm'
import ChatView from './ChatView'

type ViewState = 'auth' | 'list' | 'new' | 'chat'

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState<ViewState>('auth')
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
    const [session, setSession] = useState<boolean>(false)
    const [isExpanded, setIsExpanded] = useState(false)

    // Load persisted state on mount
    useEffect(() => {
        const savedOpen = localStorage.getItem('hivemind_chat_open') === 'true'
        const savedView = localStorage.getItem('hivemind_chat_view') as ViewState | null
        const savedTicketId = localStorage.getItem('hivemind_chat_ticket_id')
        const savedExpanded = localStorage.getItem('hivemind_chat_expanded') === 'true'

        if (savedOpen) setIsOpen(true)
        if (savedExpanded) setIsExpanded(true)

        // Only restore chat view if we have a ticket ID
        if (savedView === 'chat' && savedTicketId) {
            setView('chat')
            setActiveTicketId(savedTicketId)
        } else if (savedView) {
            // For other views like 'list' or 'new', we can restore them, 
            // but 'auth' is handled by the auth check effect.
            // We'll let the auth effect override if not logged in.
            if (savedView !== 'auth') setView(savedView)
        }
    }, [])

    // Persist state changes
    useEffect(() => {
        localStorage.setItem('hivemind_chat_open', String(isOpen))
    }, [isOpen])

    useEffect(() => {
        if (view) localStorage.setItem('hivemind_chat_view', view)
    }, [view])

    useEffect(() => {
        if (activeTicketId) {
            localStorage.setItem('hivemind_chat_ticket_id', activeTicketId)
        } else {
            localStorage.removeItem('hivemind_chat_ticket_id')
        }
    }, [activeTicketId])

    useEffect(() => {
        localStorage.setItem('hivemind_chat_expanded', String(isExpanded))
    }, [isExpanded])

    // Check auth state
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(!!session)
            if (!session) {
                setView('auth') // Force auth view if not logged in
            } else {
                // If logged in, we only switch to list if we are currently in auth
                // This prevents overwriting the restored 'chat' view
                setView(current => current === 'auth' ? 'list' : current)
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(!!session)
            if (!session) {
                setView('auth')
            } else {
                setView(current => current === 'auth' ? 'list' : current)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex flex-col items-end gap-4 ${isExpanded ? 'w-full h-full p-4 pointer-events-none' : ''}`}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            width: isExpanded ? '800px' : '380px',
                            height: isExpanded ? '800px' : '600px',
                            maxHeight: isExpanded ? 'calc(100vh - 6rem)' : '80vh'
                        }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                        className={`bg-white dark:bg-zinc-950 rounded-xl shadow-2xl border flex flex-col overflow-hidden pointer-events-auto transition-all ${isExpanded ? 'max-w-[calc(100vw-2rem)]' : ''}`}
                    >
                        {/* Header if not in Chat View (ChatView has its own header) */}
                        {view !== 'chat' && (
                            <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center shrink-0">
                                <div>
                                    <h1 className="font-bold text-lg">Support</h1>
                                    {session && <p className="text-xs opacity-90">How can we help you today?</p>}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-primary-foreground hover:bg-primary/20"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="size-5" />
                                </Button>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden relative">
                            {view === 'auth' && <AuthView />}

                            {view === 'list' && (
                                <TicketList
                                    onSelectTicket={(id) => {
                                        setActiveTicketId(id)
                                        setView('chat')
                                    }}
                                    onNewTicket={() => setView('new')}
                                />
                            )}

                            {view === 'new' && (
                                <NewTicketForm
                                    onCancel={() => setView('list')}
                                    onSuccess={(id) => {
                                        setActiveTicketId(id)
                                        setView('chat')
                                    }}
                                />
                            )}

                            {view === 'chat' && activeTicketId && (
                                <ChatView
                                    ticketId={activeTicketId}
                                    onBack={() => {
                                        setActiveTicketId(null)
                                        setView('list')
                                        setIsExpanded(false)
                                    }}
                                    onExpand={() => setIsExpanded(!isExpanded)}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="lg"
                className="rounded-full size-14 shadow-lg p-0"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <X className="size-6" />
                ) : (
                    <MessageCircle className="size-6" />
                )}
            </Button>
        </div>
    )
}
