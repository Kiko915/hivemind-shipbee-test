import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import supabase from '@/utils/supabase'
import {
    LayoutDashboard,
    Ticket,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [userEmail, setUserEmail] = useState<string>('')
    const navigate = useNavigate()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.email) {
                setUserEmail(session.user.email)
            }
        }
        getUser()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
        toast.success('Logged out successfully')
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
        { icon: Ticket, label: 'All Tickets', path: '/admin/tickets' },
        { icon: Users, label: 'Customers', path: '/admin/users' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ]

    const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${userEmail}`

    return (
        <div className="h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex transition-colors font-sans">
            {/* Sidebar - Enterprise Style */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 text-zinc-100 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static shadow-xl flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                    <img src="/hivemind_blue.png" alt="Logo" className="size-8 object-contain mr-3 grayscale brightness-200" />
                    <div className="flex flex-col">
                        <span className="font-bold text-base tracking-tight text-white leading-none">HiveMind</span>
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-1">Enterprise Portal</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Main Menu
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn("size-4 transition-colors")} />
                                    {item.label}
                                    {isActive && (
                                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/20" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                        <Avatar className="h-9 w-9 border border-zinc-700">
                            <AvatarImage src={avatarUrl} alt="Admin" />
                            <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                                {userEmail || 'Admin User'}
                            </p>
                            <p className="text-xs text-zinc-300 font-medium truncate flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                                Admin
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shadow-sm z-40">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden -ml-2 text-zinc-500"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </Button>
                        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight hidden sm:block">
                            Dashboard
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="pl-2 pr-1 h-9 gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                    <div className="flex flex-col items-end mr-1 hidden sm:flex">
                                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-none mb-0.5">{userEmail || 'Admin User'}</span>
                                        <span className="text-[10px] text-zinc-500 leading-none">Manage Access</span>
                                    </div>
                                    <Avatar className="h-7 w-7 border border-zinc-200 dark:border-zinc-700">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="text-[10px]">AD</AvatarFallback>
                                    </Avatar>
                                    <ChevronDown className="size-3 text-zinc-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />


                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                                    <LogOut className="mr-2 size-4 text-red-600" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}
