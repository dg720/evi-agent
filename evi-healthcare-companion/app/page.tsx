"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ClipboardList,
  MessageCircle,
  Shield,
  MapPin,
  ChevronRight,
  RotateCcw,
} from "lucide-react"

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
    message:
      "Hi! I can guide you on NHS pathways, GP registration, and next steps for common health concerns. How can I help?",
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

const onboardingLinks: UsefulLink[] = [
  { title: "NHS services guide", url: "https://www.nhs.uk/using-the-nhs/nhs-services/" },
  { title: "Register with a GP", url: "https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/" },
]

const isProfileComplete = (profile: ProfileDraft | null) => {
  if (!profile) return false
  const requiredFields: Array<keyof ProfileDraft> = [
    "age_range",
    "stay_length",
    "postcode",
    "visa_status",
    "gp_registered",
  ]
  return requiredFields.every((key) => String(profile[key]).trim().length > 0)
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
  const [triageActive, setTriageActive] = useState(false)
  const [triageNotice, setTriageNotice] = useState(
    "Note: This triage is experimental and not medical advice. For urgent concerns, use NHS 111 at https://111.nhs.uk/."
  )
  const [triageNoticeOpen, setTriageNoticeOpen] = useState(false)
  const [triageNoticeSeen, setTriageNoticeSeen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null)
  const chatSectionRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const showRelatedLinks = isProfileComplete(savedProfile)
  const linksToShow = showRelatedLinks ? usefulLinks : onboardingLinks

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
    setSavedProfile(
      Object.values(session.profileSnapshot || {}).some((value) => String(value || "").trim())
        ? session.profileSnapshot
        : null
    )
    setProfileDraft(session.profileSnapshot || emptyProfile)
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
    if (!triageActive && triageNoticeSeen) {
      setTriageNoticeSeen(false)
    }
    if (!triageActive && triageNoticeOpen) {
      setTriageNoticeOpen(false)
    }
    if (triageActive && !triageNoticeSeen) {
      setTriageNoticeOpen(true)
      setTriageNoticeSeen(true)
    }
  }, [triageActive, triageNoticeSeen])

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

  const focusChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth" })
    setTimeout(() => inputRef.current?.focus(), 350)
  }

  const startNewChat = () => {
    const fresh = createNewSession()
    setSessions((prev) => [fresh, ...prev])
    loadSession(fresh)
    setErrorMessage(null)
    setTriageActive(false)
    setTriageNoticeOpen(false)
    setTriageNoticeSeen(false)
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
      }
      setTriageActive(Boolean(payload.triage_active))
      if (payload.triage_notice) {
        setTriageNotice(payload.triage_notice)
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
              Navigate UK Healthcare with Confidence
            </h1>

            <p className="text-xl md:text-2xl text-sand/80 mb-10 leading-relaxed text-pretty">
              Fast, friendly guidance for LBS students regarding the NHS and triage pathways.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="w-full sm:w-56 justify-center bg-teal hover:bg-teal/90 text-white font-semibold px-8 py-6 text-lg h-14"
                onClick={focusChat}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Start a chat
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-56 justify-center border-coral/40 text-white bg-coral hover:bg-coral/90 font-semibold px-8 py-6 text-lg h-14"
                onClick={() => {
                  focusChat()
                  sendMessage("Start onboarding")
                }}
              >
                <ClipboardList className="mr-2 h-5 w-5" />
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
                  <div />
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

                <Card className="relative overflow-hidden bg-sand/95 border-sand/50 p-6 shadow-2xl backdrop-blur-sm">
                  <div className="absolute inset-x-0 top-0 h-1 bg-teal/90" />
                  <div className="absolute -top-16 right-8 h-32 w-32 rounded-full bg-teal/10 blur-2xl" />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-navy/50">AI Agent</p>
                      <h4 className="text-lg font-semibold text-navy mt-2">Chat with Evi</h4>
                    </div>
                  </div>
                  <Dialog open={triageNoticeOpen} onOpenChange={setTriageNoticeOpen}>
                    <DialogContent className="bg-sand text-navy border-sand/60">
                      <DialogHeader>
                        <DialogTitle className="font-serif">Triage notice</DialogTitle>
                        <DialogDescription className="text-navy/70">
                          {triageNotice}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-wrap gap-3 justify-end">
                        <a
                          className="text-sm font-semibold text-teal hover:text-teal/80"
                          href="https://111.nhs.uk/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open NHS 111
                        </a>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                      placeholder="Ask a question"
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

                <Card className="relative overflow-hidden bg-sand/95 border-sand/50 p-8 shadow-2xl backdrop-blur-sm mt-8">
                  <div className="absolute inset-x-0 top-0 h-1 bg-coral/90" />
                  <div className="absolute -top-16 right-8 h-32 w-32 rounded-full bg-coral/10 blur-2xl" />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-navy/50">
                        {showRelatedLinks ? "Guided by your profile" : "Onboarding essentials"}
                      </p>
                      <h4 className="text-lg font-semibold text-navy mt-2">Related Links</h4>
                    </div>
                    {showRelatedLinks ? (
                      <div className="hidden sm:flex items-center gap-2 rounded-full border border-navy/15 bg-white/70 px-3 py-1 text-xs text-navy/60">
                        Updated from your chat
                      </div>
                    ) : null}
                  </div>
                  {linksToShow.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-navy/20 bg-white/60 p-8 text-center text-navy/60">
                      Ask a question to see tailored NHS and LBS links here.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {linksToShow.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-navy/20 bg-white/80 px-4 py-3 hover:border-coral/60 hover:bg-white transition-all group animate-fade-in"
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
                          <MapPin className="h-5 w-5 text-coral flex-shrink-0" />
                          <span className="text-navy font-medium group-hover:text-coral transition-colors">{link.title}</span>
                          <ChevronRight className="h-4 w-4 text-navy/40 ml-auto group-hover:text-coral transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
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
            <div className="text-center"></div>
          </div>
        </footer>
      </div>
    </div>
  )
}
