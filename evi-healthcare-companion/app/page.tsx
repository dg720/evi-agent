"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageCircle, Shield, MapPin, ChevronRight, AlertCircle, RotateCcw, Save } from "lucide-react"

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

const initialPromptSuggestions = [
  "Build my onboarding profile",
  "Start triage process",
  "How do I register with a GP?",
  "What NHS services am I eligible for?",
]

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    message: "Hi! I can help you navigate NHS services. What would you like to know?",
  },
]

const sampleProfile: ProfileDraft = {
  name: "Sana",
  age_range: "25-34",
  stay_length: "1 year (Masters)",
  postcode: "NW8",
  visa_status: "Student visa",
  gp_registered: "Not yet",
  conditions: "None",
  medications: "None",
  lifestyle_focus: "Sleep and stress",
  mental_wellbeing: "Doing okay, settling in",
}

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

const exampleResponses = [
  {
    question: "I just arrived. How do I register with a GP?",
    response:
      "You can register with a GP near your London address. Most practices accept online forms. Bring ID and proof of address if asked. I can find nearby practices if you share your full postcode.",
  },
  {
    question: "I feel unwell. What should I do?",
    response:
      "I can guide you through an NHS 111 style triage to decide the right service. We will start with a few quick questions about symptoms and urgency.",
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

export default function Home() {
  const [chatInput, setChatInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [promptSuggestions, setPromptSuggestions] = useState(initialPromptSuggestions)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([])
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(sampleProfile)
  const [profileLabel, setProfileLabel] = useState("Sample onboarding profile")
  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const chatSectionRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isThinking])

  const focusChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth" })
    setTimeout(() => inputRef.current?.focus(), 350)
  }

  const focusHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const resetChat = () => {
    setSessionId(null)
    setMessages(initialMessages)
    setPromptSuggestions(initialPromptSuggestions)
    setErrorMessage(null)
    setUsefulLinks([])
    setProfileDraft(sampleProfile)
    setProfileLabel("Sample onboarding profile")
    setProfileSaveStatus("idle")
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
      setProfileDraft(buildProfileDraft(payload.user_profile || emptyProfile))
      setProfileLabel("Saved profile")
      setProfileSaveStatus("saved")
    } catch (error) {
      setProfileSaveStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Could not save profile.")
    }
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
      if (Array.isArray(payload.prompt_suggestions) && payload.prompt_suggestions.length > 0) {
        setPromptSuggestions(payload.prompt_suggestions)
      }
      if (Array.isArray(payload.useful_links)) {
        setUsefulLinks(payload.useful_links)
      }
      if (payload.user_profile && Object.keys(payload.user_profile).length > 0) {
        setProfileDraft(buildProfileDraft(payload.user_profile))
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
        <section className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-32">
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
                onClick={focusHowItWorks}
              >
                See how it works
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-serif text-2xl font-bold text-sand mb-6 text-center">Quick start prompts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promptSuggestions.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="border-sand/30 text-sand hover:bg-sand/10 hover:border-sand/50 justify-start text-left h-auto py-4 px-6 animate-fade-in bg-transparent"
                  style={{ animationDelay: `${idx * 100 + 200}ms` }}
                  onClick={() => sendMessage(prompt)}
                >
                  <ChevronRight className="mr-2 h-4 w-4 flex-shrink-0 text-teal" />
                  <span className="text-base">{prompt}</span>
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section ref={chatSectionRef} className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
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
                  onClick={resetChat}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  New chat
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{exchange.message}</p>
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
                <Button onClick={() => sendMessage(chatInput)} className="bg-teal hover:bg-teal/90 text-white px-6">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          </div>
        </section>

        <section ref={howItWorksRef} className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h3 className="font-serif text-2xl font-bold text-sand">How it works</h3>
              <span className="text-sm text-sand/70">{profileLabel}</span>
            </div>
            <Card className="bg-sand/95 border-sand/50 p-8 shadow-2xl backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-serif text-xl font-bold text-navy mb-4">Onboarding profile</h4>
                  <p className="text-navy/70 mb-6">
                    Edit these details any time. When onboarding finishes, this view updates automatically.
                  </p>
                  <div className="space-y-4">
                    {profileFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-semibold text-navy mb-2">{field.label}</label>
                        <input
                          type="text"
                          value={profileDraft[field.key as keyof ProfileDraft]}
                          onChange={(e) => handleProfileChange(field.key as keyof ProfileDraft, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border border-navy/20 px-4 py-2 text-sm text-navy"
                        />
                      </div>
                    ))}
                    {profileTextAreas.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-semibold text-navy mb-2">{field.label}</label>
                        <textarea
                          value={profileDraft[field.key as keyof ProfileDraft]}
                          onChange={(e) => handleProfileChange(field.key as keyof ProfileDraft, e.target.value)}
                          placeholder={field.placeholder}
                          rows={2}
                          className="w-full rounded-lg border border-navy/20 px-4 py-2 text-sm text-navy"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-6">
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
                <div>
                  <h4 className="font-serif text-xl font-bold text-navy mb-4">Example responses</h4>
                  <div className="space-y-4">
                    {exampleResponses.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-navy/15 bg-white/70 p-4">
                        <p className="text-xs uppercase tracking-wide text-navy/50 mb-2">Student</p>
                        <p className="text-navy font-medium mb-3">{item.question}</p>
                        <p className="text-xs uppercase tracking-wide text-navy/50 mb-2">Evi</p>
                        <p className="text-navy/80 text-sm leading-relaxed">{item.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <Card className="max-w-4xl mx-auto bg-sand/95 border-sand/50 p-8 md:p-10 shadow-2xl backdrop-blur-sm animate-fade-in delay-100">
            <h2 className="font-serif text-3xl font-bold text-navy mb-6">How I can help</h2>
            <div className="prose prose-lg max-w-none text-navy/90 leading-relaxed">
              <p className="mb-4">
                Hi there, welcome to the LBS Community! My name is Evi - Your LBS Healthcare Companion.
              </p>
              <p className="mb-4">
                Now that you have made it to London, I am sure you have a lot of questions about navigating the NHS and
                LBS wellbeing services.
              </p>
              <p className="mb-4">Feel free to start with one of the examples below to get you oriented.</p>
              <ul className="space-y-2 mb-4">
                <li>Better understand when and how to use NHS services (GP, NHS 111, A&amp;E, and more!)</li>
                <li>Locate mental health or wellbeing support</li>
                <li>Get more information about preventative-care guidance</li>
              </ul>
              <p className="text-teal font-semibold">
                Or, type "onboarding" at any time, and I will ask a few brief questions to get to know you better.
              </p>
            </div>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-coral/90 border-coral p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-8 w-8 text-white flex-shrink-0" />
                <div>
                  <h3 className="font-serif text-xl font-bold text-white mb-2">Emergency information</h3>
                  <p className="text-white/95 leading-relaxed">
                    If you are in immediate danger, call 999. For urgent advice, use NHS 111.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-serif text-2xl font-bold text-sand mb-6 text-center">Useful links</h3>
            <Card className="bg-sand/95 border-sand/50 p-8 shadow-2xl backdrop-blur-sm">
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
        </section>

        <footer className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-sand/60" />
              <p className="text-sand/80 leading-relaxed">
                Evi is informational only and does not provide medical advice.
              </p>
            </div>
            <p className="text-sand/60 text-sm">(c) 2025 LBS Healthcare Companion</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
