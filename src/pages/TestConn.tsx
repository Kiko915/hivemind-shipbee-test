import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase'

function TestConn() {
    const [status, setStatus] = useState('Checking connection...')

    useEffect(() => {
        async function checkConnection() {
            // Try to fetch data. It might return empty, but if it doesn't error, we are good.
            const { data, error } = await supabase.from('tickets').select('*').limit(1)

            if (error) {
                console.error('Supabase error:', error)
                setStatus('❌ Connection Failed. Check console.')
            } else {
                setStatus('✅ Connected to Supabase!')
                console.log('Data:', data)
            }
        }
        checkConnection()
    }, [])

    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            <h1 className="text-2xl font-bold">{status}</h1>
        </div>
    )
}

export default TestConn