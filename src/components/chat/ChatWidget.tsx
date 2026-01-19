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

    // Check auth state
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(!!session)
            setView(session ? 'list' : 'auth')
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(!!session)
            setView(session ? 'list' : 'auth')
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
