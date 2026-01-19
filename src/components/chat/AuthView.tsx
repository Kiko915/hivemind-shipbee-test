import { useState } from 'react'
import supabase from '@/utils/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function AuthView() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setMessage('Check your email for the confirmation link.')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="text-center">
                <h2 className="text-lg font-semibold text-primary">
                    {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h2>
                <p className="text-xs text-muted-foreground">
                    {isSignUp
                        ? 'Sign up to start chatting with support'
                        : 'Sign in to access your support tickets'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}
                {message && <p className="text-xs text-green-600">{message}</p>}

                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                        <Loader2 className="animate-spin" />
                    ) : isSignUp ? (
                        'Sign Up'
                    ) : (
                        'Sign In'
                    )}
                </Button>
            </form>

            <div className="text-center text-xs">
                <span className="text-muted-foreground">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </span>
                <button
                    type="button"
                    onClick={() => {
                        setIsSignUp(!isSignUp)
                        setError(null)
                        setMessage(null)
                    }}
                    className="text-primary hover:underline font-medium"
                >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
            </div>
        </div>
    )
}
