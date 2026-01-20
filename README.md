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
