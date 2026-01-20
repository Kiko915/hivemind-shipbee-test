import { Button } from "@/components/ui/button"
import {
    Activity,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Globe2,
    Layout,
    MessageSquare,
    Shield,
    Sparkles,
    Zap
} from "lucide-react"
import { Link } from "react-router-dom"

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen font-sans selection:bg-lime-200 selection:text-zinc-900">
            {/* Navbar */}
            <header className="sticky top-0 z-40 w-full border-b border-transparent bg-white/80 backdrop-blur-md transition-all">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/hivemind_blue.png" alt="HiveMind Logo" className="h-8 w-auto" />
                        <span className="text-xl font-bold tracking-tight text-primary">HiveMind</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
                        <Link to="#" className="hover:text-primary transition-colors">Home</Link>
                        <Link to="#" className="hover:text-primary transition-colors">About</Link>
                        <Link to="#" className="hover:text-primary transition-colors">Services</Link>
                        <Link to="#" className="hover:text-primary transition-colors">Contact</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6">
                            Sign Up
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-20 pb-32 overflow-hidden bg-slate-50/50">
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary leading-[1.1]">
                                The Future of <span className="relative whitespace-nowrap">
                                    <span className="relative z-10">Customer Support</span>
                                    <span className="absolute bottom-2 left-0 w-full h-3 bg-lime-200/60 -rotate-1 z-0"></span>
                                </span> <br />
                                with Latest Technology
                            </h1>
                            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
                                Expert tech to elevate your support. Let's take your business further with AI-driven intelligence and automated triage.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link to="/admin">
                                    <Button size="lg" className="h-12 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base">
                                        Get Started
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-zinc-200 hover:bg-white text-base text-primary">
                                    Try Demo
                                </Button>
                            </div>
                        </div>

                        {/* Bento Grid Visuals */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
                            {/* Card 1: Large Image/Abstract */}
                            <div className="md:col-span-4 bg-white rounded-3xl p-2 shadow-sm border border-zinc-100 h-[300px] overflow-hidden relative group">
                                <div className="absolute inset-0 bg-linear-to-br from-lime-100 to-emerald-50 opacity-50" />
                                <div className="absolute inset-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 flex flex-col items-center justify-center">
                                    <div className="size-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                        <Globe2 className="size-10 text-zinc-900" />
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-zinc-900">Global Reach</div>
                                        <div className="text-xs text-zinc-500">Support anywhere, anytime</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: 100+ Clients */}
                            <div className="md:col-span-3 bg-zinc-900 rounded-3xl p-8 flex flex-col justify-between text-white shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Shield className="size-24" />
                                </div>
                                <div className="text-4xl font-bold">100+</div>
                                <div className="text-zinc-400 text-sm leading-relaxed">
                                    Our Esteemed Clients and Partners rely on HiveMind.
                                </div>
                            </div>

                            {/* Card 3: Stats (White) */}
                            <div className="md:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-4 right-4 animate-pulse">
                                    <div className="size-2 bg-green-500 rounded-full" />
                                </div>
                                <div className="size-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-4">
                                    <BarChart3 className="size-6 text-zinc-900" />
                                </div>
                                <div className="text-3xl font-bold text-zinc-900 mb-1">1,951+</div>
                                <div className="text-xs text-zinc-500">Tickets Resolved this week</div>
                                <div className="mt-4 flex items-center text-[10px] text-green-600 font-medium bg-green-50 w-fit px-2 py-1 rounded-full">
                                    <ArrowRight className="size-3 mr-1" />
                                    12% increase
                                </div>
                            </div>

                            {/* Card 4: 6+ Years */}
                            <div className="md:col-span-2 bg-lime-100 rounded-3xl p-6 flex flex-col justify-center text-zinc-900">
                                <div className="text-4xl font-bold mb-2">24/7</div>
                                <div className="text-sm font-medium leading-tight opacity-80">
                                    Automated Support Coverage
                                </div>
                            </div>

                            {/* Card 5: Dark Tall (Next Row potentially? or fit in) - actually just filling grid */}
                            {/* Let's add a wide one below */}
                            <div className="md:col-span-5 bg-zinc-900 rounded-3xl p-8 text-white flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 bg-zinc-800 rounded-full p-8 opacity-50 group-hover:scale-110 transition-transform">
                                    <Zap className="size-12 text-lime-400" />
                                </div>
                                <div className="z-10">
                                    <div className="size-12 rounded-full border border-white/20 flex items-center justify-center mb-6">
                                        <Activity className="size-6 text-lime-400" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Achieve Optimal Efficiency</h3>
                                    <p className="text-zinc-400 text-sm">Boost productivity with AI triage.</p>
                                </div>
                            </div>

                            {/* Card 6: Image/Visual */}
                            <div className="md:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 min-h-[200px] flex items-center gap-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-50" />
                                <div className="relative z-10 grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-white shadow-lg rounded-xl p-4 border border-zinc-100 transform -rotate-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">AI</div>
                                            <div className="h-2 w-20 bg-zinc-100 rounded-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 w-full bg-zinc-50 rounded-full" />
                                            <div className="h-2 w-3/4 bg-zinc-50 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 text-white shadow-xl rounded-xl p-4 transform rotate-3 mt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-xs font-medium text-zinc-400">Response</div>
                                            <CheckCircle2 className="size-3 text-lime-400" />
                                        </div>
                                        <div className="text-xs">
                                            "Ticket resolved in 2s"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Background Elements */}
                    <div className="absolute top-20 left-10 animate-flt">
                        <div className="size-12 rounded-full border border-zinc-200 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                            <ArrowRight className="size-5 -rotate-45 text-zinc-400" />
                        </div>
                    </div>
                    <div className="absolute top-40 right-10 animate-flt-delayed">
                        <div className="size-10 rounded-lg bg-lime-100 flex items-center justify-center text-lime-700">
                            <MessageSquare className="size-5" />
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className="bg-primary py-24 text-primary-foreground">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Efficient and Integrated <br />
                                Support Services
                            </h2>
                            <p className="text-primary-foreground/80">
                                Simplify operations with our efficient, quality-focused services designed for modern scaling teams.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {[
                                { icon: Sparkles, title: "AI Production", desc: "Automated replies generated by LLMs." },
                                { icon: Layout, title: "Custom Dashboards", desc: "Real-time metrics tailored to you." },
                                { icon: Shield, title: "Quality Control", desc: "Sentiment analysis on every ticket." },
                                { icon: Globe2, title: "Global Innovation", desc: "Multi-language support built-in." },
                                { icon: Zap, title: "Instant Logistics", desc: "Route tickets to experts instantly." },
                                { icon: BarChart3, title: "Market Research", desc: "Analyze customer trends effortlessly." },
                            ].map((service, i) => (
                                <div key={i} className="group p-8 rounded-3xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10">
                                    <div className="flex items-start justify-between mb-8">
                                        <service.icon className="size-8 text-white group-hover:text-lime-300 transition-colors" />
                                        <ArrowRight className="size-5 text-white/50 group-hover:text-white -rotate-45 group-hover:rotate-0 transition-transform" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                                    <p className="text-sm text-white/60">
                                        {service.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 bg-zinc-900 text-zinc-500 border-t border-white/10 text-center text-sm">
                <div className="container mx-auto">
                    &copy; 2026 HiveMind Systems. All rights reserved.
                </div>
            </footer>
        </div>
    )
}
