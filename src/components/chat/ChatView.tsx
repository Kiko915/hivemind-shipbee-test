import { useEffect, useRef, useState } from 'react'
import supabase from '@/utils/supabase'
import type { Message, Ticket } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, Paperclip, Loader2, File, MoreHorizontal, Maximize2, SmileIcon } from 'lucide-react'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [uploading, setUploading] = useState(false)

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const textarea = textareaRef.current
        if (!textarea) {
            setNewMessage((prev) => prev + emojiData.emoji)
            return
        }
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = newMessage
        const newText = text.substring(0, start) + emojiData.emoji + text.substring(end)
        setNewMessage(newText)

        // Restore cursor position
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length
            textarea.focus()
        }, 0)
    }

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
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm z-10 rounded-t-2xl">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onBack}
                    className="shrink-0"
                >
                    <ArrowLeft className="size-4" />
                </Button>

                <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-lg shrink-0">
                        <img src="/hivemind_blue.png" alt="HiveMind" className="size-6 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-semibold text-sm truncate flex items-center gap-2">
                            HiveMind Support
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                                {ticket?.subject || 'New Conversation'}
                            </span>
                            {ticket?.status && (
                                <Badge
                                    variant={ticket.status === 'open' ? 'default' : 'secondary'}
                                    className={cn(
                                        "h-4 px-1.5 text-[10px] capitalize border-none",
                                        ticket.status === 'open' ? "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-500/20 dark:text-green-400" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-400"
                                    )}
                                >
                                    {ticket.status}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3-Dot Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                        >
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
                {messages.map((msg, index) => {
                    const isMe = msg.sender_id === userId
                    const prevMsg = messages[index - 1]
                    const nextMsg = messages[index + 1]

                    const isSameSenderAsPrev = prevMsg?.sender_id === msg.sender_id
                    const isSameSenderAsNext = nextMsg?.sender_id === msg.sender_id

                    const isWithinTimeThresholdPrev = prevMsg && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 2 * 60 * 1000)
                    const isWithinTimeThresholdNext = nextMsg && (new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() < 2 * 60 * 1000)

                    const isGroupStart = !isSameSenderAsPrev || !isWithinTimeThresholdPrev
                    const isGroupEnd = !isSameSenderAsNext || !isWithinTimeThresholdNext

                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex max-w-[85%] flex-col gap-1 transition-all",
                                isMe ? "ml-auto items-end" : "mr-auto items-start",
                                !isGroupEnd ? "mb-1" : "mb-4"
                            )}
                        >
                            <div
                                className={cn(
                                    "px-4 py-2.5 text-sm shadow-sm break-all whitespace-pre-wrap",
                                    isMe
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-white dark:bg-zinc-800 border text-foreground",
                                    // Radius logic for grouping
                                    "rounded-2xl",
                                    isMe && !isGroupStart && "rounded-tr-sm",
                                    isMe && !isGroupEnd && "rounded-br-sm",
                                    isMe && isGroupEnd && "rounded-br-none", // Tail for last message
                                    !isMe && !isGroupStart && "rounded-tl-sm",
                                    !isMe && !isGroupEnd && "rounded-bl-sm",
                                    !isMe && isGroupEnd && "rounded-bl-none" // Tail for last message
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
                            {isGroupEnd && (
                                <span className={cn(
                                    "text-[10px] text-muted-foreground px-1 opacity-70",
                                    !isMe && "ml-1",
                                    isMe && "mr-1"
                                )}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
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
                <div className="p-4 bg-white dark:bg-zinc-900 border-t space-y-3">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex flex-col gap-2 bg-slate-100 dark:bg-zinc-800 p-3 rounded-2xl relative transition-all focus-within:ring-1 focus-within:ring-primary/20 focus-within:bg-slate-50 dark:focus-within:bg-zinc-800/80"
                    >
                        <Textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                            placeholder="Message..."
                            className="border-0 shadow-none bg-transparent px-0 py-1 min-h-auto focus-visible:ring-0 resize-none placeholder:text-muted-foreground/70 flex-1 max-h-32 overflow-y-auto"
                            disabled={sending}
                            rows={1}
                        />

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
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
                                    size="icon-xs"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-6 w-6 hover:text-primary transition-colors"
                                >
                                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
                                </Button>
                                {/* Emoji Picker */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon-xs" className="h-6 w-6 hover:text-primary transition-colors">
                                            <SmileIcon className="size-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent side="top" align="start" className="w-full p-0 border-none shadow-none bg-transparent">
                                        <EmojiPicker
                                            onEmojiClick={handleEmojiClick}
                                            lazyLoadEmojis={true}
                                            searchDisabled={false}
                                            skinTonesDisabled
                                            previewConfig={{ showPreview: false }}
                                            height={300}
                                            width="100%"
                                        />
                                    </PopoverContent>
                                </Popover>
                                {/* <Mic className="size-4 hover:text-primary cursor-pointer transition-colors" /> */}
                            </div>

                            <Button
                                type="submit"
                                size="icon-xs"
                                disabled={!newMessage.trim() || sending}
                                className={cn(
                                    "h-7 w-7 rounded-full transition-all",
                                    newMessage.trim() ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {sending ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowLeft className="size-3.5 rotate-90" />} {/* ArrowUp icon roughly */}
                            </Button>
                        </div>
                    </form>

                    <div className="flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Powered by HiveMind</span>
                    </div>
                </div>
            )}
        </div>
    )
}
