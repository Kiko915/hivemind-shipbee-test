import { useEffect, useRef, useState } from 'react'
import supabase from '@/utils/supabase'
import type { Message, Ticket } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, Send, Paperclip, Loader2, File, MoreHorizontal, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatViewProps {
    ticketId: string
    onBack: () => void
    onExpand?: () => void
}

export default function ChatView({ ticketId, onBack, onExpand }: ChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id || null)
        })
        fetchTicketAndMessages()

        const channel = supabase
            .channel(`ticket:${ticketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `ticket_id=eq.${ticketId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message])
                    scrollToBottom()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [ticketId])

    const fetchTicketAndMessages = async () => {
        try {
            const { data: ticketData } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .single()
            setTicket(ticketData)

            const { data: messagesData } = await supabase
                .from('messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true })
            setMessages(messagesData || [])
            setLoading(false)
            scrollToBottom()
        } catch (error) {
            console.error('Error fetching data:', error)
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim() || sending || !userId) return

        setSending(true)
        try {
            const { error } = await supabase.from('messages').insert({
                ticket_id: ticketId,
                sender_id: userId,
                content: newMessage,
                is_internal: false,
            })

            if (error) throw error
            setNewMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSending(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !userId) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${ticketId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath)

            // Send message with attachment
            await supabase.from('messages').insert({
                ticket_id: ticketId,
                sender_id: userId,
                content: `Sent an attachment: ${file.name}`,
                attachments: [publicUrl],
                is_internal: false,
            })

        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Failed to upload file. Make sure the "attachments" bucket exists and is public.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin size-6 text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border-b shadow-sm z-10">
                <Button variant="ghost" size="icon-sm" onClick={onBack} className="shrink-0">
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm truncate">{ticket?.subject || 'Chat'}</h2>
                    <div className="flex items-center gap-1.5 status-badge">
                        <span className={`size-2 rounded-full ${ticket?.status === 'open' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-muted-foreground capitalize">{ticket?.status}</span>
                    </div>
                </div>

                {/* 3-Dot Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="shrink-0">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onExpand}>
                            <Maximize2 className="mr-2 size-4" />
                            <span>Expand Window</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === userId
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex max-w-[85%] flex-col gap-1",
                                isMe ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                    isMe
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-white dark:bg-zinc-800 border text-foreground rounded-bl-none"
                                )}
                            >
                                {msg.content}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-white/20">
                                        {msg.attachments.map((url, i) => (
                                            <a
                                                key={i}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-xs hover:underline decoration-white/50"
                                            >
                                                <File className="size-3" />
                                                Attachment
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {ticket?.status === 'closed' ? (
                <div className="p-4 bg-gray-50 text-center text-sm text-gray-500 border-t">
                    This ticket has been closed.
                </div>
            ) : (
                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-zinc-900 border-t flex items-end gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0 text-muted-foreground hover:text-primary"
                    >
                        {uploading ? <Loader2 className="size-5 animate-spin" /> : <Paperclip className="size-5" />}
                    </Button>
                    <div className="flex-1 relative">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="pr-10 py-2.5 h-10 bg-slate-50 dark:bg-zinc-950 border-input/60 focus-visible:ring-1"
                            disabled={sending}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim() || sending}
                        className={cn("shrink-0 shadow-sm", sending && "opacity-70")}
                    >
                        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </Button>
                </form>
            )}
        </div>
    )
}
