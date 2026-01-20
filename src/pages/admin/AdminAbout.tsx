import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminAbout() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">About HiveMind</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        System information and credits.
                    </p>
                </div>
            </div>

            <Card className="shadow-none border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>HiveMind Support Platform</CardTitle>
                        <Badge variant="secondary" className="font-mono">v1.0.0-beta</Badge>
                    </div>
                    <CardDescription>Next-generation customer service infrastructure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm text-zinc-600 dark:text-zinc-300">
                    <p className="leading-relaxed">
                        HiveMind is an intelligent customer support platform engineered to bridge the gap between businesses and their customers. By centralizing ticket management, automating workflows, and providing real-time insights, HiveMind empowers support teams to deliver exceptional service efficiency.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">Real-time Interaction</h5>
                            <p className="text-xs text-zinc-500">Instant messaging and live ticket updates via Supabase Realtime.</p>
                        </div>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">Smart Analytics</h5>
                            <p className="text-xs text-zinc-500">Comprehensive insights into team performance and user satisfaction.</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Developed by</h4>
                        <p className="text-base font-medium">Francis Mistica</p>
                        <p className="text-xs text-zinc-400 mt-1">Lead Developer</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
