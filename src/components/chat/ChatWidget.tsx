import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Home, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import AuthView from './AuthView'
import TicketList from './TicketList'
import NewTicketForm from './NewTicketForm'
import ChatView from './ChatView'
import HomeView from './HomeView'
import supabase from '@/utils/supabase'

type ViewState = 'home' | 'auth' | 'list' | 'new' | 'chat'

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState<ViewState>('home')
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const location = useLocation()
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
            // For other views like 'list' or 'new' or 'home', we can restore them, 
            // but 'auth' is handled by the auth check effect.
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

    // Check auth state and admin role
    useEffect(() => {
        const checkAdminStatus = async (userId: string) => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single()

                if (profile?.role === 'admin') {
                    setIsAdmin(true)
                } else {
                    setIsAdmin(false)
                }
            } catch (error) {
                console.error('Error checking admin status:', error)
            }
        }

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setView('auth')
            } else {
                setView(current => current === 'auth' ? 'home' : current)
                checkAdminStatus(session.user.id)
            }
        }

        checkUser()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setView('auth')
                setIsAdmin(false) // Reset admin status on logout
            } else {
                setView(current => current === 'auth' ? 'home' : current)
                checkAdminStatus(session.user.id)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const toggleOpen = () => setIsOpen(!isOpen)
    const toggleExpand = () => setIsExpanded(!isExpanded)

    const handleNavigate = (newView: ViewState, ticketId?: string) => {
        if (newView === 'chat' && ticketId) {
            setActiveTicketId(ticketId)
        }
        setView(newView)
    }

    // Hide widget on admin routes or if user is admin
    if (location.pathname.startsWith('/admin') || isAdmin) return null

    return (
        <div className="fixed bottom-4 right-4 z-9999 flex flex-col items-end gap-4 font-sans antialiased">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col w-[400px] transition-all duration-300 ease-in-out",
                            isExpanded ? "w-[800px] h-[80vh] fixed top-10 right-10 bottom-10 m-auto" : "h-[600px]"
                        )}
                    >
                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden relative">
                            {/* Close/Expand Controls (Floating) */}
                            <div className="absolute top-4 right-4 z-[100] flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleOpen}
                                    className="h-8 w-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>

                            {view === 'auth' && <AuthView onLogin={() => setView('home')} />}
                            {view === 'home' && <HomeView onNavigate={handleNavigate} />}
                            {view === 'list' && (
                                <TicketList
                                    onSelectTicket={(id) => handleNavigate('chat', id)}
                                    onNewTicket={() => handleNavigate('new')}
                                />
                            )}
                            {view === 'new' && (
                                <NewTicketForm
                                    onCancel={() => handleNavigate('list')}
                                    onSuccess={(ticketId) => handleNavigate('chat', ticketId)}
                                />
                            )}
                            {view === 'chat' && activeTicketId && (
                                <ChatView
                                    ticketId={activeTicketId}
                                    onBack={() => handleNavigate('list')}
                                    onExpand={toggleExpand}
                                />
                            )}
                        </div>

                        {/* Bottom Navigation */}
                        {view !== 'auth' && view !== 'chat' && (
                            <div className="h-16 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-around px-2 shrink-0">
                                <button
                                    onClick={() => setView('home')}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors w-16",
                                        view === 'home' ? "text-primary" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                    )}
                                >
                                    <Home className={cn("size-6", (view === 'home') && "fill-current")} />
                                    <span className="text-[10px] font-medium">Home</span>
                                </button>

                                <button
                                    onClick={() => setView('list')}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors w-16",
                                        view === 'list' ? "text-primary" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                    )}
                                >
                                    <MessageCircle className={cn("size-6", (view === 'list') && "fill-current")} />
                                    <span className="text-[10px] font-medium">Tickets</span>
                                </button>
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    onClick={toggleOpen}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    {isOpen ? <ChevronDown className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
                </Button>
            </motion.div>
        </div>
    )
}
