import { Button } from "@/components/ui/button"

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
            <h1 className="text-4xl font-bold tracking-tight">Welcome to HiveMind</h1>
            <p className="text-muted-foreground text-lg">
                Intelligent Support System
            </p>
            <div className="flex gap-4">
                <Button>Get Started</Button>
                <Button variant="outline">Learn More</Button>
            </div>
        </div>
    )
}
