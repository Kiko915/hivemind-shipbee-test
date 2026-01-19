import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/utils/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error
            if (!user) throw new Error('Login failed')

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profileError) throw profileError

            if (profile?.role !== 'admin') {
                await supabase.auth.signOut()
                throw new Error('Unauthorized access. Admin role required.')
            }

            toast.success('Welcome back, Admin')
            navigate('/admin/dashboard')
        } catch (error: any) {
            toast.error(error.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-zinc-50 dark:bg-zinc-950">
            {/* Left Side: Branding & Aesthetics */}
            <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="relative z-10 flex items-center gap-2">
                    <img src="/hivemind_blue.png" alt="Logo" className="h-8 w-auto grayscale brightness-200" />
                    <span className="font-semibold tracking-tight text-lg">HiveMind Admin</span>
                </div>
                <div className="relative z-10 max-w-md">
                    <blockquote className="space-y-2">
                        <p className="text-2xl font-medium leading-relaxed text-zinc-200">
                            "Intelligence is not just about having knowledge, but about how you manage and apply it effectively."
                        </p>
                    </blockquote>
                </div>
                <div className="relative z-10 text-xs text-zinc-500">
                    &copy; 2026 HiveMind Inc. Enterprise Portal.
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex items-center justify-center p-8">
                <div className="w-full max-w-[350px] space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Authentication
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access the secure portal.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-medium">Work Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:ring-zinc-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="font-medium">Password</Label>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:ring-primary/20 focus-visible:border-primary pr-9"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-10 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 bg-primary hover:bg-primary/80 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-2 size-4" />
                                    Secure Login
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="px-8 text-center text-xs text-muted-foreground">
                        Restricted access. Unauthorized attempts are logged.
                    </p>
                </div>
            </div>
        </div>
    )
}
