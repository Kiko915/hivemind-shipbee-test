import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import supabase from '@/utils/supabase'
import type { Ticket, Profile, Message } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Send,
    Paperclip,
    Smile,
    Loader2,
    File as FileIcon
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type TicketWithProfile = Ticket & {
    profiles: Profile
}

type MessageWithProfile = Message & {
    profiles?: {
        email: string | null
    }
}

const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function AdminTicketDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [ticket, setTicket] = useState<TicketWithProfile | null>(null)
    const [messages, setMessages] = useState<MessageWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [replyText, setReplyText] = useState('')
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setCurrentUserEmail(session.user.email || null)
                setCurrentUserId(session.user.id)
            }
        }
        getUser()
    }, [])

    useEffect(() => {
        if (id) {
            fetchTicketData()

            // Typing Channel
            const typingChannel = supabase.channel(`ticket-typing:${id}`)
            typingChannel
                .on(
                    'broadcast',
                    { event: 'typing' },
                    (payload) => {
                        if (payload.payload.userId !== currentUserId) {
                            setIsTyping(true)
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
                        }
                    }
                )
                .subscribe()
            channelRef.current = typingChannel

            const subscription = supabase
                .channel(`ticket-${id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `ticket_id=eq.${id}`
                }, async (payload) => {
                    const newMessage = payload.new as Message

                    let senderEmail = null

                    if (newMessage.sender_id === currentUserId) {
                        senderEmail = currentUserEmail
                    } else {
                        const { data: senderProfile } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('id', newMessage.sender_id)
                            .single()
                        if (senderProfile) senderEmail = senderProfile.email
                    }

                    const messageWithProfile: MessageWithProfile = {
                        ...newMessage,
                        profiles: { email: senderEmail }
                    }

                    setMessages(prev => [...prev, messageWithProfile])
                    setTimeout(scrollToBottom, 100)
                    setIsTyping(false) // Stop typing indicator if they sent a message
                })
                .subscribe()

            return () => {
                subscription.unsubscribe()
                if (channelRef.current) supabase.removeChannel(channelRef.current)
            }
        }
    }, [id, currentUserId, currentUserEmail])

    // Mark as read when opening or receiving messages
    useEffect(() => {
        if (id) {
            localStorage.setItem(`hivemind_admin_last_read_${id}`, new Date().toISOString())
        }
    }, [id, messages])

    const handleTyping = () => {
        if (!channelRef.current || !currentUserId) return

        channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUserId }
        })
    }

    const fetchTicketData = async () => {
        try {
            setLoading(true)
            const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .select('*, profiles(*)')
                .eq('id', id)
                .single()

            if (ticketError) throw ticketError

            const { data: messageData, error: messageError } = await supabase
                .from('messages')
                .select('*, profiles(email)')
                .eq('ticket_id', id)
                .order('created_at', { ascending: true })

            if (messageError) throw messageError

            setTicket(ticketData as TicketWithProfile)
            setMessages(messageData as unknown as MessageWithProfile[] || [])
            setTimeout(scrollToBottom, 100)

        } catch (error) {
            console.error(error)
            toast.error('Failed to load ticket details')
            navigate('/admin/tickets')
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const textarea = textareaRef.current
        if (!textarea) {
            setReplyText((prev) => prev + emojiData.emoji)
            return
        }
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = replyText
        const newText = text.substring(0, start) + emojiData.emoji + text.substring(end)
        setReplyText(newText)

        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length
        }, 0)
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !ticket || !currentUserId) return

        if (file.size > MAX_FILE_SIZE) {
            toast.error('File size exceeds 10MB limit')
            return
        }

        const isValidType = ALLOWED_TYPES.some(type => file.type.startsWith(type) || type === file.type)
        if (!isValidType) {
            toast.error('Unsupported file type')
            return
        }

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${ticket.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath)

            // Send message with attachment
            const { error: msgError } = await supabase.from('messages').insert({
                content: `Sent an attachment: ${file.name}`,
                ticket_id: ticket.id,
                sender_id: currentUserId,
                attachments: [publicUrl],
                is_internal: false
            })

            if (msgError) throw msgError
            toast.success('File uploaded and sent')

        } catch (error) {
            console.error('Upload failed:', error)
            toast.error('Failed to upload file')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleSendMessage = async () => {
        if (!replyText.trim() || !ticket || !currentUserId) return

        setSending(true)
        try {
            const { error } = await supabase.from('messages').insert({
                content: replyText,
                ticket_id: ticket.id,
                sender_id: currentUserId,
                attachments: [] // No attachments for text message
            })

            if (error) throw error
            setReplyText('')

        } catch (error) {
            console.error(error)
            toast.error('Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const updateStatus = async (status: string) => {
        if (!ticket) return
        try {
            const { error } = await supabase
                .from('tickets')
                .update({ status })
                .eq('id', ticket.id)

            if (error) throw error
            setTicket({ ...ticket, status: status as any })
            toast.success(`Ticket marked as ${status}`)
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const updatePriority = async (priority: string) => {
        if (!ticket) return
        try {
            const { error } = await supabase
                .from('tickets')
                .update({ priority })
                .eq('id', ticket.id)

            if (error) throw error
            setTicket({ ...ticket, priority: priority as any })
            toast.success('Priority updated')
        } catch (error) {
            toast.error('Failed to update priority')
        }
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
            case 'resolved': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
            case 'closed': return 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
            default: return 'bg-zinc-100 text-zinc-700 border-zinc-200'
        }
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return <span className="size-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            case 'high': return <span className="size-2 rounded-full bg-red-500" />
            case 'medium': return <span className="size-2 rounded-full bg-orange-400" />
            case 'low': return <span className="size-2 rounded-full bg-blue-400" />
            default: return null
        }
    }

    const getSentimentBadge = (sentiment: string | null) => {
        if (!sentiment) return null

        switch (sentiment.toLowerCase()) {
            case 'positive':
                return (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                        Positive
                    </Badge>
                )
            case 'negative':
                return (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                        Negative
                    </Badge>
                )
            case 'neutral':
                return (
                    <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                        Neutral
                    </Badge>
                )
            default:
                return (
                    <Badge variant="secondary" className="capitalize">
                        {sentiment}
                    </Badge>
                )
        }
    }

    if (loading) {
        return <AdminTicketSkeleton />
    }

    if (!ticket) return null

    return (
        <div className="flex h-[calc(100vh-6rem)] -m-6 lg:-m-8">
            {/* Left: Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                {/* Chat Header */}
                <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tickets')}>
                            <ArrowLeft className="size-4" />
                        </Button>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[400px]">
                                {ticket.subject}
                            </h2>
                            <p className="text-xs text-zinc-500 font-mono">#{ticket.id}</p>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-1 bg-zinc-50/50 dark:bg-zinc-950/50">
                    {messages.map((msg, index) => {
                        const isAdmin = msg.sender_id !== ticket.customer_id

                        // Grouping Logic
                        const prevMsg = messages[index - 1]
                        const nextMsg = messages[index + 1]

                        const isSameSenderAsPrev = prevMsg?.sender_id === msg.sender_id
                        const isWithinTimeThresholdPrev = prevMsg && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 2 * 60 * 1000) // 2 mins

                        const isSameSenderAsNext = nextMsg?.sender_id === msg.sender_id
                        const isWithinTimeThresholdNext = nextMsg && (new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() < 2 * 60 * 1000)

                        const isGroupStart = !isSameSenderAsPrev || !isWithinTimeThresholdPrev
                        const isGroupEnd = !isSameSenderAsNext || !isWithinTimeThresholdNext

                        let avatarSeed = msg.sender_id
                        if (msg.profiles?.email) {
                            avatarSeed = msg.profiles.email
                        } else if (!isAdmin && ticket.profiles.email) {
                            avatarSeed = ticket.profiles.email
                        }

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-3 max-w-[80%] group",
                                    isAdmin ? "ml-auto flex-row-reverse" : "",
                                    isGroupEnd ? "mb-4" : "mb-1"
                                )}
                            >
                                {/* Avatar - visible only at bottom of group */}
                                <Avatar className={cn(
                                    "size-8 border border-zinc-200 dark:border-zinc-700",
                                    !isGroupEnd && "invisible size-8"
                                )}>
                                    <AvatarImage src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${avatarSeed}`} />
                                    <AvatarFallback>{isAdmin ? 'AD' : 'CS'}</AvatarFallback>
                                </Avatar>

                                <div className={cn("flex flex-col", isAdmin ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "px-4 py-2.5 shadow-sm whitespace-pre-wrap break-all",
                                        isAdmin
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100",
                                        "rounded-2xl",
                                        // Dynamic Rounding for Groups
                                        isAdmin && !isGroupStart && "rounded-tr-sm",
                                        isAdmin && !isGroupEnd && "rounded-br-sm",
                                        isAdmin && isGroupEnd && "rounded-br-none",

                                        !isAdmin && !isGroupStart && "rounded-tl-sm",
                                        !isAdmin && !isGroupEnd && "rounded-bl-sm",
                                        !isAdmin && isGroupEnd && "rounded-bl-none"
                                    )}>
                                        {msg.content}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-white/20 space-y-2">
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
                                                                    className="rounded-lg max-w-full h-auto max-h-[200px] object-cover hover:opacity-90 transition-opacity"
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
                                                                    className="w-full h-auto max-h-[200px]"
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
                                                            <FileIcon className="size-4 shrink-0" />
                                                            <span className="truncate max-w-[150px]">{url.split('/').pop()}</span>
                                                        </a>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    {isGroupEnd && (
                                        <span className="text-[10px] text-zinc-400 mt-1 px-1">
                                            {format(new Date(msg.created_at), 'h:mm a')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {isTyping && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 ml-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Loader2 className="size-3 animate-spin" /> Customer is typing...
                        </div>
                    )}
                </div>

                {/* Reply Input Area - Redesigned */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl focus-within:ring-1 focus-within:ring-zinc-900/10 transition-all shadow-sm">
                        <Textarea
                            ref={textareaRef}
                            value={replyText}
                            onChange={(e) => {
                                setReplyText(e.target.value)
                                handleTyping()
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                            placeholder="Type a reply..."
                            className="min-h-[60px] max-h-[200px] border-0 focus-visible:ring-0 bg-transparent resize-none p-2 text-sm"
                            rows={1}
                        />
                        <div className="flex items-center justify-between px-2 pb-1">
                            <div className="flex items-center gap-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept={ALLOWED_TYPES.join(',')}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Paperclip className="size-4" />
                                    )}
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                            <Smile className="size-4" />
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
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                disabled={sending || !replyText.trim()}
                                size="sm"
                                className="h-8 px-4 gap-2"
                            >
                                {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                                Send Reply
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Sidebar Info */}
            <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 overflow-y-auto">
                <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Customer</h3>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-zinc-200">
                                <AvatarImage src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${ticket.profiles.email}`} />
                                <AvatarFallback>CS</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{ticket.profiles.email}</span>
                                <span className="text-xs text-zinc-500">Customer</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                    {/* Ticket Status */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ticket Status</h3>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                            <Select value={ticket.status} onValueChange={updateStatus}>
                                <SelectTrigger className={cn("w-full capitalize", getStatusStyles(ticket.status))}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
                            <Select value={ticket.priority} onValueChange={updatePriority}>
                                <SelectTrigger className="w-full bg-white dark:bg-zinc-900">
                                    <div className="flex items-center gap-2 capitalize">
                                        {getPriorityIcon(ticket.priority)}
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {ticket.sentiment && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Sentiment (AI)</label>
                                <div className="flex items-center h-10">
                                    {getSentimentBadge(ticket.sentiment)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                    {/* Metadata */}
                    <div>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Metadata</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Created</span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Last Update</span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Channel</span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">Web Widget</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AdminTicketSkeleton() {
    return (
        <div className="flex h-screen -m-8">
            <div className="flex-1 p-6 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
            <div className="w-80 border-l p-6 space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    )
}
