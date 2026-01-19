export interface Profile {
    id: string
    email: string | null
    role: 'customer' | 'admin'
    created_at: string
}

export interface Ticket {
    id: string
    customer_id: string
    subject: string | null
    status: 'open' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high'
    sentiment: string | null
    created_at: string
    updated_at: string
}

export interface Message {
    id: string
    ticket_id: string
    sender_id: string
    content: string
    attachments: string[] | null
    is_internal: boolean
    created_at: string
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: Profile
                Update: Partial<Profile>
            }
            tickets: {
                Row: Ticket
                Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Ticket>
            }
            messages: {
                Row: Message
                Insert: Omit<Message, 'id' | 'created_at'>
                Update: Partial<Message>
            }
        }
    }
}
