import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import supabase from '@/utils/supabase'
import { Loader2 } from 'lucide-react'

export default function AdminGuard() {
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const location = useLocation()

    useEffect(() => {
        checkAdmin()
    }, [])

    const checkAdmin = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setLoading(false)
                return
            }

            // Check profile role
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (error || !profile || profile.role !== 'admin') {
                setIsAdmin(false)
            } else {
                setIsAdmin(true)
            }
        } catch (error) {
            console.error('Error checking admin status:', error)
            setIsAdmin(false)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isAdmin) {
        // If they are not logged in or not an admin, redirect to login
        return <Navigate to="/admin/login" state={{ from: location }} replace />
    }

    return <Outlet />
}
