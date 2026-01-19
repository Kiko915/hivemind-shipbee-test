import { useState } from 'react'
import supabase from '@/utils/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'

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

            onSuccess(ticket.id)
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-2 p-4 border-b">
                <Button variant="ghost" size="icon-sm" onClick={onCancel}>
                    <ArrowLeft className="size-4" />
                </Button>
                <h2 className="font-semibold">New Ticket</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                        id="subject"
                        placeholder="What's the issue?"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                        id="message"
                        placeholder="Describe your problem in detail..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        disabled={loading}
                        className="min-h-[120px]"
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs">
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Create Ticket'
                    )}
                </Button>
            </form>
        </div>
    )
}
