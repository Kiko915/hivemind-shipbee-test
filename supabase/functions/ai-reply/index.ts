import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        const { ticket_id } = await req.json()

        if (!ticket_id) throw new Error('Ticket ID is required')

        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        if (!groqApiKey) throw new Error('Missing GROQ_API_KEY')

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceRoleKey
        )

        // 1. Fetch Ticket & Messages
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select('subject, customer_id')
            .eq('id', ticket_id)
            .single()

        if (ticketError) throw ticketError

        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('ticket_id', ticket_id)
            .order('created_at', { ascending: false })
            .limit(10) // Context window

        if (msgError) throw msgError

        // 2. Format Context
        // Reverse messages to chronological order for AI
        const history = (messages || []).reverse().map(msg => {
            const role = msg.sender_id === ticket.customer_id ? 'Customer' : 'Support Agent'
            return `${role}: ${msg.content}`
        }).join('\n')

        // 3. Call Groq
        const prompt = `
        You are an expert customer support agent for "HiveMind".
        Your goal is to draft a polite, professional, and helpful reply to the customer based on the conversation history.

        Context:
        Subject: ${ticket.subject}

        Conversation History:
        ${history}

        Draft a response that:
        1. Acknowledges the customer's last message.
        2. Provides a helpful solution or asks clarifying questions if needed.
        3. Maintains a friendly and professional tone.
        4. Is concise (under 150 words).

        Return ONLY the response text. Do not include "Subject:" or any other metadata.
        `

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: 'You are a helpful customer support AI.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
            })
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error.message)

        const replyDraft = data.choices[0].message.content

        return new Response(JSON.stringify({ reply: replyDraft }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })

    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })
    }
})
