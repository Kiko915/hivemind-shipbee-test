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
import { ArrowLeft, Paperclip, Loader2, File, MoreHorizontal, Maximize2, SmileIcon, Download } from 'lucide-react'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
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
    const [isTyping, setIsTyping] = useState(false)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

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

        // Restore cursor position without stealing focus (keeps picker open)
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length
        }, 0)
    }

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id || null)
        })
        fetchTicketAndMessages()

        const channel = supabase.channel(`ticket-typing:${ticketId}`)

        channel
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => {
                    if (payload.payload.userId !== userId) {
                        setIsTyping(true)
                        // Clear existing timeout
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        // Set new timeout to hide indicator
                        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
                    }
                }
            )
            .subscribe()

        channelRef.current = channel

        // Existing db subscription
        const dbChannel = supabase
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
                    setIsTyping(false) // Stop typing indicator if they sent a message
                }
            )
            .subscribe()

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current)
            supabase.removeChannel(dbChannel)
        }
    }, [ticketId])

    const handleTyping = () => {
        if (!channelRef.current) return

        channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId }
        })
    }

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

    // Mark as read when opening or receiving messages
    useEffect(() => {
        if (ticketId) {
            localStorage.setItem(`hivemind_last_read_${ticketId}`, new Date().toISOString())
        }
    }, [ticketId, messages])

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

        // CONSTANTS
        const MAX_SIZE = 10 * 1024 * 1024 // 10MB
        const ALLOWED_TYPES = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

        // Validation
        if (file.size > MAX_SIZE) {
            toast.error("File is too large. Maximum size is 10MB.")
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        // Basic type check (can be stricter)
        const isValidType = ALLOWED_TYPES.some(type => file.type.startsWith(type) || type === file.type)
        if (!isValidType) {
            toast.error("Unsupported file type.")
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

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
            toast.error('Failed to upload file. Please try again.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDownloadTranscription = () => {
        if (!ticket || messages.length === 0) return

        const startDate = new Date(ticket.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        const startTime = new Date(ticket.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        })

        let content = `Conversation with HiveMind Support\n`
        content += `Started on ${startDate} at ${startTime}\n\n`

        let currentDate = ''

        messages.forEach((msg) => {
            const msgDate = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

            if (msgDate !== currentDate) {
                content += `--- ${msgDate} ---\n\n`
                currentDate = msgDate
            }

            const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            const sender = msg.sender_id === userId ? 'Visitor' : 'Support'

            content += `${time} | ${sender}: ${msg.content}\n\n`
        })

        const exportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        const exportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })

        content += `---\nExported from HiveMind on ${exportDate} at ${exportTime}`

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transcript-${ticketId}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
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
            <div className="flex items-center gap-3 p-4 pr-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm z-20 rounded-t-2xl relative">
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
                    <DropdownMenuContent align="end" className="z-[99999]">
                        <DropdownMenuItem onClick={onExpand}>
                            <Maximize2 className="mr-2 size-4" />
                            <span>Expand Window</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadTranscription}>
                            <Download className="mr-2 size-4" />
                            <span>Download Transcription</span>
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
                                    "px-4 py-2 rounded-2xl shadow-sm text-sm whitespace-pre-wrap break-all",
                                    msg.sender_id === userId
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-white border border-slate-200 text-slate-800",
                                    // Dynamic Grouping Styling
                                    isMe && !isGroupStart && "rounded-tr-sm",
                                    isMe && !isGroupEnd && "rounded-br-sm",
                                    isMe && isGroupEnd && "rounded-br-none", // Tail

                                    !isMe && !isGroupStart && "rounded-tl-sm",
                                    !isMe && !isGroupEnd && "rounded-bl-sm",
                                    !isMe && isGroupEnd && "rounded-bl-none" // Tail
                                )}>
                                {msg.content}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {msg.attachments.map((url, i) => {
                                            const fileExt = url.split('.').pop()?.toLowerCase()
                                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')
                                            const isVideo = ['mp4', 'webm', 'ogg'].includes(fileExt || '')

                                            if (isImage) {
                                                return (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                                        <img
                                                            src={url}
                                                            alt="Attachment"
                                                            className="rounded-lg max-w-full h-auto max-h-[150px] object-cover"
                                                        />
                                                    </a>
                                                )
                                            }

                                            if (isVideo) {
                                                return (
                                                    <div key={i} className="rounded-lg overflow-hidden max-w-full">
                                                        <video
                                                            src={url}
                                                            controls
                                                            className="w-full h-auto max-h-[150px]"
                                                        />
                                                    </div>
                                                )
                                            }

                                            return (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-xs hover:underline decoration-white/50 bg-black/5 p-2 rounded-md"
                                                >
                                                    <File className="size-4 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{url.split('/').pop()}</span>
                                                </a>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            {isGroupEnd && (
                                <span className="text-[10px] text-slate-400 mt-1 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    )
                })}
                {isTyping && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 ml-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Loader2 className="size-3 animate-spin" /> Support agent is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {
                ticket?.status === 'closed' ? (
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
                                onChange={(e) => {
                                    setNewMessage(e.target.value)
                                    handleTyping()
                                }}
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
                                        accept="image/*,video/*,.pdf,.doc,.docx"
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
                )
            }
        </div>
    )
}
