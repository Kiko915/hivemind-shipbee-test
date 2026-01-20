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
        const { ticket_id, subject, content } = await req.json()

        console.log('Triaging ticket:', ticket_id, subject)

        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        if (!groqApiKey) throw new Error('Missing GROQ_API_KEY')

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

        // Call Groq
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: 'You are an AI triage assistant. Analyze the ticket and return a JSON object with "priority" (low, medium, high, urgent) and "sentiment" (positive, neutral, negative).' },
                    { role: 'user', content: `Subject: ${subject}\nMessage: ${content}` }
                ],
                response_format: { type: "json_object" }
            })
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error.message)

        console.log('AI Response:', JSON.stringify(data))

        let contentStr = data.choices[0].message.content
        // Clean markdown if present
        if (contentStr.includes('```')) {
            contentStr = contentStr.replace(/```json/g, '').replace(/```/g, '')
        }

        const analysis = JSON.parse(contentStr)
        console.log('Analysis Parsed:', analysis)

        // Update Supabase using Service Role Key to bypass RLS
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceRoleKey
        )

        const { error: updateError, data: updateData } = await supabaseClient
            .from('tickets')
            .update({
                priority: analysis.priority.toLowerCase(),
                sentiment: analysis.sentiment.toLowerCase()
            })
            .eq('id', ticket_id)
            .select()

        console.log('Update Result:', { updateError, updateData })

        if (updateError) throw updateError

        return new Response(JSON.stringify({ success: true, analysis, updateData }), {
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
