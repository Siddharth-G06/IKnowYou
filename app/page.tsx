import { MemoryLogger } from "@/components/memory-logger"
import { Brain } from "lucide-react"

export default function MemoriesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">IKnowYou</h1>
          </div>
          <p className="text-muted-foreground">
            Remember everyone you meet
          </p>
        </header>

        {/* Memory Logger Component */}
        <MemoryLogger />
      </div>
    </main>
  )
}
