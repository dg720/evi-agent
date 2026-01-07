"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MessageCircle,
  Shield,
  MapPin,
  ChevronRight,
  RotateCcw,
  Save,
  Search,
} from "lucide-react"
import { knowledgeBase, type KnowledgeArticle } from "@/lib/knowledge-base"

type ChatMessage = {
  role: "assistant" | "user"
  message: string
}

type UsefulLink = {
  title: string
  url: string
}

type ProfileDraft = {
  name: string
  age_range: string
  stay_length: string
  postcode: string
  visa_status: string
  gp_registered: string
  conditions: string
  medications: string
  lifestyle_focus: string
  mental_wellbeing: string
}

type ChatSession = {
  id: string
  sessionId: string | null
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
  tags: string[]
  profileSnapshot: ProfileDraft
  usefulLinks: UsefulLink[]
}

type TrustItem = {
  key: string
  title: string
  description: string
  sourceLabel: string
  sourceUrl: string
}

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    message: "Hi! I can help you navigate NHS services. What would you like to know?",
  },
]

const SESSION_STORAGE_KEY = "evi_chat_sessions_v1"

const trustItems: TrustItem[] = [
  {
    key: "how",
    title: "How Evi works",
    description:
      "Evi is an informational assistant that helps international students navigate UK healthcare services. It provides guidance on which NHS service to use, how to register with a GP, and how to access urgent support. Evi uses a rule-based onboarding flow and a triage tool aligned to NHS 111 guidance. It does not diagnose or provide treatment.",
    sourceLabel: "NHS services guide",
    sourceUrl: "https://www.nhs.uk/using-the-nhs/nhs-services/",
  },
  {
    key: "boundaries",
    title: "Clinical boundaries",
    description:
      "Evi is not a clinician and does not provide diagnoses, prescriptions, or treatment plans. If you are unsure about symptoms or need medical advice, Evi will route you to the most appropriate NHS service such as NHS 111, a GP, or A&E.",
    sourceLabel: "NHS 111",
    sourceUrl: "https://111.nhs.uk/",
  },
  {
    key: "emergency",
    title: "Emergency handling",
    description:
      "If you are in immediate danger, call 999. Evi will flag emergency symptoms and direct you to the right service, but it cannot monitor your safety or act on your behalf.",
    sourceLabel: "NHS urgent and emergency care",
    sourceUrl: "https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/",
  },
  {
    key: "privacy",
    title: "Data and privacy",
    description:
      "Evi stores chat history in your browser so you can revisit past conversations. No clinical records are created. If you share personal information, it is used to personalize guidance and help you find relevant services. You can clear sessions at any time.",
    sourceLabel: "Your NHS data matters",
    sourceUrl: "https://www.nhs.uk/your-nhs-data-matters/",
  },
]

const profileFields = [
  { key: "name", label: "Name", placeholder: "Optional" },
  { key: "age_range", label: "Age range", placeholder: "e.g., 18-24" },
  { key: "stay_length", label: "UK stay length", placeholder: "e.g., 9 months" },
  { key: "postcode", label: "Postcode or area", placeholder: "e.g., NW8 9HU" },
  { key: "visa_status", label: "Visa or status", placeholder: "e.g., student" },
  { key: "gp_registered", label: "GP registered?", placeholder: "Yes / No" },
]

const profileTextAreas = [
  { key: "conditions", label: "Long-term conditions", placeholder: "Optional" },
  { key: "medications", label: "Medications or treatment", placeholder: "Optional" },
  { key: "lifestyle_focus", label: "Lifestyle focus", placeholder: "e.g., fitness" },
  { key: "mental_wellbeing", label: "Mental wellbeing", placeholder: "Optional" },
]

const emptyProfile: ProfileDraft = {
  name: "",
  age_range: "",
  stay_length: "",
  postcode: "",
  visa_status: "",
  gp_registered: "",
  conditions: "",
  medications: "",
  lifestyle_focus: "",
  mental_wellbeing: "",
}

const buildProfileDraft = (raw: Record<string, unknown>): ProfileDraft => {
  return {
    name: String(raw.name ?? ""),
    age_range: String(raw.age_range ?? ""),
    stay_length: String(raw.stay_length ?? ""),
    postcode: String(raw.postcode ?? ""),
    visa_status: String(raw.visa_status ?? ""),
    gp_registered: String(raw.gp_registered ?? ""),
    conditions: String(raw.conditions ?? ""),
    medications: String(raw.medications ?? ""),
    lifestyle_focus: String(raw.lifestyle_focus ?? ""),
    mental_wellbeing: String(raw.mental_wellbeing ?? ""),
  }
}

const formatMessage = (text: string) => {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  const bolded = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  return { __html: bolded.replace(/\n/g, "<br />") }
}

const createSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const formatTimestamp = (iso: string) => {
  const date = new Date(iso)
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const buildSessionTitle = (messages: ChatMessage[]) => {
  const firstUser = messages.find((msg) => msg.role === "user")
  if (!firstUser) return "New conversation"
  return firstUser.message.slice(0, 48)
}

const deriveTags = (messages: ChatMessage[]) => {
  const text = messages
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.message)
    .join(" ")
    .toLowerCase()
  const tags: string[] = []
  const rules: Array<[string, string[]]> = [
    ["gp", ["gp", "general practitioner", "register"]],
    ["111", ["111", "triage", "urgent"]],
    ["a&e", ["a&e", "a and e", "emergency"]],
    ["pharmacy", ["pharmacy", "pharmacist", "self-care"]],
    ["eligibility", ["eligible", "eligibility", "visa", "status"]],
    ["mental", ["mental", "wellbeing", "anxiety", "stress"]],
    ["prescriptions", ["prescription", "cost", "charges"]],
  ]
  rules.forEach(([tag, keywords]) => {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.push(tag)
    }
  })
  return Array.from(new Set(tags))
}

const buildExportText = (session: ChatSession) => {
  const profileLines = Object.entries(session.profileSnapshot || {})
    .map(([key, value]) => `${key}: ${value || "Not provided"}`)
    .join("\n")
  const header = [
    "Evi conversation export",
    "Disclaimer: Evi is informational only and not for emergencies.",
    `Created: ${session.createdAt}`,
    `Tags: ${session.tags.join(", ") || "None"}`,
    "Profile snapshot:",
    profileLines || "No profile saved",
    "",
  ].join("\n")

  const body = session.messages
    .map((msg) => `${msg.role === "user" ? "You" : "Evi"}: ${msg.message}`)
    .join("\n\n")
  return `${header}${body}`
}

const buildExportMarkdown = (session: ChatSession) => {
  const profileLines = Object.entries(session.profileSnapshot || {})
    .map(([key, value]) => `- ${key}: ${value || "Not provided"}`)
    .join("\n")
  const header = [
    "# Evi conversation export",
    "",
    "_Disclaimer: Evi is informational only and not for emergencies._",
    "",
    `- Created: ${session.createdAt}`,
    `- Tags: ${session.tags.join(", ") || "None"}`,
    "",
    "## Profile snapshot",
    profileLines || "- No profile saved",
    "",
  ].join("\n")

  const body = session.messages
    .map((msg) => `**${msg.role === "user" ? "You" : "Evi"}:** ${msg.message}`)
    .join("\n\n")
  return `${header}${body}`
}

export default function Home() {
  const [chatInput, setChatInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([])
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfile)
  const [savedProfile, setSavedProfile] = useState<ProfileDraft | null>(null)
  const [profileLabel, setProfileLabel] = useState("No saved profile yet")
  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null)
  const [knowledgeSearch, setKnowledgeSearch] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)
  const [showAllArticles, setShowAllArticles] = useState(false)

  const chatSectionRef = useRef<HTMLDivElement>(null)
  const knowledgeRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const createNewSession = (): ChatSession => {
    const now = new Date().toISOString()
    return {
      id: createSessionId(),
      sessionId: null,
      title: "New conversation",
      createdAt: now,
      updatedAt: now,
      messages: initialMessages,
      tags: [],
      profileSnapshot: emptyProfile,
      usefulLinks: [],
    }
  }

  const loadSession = (session: ChatSession) => {
    setActiveSessionKey(session.id)
    setMessages(session.messages)
    setSessionId(session.sessionId)
    setUsefulLinks(session.usefulLinks)
    setProfileSaveStatus("idle")
    setSavedProfile(
      Object.values(session.profileSnapshot || {}).some((value) => String(value || "").trim())
        ? session.profileSnapshot
        : null
    )
    setProfileDraft(session.profileSnapshot || emptyProfile)
    setProfileLabel(
      Object.values(session.profileSnapshot || {}).some((value) => String(value || "").trim())
        ? "Saved profile"
        : "No saved profile yet"
    )
  }

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isThinking])

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ChatSession[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed)
          const mostRecent = [...parsed].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
          loadSession(mostRecent)
          return
        }
      } catch {
        // ignore invalid storage
      }
    }
    const fresh = createNewSession()
    setSessions([fresh])
    loadSession(fresh)
  }, [])

  useEffect(() => {
    if (!activeSessionKey) return
    setSessions((prev) => {
      const updated = prev.map((session) => {
        if (session.id !== activeSessionKey) return session
        const tags = deriveTags(messages)
        const title = buildSessionTitle(messages)
        return {
          ...session,
          sessionId,
          messages,
          usefulLinks,
          profileSnapshot: savedProfile || profileDraft,
          tags,
          title,
          updatedAt: new Date().toISOString(),
        }
      })
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated))
      }
      return updated
    })
  }, [activeSessionKey, messages, sessionId, usefulLinks, profileDraft, savedProfile])

  const filteredArticles = useMemo(() => {
    const term = knowledgeSearch.trim().toLowerCase()
    if (!term) return knowledgeBase
    return knowledgeBase.filter((article) => {
      return (
        article.title.toLowerCase().includes(term) ||
        article.summary.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term)
      )
    })
  }, [knowledgeSearch])

  const visibleArticles = useMemo(() => {
    if (showAllArticles) return filteredArticles
    return filteredArticles.slice(0, 6)
  }, [filteredArticles, showAllArticles])

  useEffect(() => {
    if (filteredArticles.length === 0) return
    if (!selectedArticle || !filteredArticles.some((article) => article.id === selectedArticle.id)) {
      setSelectedArticle(filteredArticles[0])
    }
  }, [filteredArticles, selectedArticle])

  const focusChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth" })
    setTimeout(() => inputRef.current?.focus(), 350)
  }

  const startNewChat = () => {
    const fresh = createNewSession()
    setSessions((prev) => [fresh, ...prev])
    loadSession(fresh)
    setErrorMessage(null)
    setProfileSaveStatus("idle")
    setSelectedArticle(null)
  }

  const handleProfileChange = (field: keyof ProfileDraft, value: string) => {
    setProfileDraft((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveProfile = async () => {
    setProfileSaveStatus("saving")
    setErrorMessage(null)

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          profile: profileDraft,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.detail || "Failed to save profile.")
      }

      const payload = await response.json()
      setSessionId(payload.session_id)
      const nextProfile = buildProfileDraft(payload.user_profile || emptyProfile)
      setProfileDraft(nextProfile)
      setSavedProfile(nextProfile)
      setProfileLabel("Saved profile")
      setProfileSaveStatus("saved")
    } catch (error) {
      setProfileSaveStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Could not save profile.")
    }
  }

  const exportConversation = (format: "txt" | "md" | "pdf") => {
    const session = sessions.find((item) => item.id === activeSessionKey)
    if (!session) return

    if (format === "txt") {
      const content = buildExportText(session)
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "evi-conversation.txt"
      link.click()
      URL.revokeObjectURL(url)
      return
    }

    if (format === "md") {
      const content = buildExportMarkdown(session)
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "evi-conversation.md"
      link.click()
      URL.revokeObjectURL(url)
      return
    }

    const content = buildExportMarkdown(session).replace(/\n/g, "<br />")
    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return
    printWindow.document.write(
      `<html><head><title>Evi conversation</title></head><body style="font-family: Arial, sans-serif; line-height:1.5;">${content}</body></html>`
    )
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }

  const sendMessage = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isThinking) return

    setMessages((prev) => [...prev, { role: "user", message: trimmed }])
    setChatInput("")
    setIsThinking(true)
    setErrorMessage(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          session_id: sessionId,
          message: trimmed,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.detail || "Failed to reach the assistant.")
      }

      const payload = await response.json()
      setSessionId(payload.session_id)
      setMessages((prev) => [...prev, { role: "assistant", message: payload.reply }])
      if (Array.isArray(payload.useful_links)) {
        setUsefulLinks(payload.useful_links)
      }
      if (payload.user_profile && Object.keys(payload.user_profile).length > 0) {
        const nextProfile = buildProfileDraft(payload.user_profile)
        setProfileDraft(nextProfile)
        setSavedProfile(nextProfile)
        setProfileLabel("Profile from onboarding")
      }
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError"
      const fallback = isAbort
        ? "The request timed out. Please try again."
        : "Something went wrong. Please try again."
      setErrorMessage(isAbort ? fallback : error instanceof Error ? error.message : fallback)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message:
            "Sorry, I ran into a connection issue. Please try again in a moment or refresh the page.",
        },
      ])
    } finally {
      clearTimeout(timeoutId)
      setIsThinking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-[#1a2942]">
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-96 h-96 bg-teal rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-coral rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        <section className="container mx-auto px-4 pt-16 pb-16 md:pt-24 md:pb-20">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-sand/10 border border-sand/30 rounded-full px-4 py-2 mb-6">
              <span className="text-sand text-sm font-medium">Built for LBS students</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-sand mb-6 text-balance">
              Navigate NHS services with confidence
            </h1>

            <p className="text-xl md:text-2xl text-sand/80 mb-10 leading-relaxed text-pretty">
              Fast, friendly guidance for GP registration, triage, eligibility, and next steps across UK care pathways.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-teal hover:bg-teal/90 text-white font-semibold px-8 py-6 text-lg"
                onClick={focusChat}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Start a chat
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-sand/30 text-sand hover:bg-sand/10 font-semibold px-8 py-6 text-lg bg-transparent"
                onClick={() => {
                  focusChat()
                  sendMessage("Start onboarding")
                }}
              >
                Start Onboarding
              </Button>
            </div>
          </div>
        </section>

        <section ref={chatSectionRef} className="container mx-auto px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-8">
              <div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <h3 className="font-serif text-2xl font-bold text-sand text-center sm:text-left">Live chat</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wide text-sand/70">
                      {sessionId ? "Session active" : "New session"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-sand/30 text-sand hover:bg-sand/10 bg-transparent"
                      onClick={startNewChat}
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      New chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-sand/30 text-sand hover:bg-sand/10 bg-transparent"
                      onClick={() => exportConversation("txt")}
                    >
                      Export
                    </Button>
                  </div>
                </div>

                <Card className="bg-sand/95 border-sand/50 p-6 shadow-2xl backdrop-blur-sm">
                  <div ref={chatScrollRef} className="space-y-4 mb-6 max-h-[420px] overflow-y-auto pr-2">
                    {messages.map((exchange, idx) => (
                      <div
                        key={idx}
                        className={`flex ${exchange.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                            exchange.role === "user"
                              ? "bg-teal text-white"
                              : "bg-navy/10 text-navy border border-navy/20"
                          }`}
                        >
                          <p
                            className="text-sm leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={formatMessage(exchange.message)}
                          ></p>
                        </div>
                      </div>
                    ))}
                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="bg-navy/10 text-navy border border-navy/20 rounded-2xl px-5 py-3">
                          <p className="text-sm italic">Thinking...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="mb-4 rounded-lg border border-coral/50 bg-coral/10 px-4 py-3 text-sm text-coral">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage(chatInput)}
                      placeholder="Ask a question or type 'onboarding'..."
                      className="flex-1 px-4 py-3 rounded-lg border-2 border-navy/20 focus:border-teal focus:outline-none bg-white text-navy placeholder:text-navy/50"
                    />
                    <Button
                      onClick={() => sendMessage(chatInput)}
                      className="bg-teal hover:bg-teal/90 text-white px-6"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>

                </Card>

                <Card className="bg-sand/95 border-sand/50 p-8 shadow-2xl backdrop-blur-sm mt-8">
                  <h4 className="text-sm font-semibold text-navy mb-4">Related Links</h4>
                  {usefulLinks.length === 0 ? (
                    <p className="text-navy/70 text-center">
                      Ask a question to see tailored NHS and LBS links here.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {usefulLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 rounded-lg border-2 border-navy/20 hover:border-teal hover:bg-teal/5 transition-all group animate-fade-in"
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
                          <MapPin className="h-5 w-5 text-teal flex-shrink-0" />
                          <span className="text-navy font-medium group-hover:text-teal transition-colors">{link.title}</span>
                          <ChevronRight className="h-4 w-4 text-navy/40 ml-auto group-hover:text-teal transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section ref={knowledgeRef} className="container mx-auto px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <Card className="bg-sand/95 border-sand/50 p-4 shadow-2xl backdrop-blur-sm">
              <Tabs defaultValue="knowledge" className="gap-4">
                <TabsList className="w-full flex flex-wrap justify-start gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="knowledge"
                    className="flex-none rounded-t-md border border-navy/10 bg-sand/60 px-3 py-1.5 text-sm font-semibold text-navy/70 data-[state=active]:bg-sand data-[state=active]:text-navy data-[state=active]:border-navy/20"
                  >
                    Knowledge base
                  </TabsTrigger>
                  <TabsTrigger
                    value="profile"
                    className="flex-none rounded-t-md border border-navy/10 bg-sand/60 px-3 py-1.5 text-sm font-semibold text-navy/70 data-[state=active]:bg-sand data-[state=active]:text-navy data-[state=active]:border-navy/20"
                  >
                    Edit profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex-none rounded-t-md border border-navy/10 bg-sand/60 px-3 py-1.5 text-sm font-semibold text-navy/70 data-[state=active]:bg-sand data-[state=active]:text-navy data-[state=active]:border-navy/20"
                  >
                    Chat history
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="knowledge">
                  <div className="rounded-lg border border-navy/10 bg-white/70 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <h4 className="font-serif text-lg font-bold text-navy">Knowledge base</h4>
                      <div className="flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-2">
                        <Search className="h-4 w-4 text-navy/70" />
                        <input
                          type="text"
                          value={knowledgeSearch}
                          onChange={(event) => setKnowledgeSearch(event.target.value)}
                          placeholder="Search NHS topics"
                          className="bg-transparent text-navy placeholder:text-navy/50 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
                      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
                        {visibleArticles.map((article) => (
                          <button
                            key={article.id}
                            className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                              selectedArticle?.id === article.id
                                ? "border-teal bg-teal/10 text-navy"
                                : "border-navy/10 text-navy/70 hover:border-teal/60"
                            }`}
                            onClick={() => setSelectedArticle(article)}
                          >
                            <p className="text-sm font-semibold">{article.title}</p>
                            <p className="text-xs text-navy/50 mt-1">{article.updatedAt}</p>
                          </button>
                        ))}
                        {filteredArticles.length > 6 && (
                          <button
                            className="w-full rounded-lg border border-navy/10 px-3 py-2 text-xs font-semibold text-navy/70 hover:border-teal/60 hover:text-teal transition-colors"
                            onClick={() => setShowAllArticles((prev) => !prev)}
                          >
                            {showAllArticles ? "Show fewer articles" : "Show more articles"}
                          </button>
                        )}
                      </div>
                      <div>
                        {selectedArticle ? (
                          <div>
                            <h4 className="font-serif text-xl font-bold text-navy">{selectedArticle.title}</h4>
                            <p className="text-xs text-navy/50 mt-1">
                              Version {selectedArticle.version} ÔÇó Updated {selectedArticle.updatedAt}
                            </p>
                            <div className="mt-4 space-y-4 text-sm text-navy/80">
                              {selectedArticle.content.split("\n\n").map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                              ))}
                            </div>
                            <div className="mt-4 text-xs text-navy/60">
                              Sources:{" "}
                              {selectedArticle.sources.map((source, idx) => (
                                <span key={source.url}>
                                  <a className="underline" href={source.url} target="_blank" rel="noreferrer">
                                    {source.title}
                                  </a>
                                  {idx < selectedArticle.sources.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-navy/60">
                            Select an article to view details and NHS sources.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="profile">
                  <div className="rounded-lg border border-navy/10 bg-white/70 p-4 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-navy">Onboarding profile</h4>
                        <p className="text-navy/70 mt-2">
                          Edit these details any time. When onboarding finishes, this view updates automatically.
                        </p>
                      </div>
                      <span className="text-xs text-navy/50">{profileLabel}</span>
                    </div>

                    <details className="group" open>
                      <summary className="cursor-pointer text-sm font-semibold text-teal">
                        Profile details
                      </summary>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileFields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-semibold text-navy/70 mb-2">{field.label}</label>
                            <input
                              type="text"
                              value={profileDraft[field.key as keyof ProfileDraft]}
                              onChange={(e) => handleProfileChange(field.key as keyof ProfileDraft, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy"
                            />
                          </div>
                        ))}
                      </div>
                    </details>

                    <details>
                      <summary className="cursor-pointer text-sm font-semibold text-teal">
                        Additional context
                      </summary>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileTextAreas.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-semibold text-navy/70 mb-2">{field.label}</label>
                            <textarea
                              value={profileDraft[field.key as keyof ProfileDraft]}
                              onChange={(e) => handleProfileChange(field.key as keyof ProfileDraft, e.target.value)}
                              placeholder={field.placeholder}
                              rows={2}
                              className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy"
                            />
                          </div>
                        ))}
                      </div>
                    </details>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={saveProfile} className="bg-teal hover:bg-teal/90 text-white">
                        <Save className="mr-2 h-4 w-4" />
                        {profileSaveStatus === "saving" ? "Saving..." : "Save profile"}
                      </Button>
                      {profileSaveStatus === "saved" && (
                        <span className="text-sm text-teal">Saved to this session.</span>
                      )}
                      {profileSaveStatus === "error" && (
                        <span className="text-sm text-coral">Could not save profile.</span>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  <div className="rounded-lg border border-navy/10 bg-white/70 p-4">
                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
                      {sessions.length === 0 ? (
                        <p className="text-xs text-navy/60">No saved sessions yet.</p>
                      ) : (
                        sessions.map((session) => (
                          <button
                            key={session.id}
                            className={`w-full text-left rounded-md border px-2.5 py-2 transition-colors ${
                              session.id === activeSessionKey
                                ? "border-teal bg-teal/10 text-navy"
                                : "border-navy/10 text-navy/70 hover:border-teal/60"
                            }`}
                            onClick={() => loadSession(session)}
                          >
                            <p className="text-sm font-semibold">{session.title}</p>
                            <p className="text-[11px] text-navy/50">{formatTimestamp(session.updatedAt)}</p>
                            <p className="text-[11px] text-navy/50 mt-1">
                              Tags: {session.tags.join(", ") || "None"}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </section>

        <footer className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="flex items-center gap-2 text-sand/80">
                <Shield className="h-4 w-4 text-sand/60" />
                <span className="text-sm font-semibold">Trust &amp; governance</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-sand/70">
                {trustItems.map((item) => (
                  <Dialog key={`footer-${item.key}`}>
                    <DialogTrigger asChild>
                      <button className="hover:text-sand transition-colors">
                        {item.title}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-sand text-navy border-sand/60">
                      <DialogHeader>
                        <DialogTitle className="font-serif">{item.title}</DialogTitle>
                        <DialogDescription className="text-navy/70">
                          {item.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="text-xs text-navy/60">
                        Source:{" "}
                        <a
                          className="underline"
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.sourceLabel}
                        </a>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
            <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-sand/60" />
              <p className="text-sand/80 leading-relaxed">
                Evi is informational only and does not provide medical advice.
              </p>
            </div>
            <p className="text-sand/60 text-sm">(c) 2025 LBS Healthcare Companion</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
