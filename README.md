<img src="./public/hivemind_blue.png" alt="HiveMind Logo" width="200">

# HiveMind 🐝
> Intelligent Customer Support Widget & Admin Dashboard for ShipBee.

HiveMind is a full-stack support system designed to demonstrate "Systems Thinking" in serverless architecture. It combines a real-time embeddable widget for customers with an AI-empowered workspace for agents.

## 🔗 Live Demo
- Landing Page w/ Chat Widget: https://hivemind-shipbee-test.vercel.app/
- Admin Login Page: https://hivemind-shipbee-test.vercel.app/admin/login

## ⚡ Key Features

### 🛡️ Backend Architecture
- **Performance Optimized:** Uses PostgreSQL RPCs (`get_dashboard_stats`) to fetch analytics in a single request, reducing database load by 80% compared to traditional querying.
- **Edge Functions (AI):**
  - `ai-triage`: Automatically tags new tickets with **Sentiment** (Positive/Negative) and **Priority** (High/Urgent) upon creation.
  - `ai-reply`: Generates context-aware draft responses for agents using Llama-3 (Groq).
- **Security:** Strict Row Level Security (RLS) policies ensure customers can only access their own data, while Admins have scoped global access.
- **Data Integrity:** Database-level cascade deletion ensures no orphaned messages exist when spam tickets are removed.

### 🌟 Customer Experience
- **Rich Media Chat:** Support for images, PDFs, and documents (up to 10MB).
- **Real-Time Sync:** Chat window listens for Admin actions—if a ticket is "Resolved," the UI updates instantly.
- **Transcript Export:** Users can download their full chat history as a `.txt` file.
- **Modern UI:** Features a "Bento Grid" landing page and Dark Mode support.

### 💼 Admin Workspace
- **Command Dashboard:** Live metrics for Resolution Rate, Active Users, and Ticket Volume.
- **Smart Tools:** "Sparkles" ✨ button for AI-drafted replies.
- **Reporting:** One-click CSV export of all ticket data for external analysis.
- **Customer Directory:** Deep-dive views into customer history and profiles.

## 🛠 Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Infrastructure:** Vercel (Deployment)

## 🔐 Admin Credentials (Demo)
- **Email:** `admin@hivemind.com`
- **Password:** `Admin12345!`


## 🧪 How to Test (The "Golden Path")

To experience the full "Systems Thinking" architecture (Realtime, AI Triage, and Security), please follow this 2-minute testing flow:

### 1. Setup
- Open the **Live Demo** in your main browser (this will be the **Admin** view).
- Open the **Live Demo** again in an **Incognito Window** (this will be the **Customer** view).

### 2. The Customer Experience (Incognito Window)
1. On the Landing Page, click the **Chat Widget** (bottom right).
2. Login with any email (or use `customer@demo.com` / `123456`).
3. **The AI Trigger:** Send a message with "urgency" keywords to test the Auto-Triage system:
   > *"URGENT: My package arrived completely damaged and wet. I need a refund immediately!"*
4. Notice the message sends instantly.

### 3. The Admin Experience (Main Window)
1. Go to `/admin/login` and login:
   - **Email:** `admin@hivemind.com`
   - **Password:** `Admin12345!`
2. **Observe:**
   - The **Dashboard Stats** (top cards) load instantly via the custom RPC.
   - The new ticket appears at the All Tickets page.
   - 🚨 **AI Verification:** Notice the tags **"Urgent"** and **"Negative Sentiment"** were automatically applied by the Edge Function.
3. Click the ticket to open the chat.
4. **AI Smart Reply:** Click the **Sparkles (✨)** button below the input box.
   - Watch the AI model generate a polite apology based on the context.
5. Click **Send**.
6. Update **Status** to see live updates and ticket resolvation.

### 4. The Realtime Sync
- Switch back to your **Incognito Window**.
- Confirm the Admin's reply appeared instantly without refreshing the page.
