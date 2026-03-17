"use client"

import { useState, useEffect, useCallback } from "react"
import { Feather, MapPin, Check, Pencil, ChevronDown, ChevronUp, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Person {
  name: string
  relation: string
}

interface Memory {
  id: string
  text: string
  persons: Person[]
  event?: {
    name: string
    location?: string
  }
  timestamp: Date
  isRawNote?: boolean
}

interface ExtractionResult {
  persons: Person[]
  event?: {
    name: string
    location?: string
  }
}

const placeholderExamples = [
  "Met Ramesh uncle at Rohit's wedding. He's dad's cousin. Works in Dubai...",
  "Priya mentioned she's in second year MBBS at Madras Medical College...",
  "Ran into Karthik at the airport. He's Anand's brother-in-law. Moving to Canada next month.",
  "Spoke with Meera aunty at the temple. She's mom's college friend. Her son just got engaged...",
  "Bumped into Vikram at the gym. He works with Arjun at TCS. Planning to start a business..."
]

// Simulated extraction function - in production, this would call an AI API
function extractMemoryDetails(text: string): ExtractionResult {
  const result: ExtractionResult = { persons: [] }
  
  // Simple pattern matching for demo purposes
  const namePatterns = [
    { pattern: /([A-Z][a-z]+)\s+(uncle|aunty|aunt)/gi, relation: "family" },
    { pattern: /([A-Z][a-z]+)'s\s+(brother|sister|cousin|friend|wife|husband)/gi, relation: "connection" },
    { pattern: /([A-Z][a-z]+)\s+mentioned/gi, relation: "acquaintance" },
    { pattern: /Met\s+([A-Z][a-z]+)/gi, relation: "met" },
    { pattern: /with\s+([A-Z][a-z]+)/gi, relation: "mentioned" },
  ]

  const foundNames = new Set<string>()
  
  namePatterns.forEach(({ pattern, relation }) => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1]
      if (!foundNames.has(name.toLowerCase())) {
        foundNames.add(name.toLowerCase())
        result.persons.push({ name, relation })
      }
    }
  })

  // Detect events/locations
  const eventPatterns = [
    /at\s+(?:the\s+)?([A-Z][a-z]+(?:'s)?\s+(?:wedding|party|function|ceremony))/i,
    /at\s+(?:the\s+)?([A-Z][a-z]+\s+(?:airport|station|mall|temple|church|mosque))/i,
    /at\s+(?:the\s+)?([A-Z][a-z]+\s+(?:College|University|Institute|School))/i,
  ]

  for (const pattern of eventPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.event = { name: match[1], location: match[1] }
      break
    }
  }

  return result
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function MemoryLogger() {
  const [memoryText, setMemoryText] = useState("")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([
    {
      id: "1",
      text: "Met Suresh uncle at Anita's engagement. He's dad's younger brother from Coimbatore. He mentioned his daughter is doing MBA at IIM Bangalore.",
      persons: [{ name: "Suresh", relation: "family" }, { name: "Anita", relation: "connection" }],
      event: { name: "Anita's engagement", location: "Coimbatore" },
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: "2", 
      text: "Priya called yesterday. She's Kavitha's roommate from college. Working at Google now. She's looking for a flat in Indiranagar.",
      persons: [{ name: "Priya", relation: "acquaintance" }, { name: "Kavitha", relation: "friend" }],
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: "3",
      text: "Ran into Deepak at Reliance Fresh. He's Mohan's colleague from the Chennai office. Just got transferred to Bangalore.",
      persons: [{ name: "Deepak", relation: "met" }, { name: "Mohan", relation: "connection" }],
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ])
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null)

  // Cycle through placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleExtract = useCallback(() => {
    if (!memoryText.trim()) return
    
    setIsExtracting(true)
    
    // Simulate API delay
    setTimeout(() => {
      const result = extractMemoryDetails(memoryText)
      setExtraction(result)
      setIsExtracting(false)
    }, 800)
  }, [memoryText])

  const handleConfirmSave = () => {
    if (!extraction) return

    const newMemory: Memory = {
      id: Date.now().toString(),
      text: memoryText,
      persons: extraction.persons,
      event: extraction.event,
      timestamp: new Date(),
      isRawNote: extraction.persons.length === 0
    }

    setMemories([newMemory, ...memories])
    setMemoryText("")
    setExtraction(null)
  }

  const handleEdit = () => {
    setExtraction(null)
  }

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (extraction) {
          handleConfirmSave()
        } else if (memoryText.trim()) {
          handleExtract()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [memoryText, extraction, handleExtract])

  return (
    <div className="space-y-8">
      {/* Memory Logger Section */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Feather className="h-5 w-5 text-primary" />
            Log a Memory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              placeholder={placeholderExamples[placeholderIndex]}
              className="min-h-[120px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
              disabled={isExtracting}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {memoryText.length} characters
            </div>
          </div>

          {!extraction && (
            <>
              <Button 
                onClick={handleExtract}
                disabled={!memoryText.trim() || isExtracting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isExtracting ? "Extracting..." : "Extract & Save Memory"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">⌘</kbd>
                {" + "}
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">Enter</kbd>
                {" to save"}
              </p>
            </>
          )}

          {/* Extraction Preview */}
          {extraction && (
            <Card className="border-primary/30 bg-card/50">
              <CardContent className="pt-4 space-y-4">
                <h4 className="font-medium text-foreground">Found in your memory:</h4>
                
                {extraction.persons.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {extraction.persons.map((person, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {getInitials(person.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">{person.name}</span>
                          <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                            {person.relation}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {extraction.event && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{extraction.event.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-primary">
                    Saved as raw note — no people detected
                  </p>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleConfirmSave}
                    className="flex-1 bg-[#22c55e] hover:bg-[#22c55e]/90 text-[#0f0e0d]"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Save
                  </Button>
                  <Button 
                    onClick={handleEdit}
                    variant="outline"
                    className="border-border text-foreground hover:bg-secondary"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Memory Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Memory Feed</h2>
        
        <div className="space-y-3">
          {memories.map((memory) => (
            <Card key={memory.id} className="border-border bg-card">
              <CardContent className="pt-4 space-y-3">
                <p className={`text-foreground ${expandedMemory === memory.id ? "" : "line-clamp-2"}`}>
                  {memory.text}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {memory.persons.map((person, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1.5 bg-secondary rounded-full px-2 py-1"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground">{person.name}</span>
                    </div>
                  ))}
                  
                  {memory.event && (
                    <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                      <MapPin className="h-3 w-3 mr-1" />
                      {memory.event.name}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {getRelativeTime(memory.timestamp)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedMemory(
                      expandedMemory === memory.id ? null : memory.id
                    )}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {expandedMemory === memory.id ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Expand
                      </>
                    )}
                  </Button>
                </div>

                {memory.isRawNote && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <User className="h-3 w-3" />
                    Raw note — no people detected
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
