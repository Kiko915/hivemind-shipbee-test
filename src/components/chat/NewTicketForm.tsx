import { useState } from 'react'
import supabase from '@/utils/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Send } from 'lucide-react'

interface NewTicketFormProps {
    onCancel: () => void
    onSuccess: (ticketId: string) => void
}

export default function NewTicketForm({
    onCancel,
    onSuccess,
}: NewTicketFormProps) {
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!subject.trim() || !message.trim()) {
            setError('Please fill in both subject and message fields')
            setLoading(false)
            return
        }

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) throw new Error('You must be logged in to create a ticket')

            // 1. Create the ticket
            const { data: ticket, error: ticketError } = await supabase
                .from('tickets')
                .insert({
                    customer_id: user.id,
                    subject,
                    status: 'open',
                    priority: 'medium',
                })
                .select()
                .single()

            if (ticketError) throw ticketError
            if (!ticket) throw new Error('Failed to create ticket')

            // 2. Create the first message
            const { error: messageError } = await supabase.from('messages').insert({
                ticket_id: ticket.id,
                sender_id: user.id,
                content: message,
                is_internal: false,
            })

            if (messageError) throw messageError

            // Trigger AI Triage (fire and forget)
            // Trigger AI Triage (fire and forget)
            const { data: { session } } = await supabase.auth.getSession()

            supabase.functions.invoke('ai-triage', {
                body: {
                    ticket_id: ticket.id,
                    subject,
                    content: message
                },
                headers: {
                    Authorization: session?.access_token ? `Bearer ${session.access_token}` : ''
                }
            }).catch(err => console.error('Failed to trigger AI triage:', err))

            onSuccess(ticket.id)
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 font-sans">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 px-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shadow-sm z-10">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onCancel}
                    className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 -ml-2"
                >
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h2 className="font-semibold text-sm">New Request</h2>
                    <p className="text-[10px] text-muted-foreground">We usually reply within a few hours</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-xs font-medium text-zinc-500 uppercase tracking-widest pl-1">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Briefly describe the issue..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            disabled={loading}
                            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 h-11 rounded-xl shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-xs font-medium text-zinc-500 uppercase tracking-widest pl-1">Message</Label>
                        <div className="relative">
                            <Textarea
                                id="message"
                                placeholder="Tell us more details..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                disabled={loading}
                                className="min-h-[150px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 rounded-xl resize-none shadow-sm p-4 text-sm leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div>
                )}
            </form>

            <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800">
                <Button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium text-sm"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Sending Request...
                        </>
                    ) : (
                        <>
                            Submit Ticket
                            <Send className="ml-2 size-3.5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
