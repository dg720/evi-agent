"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageCircle, Shield, MapPin, ChevronRight, AlertCircle, RotateCcw } from "lucide-react"

type ChatMessage = {
  role: "assistant" | "user"
  message: string
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

const onboardingSteps = [
  { id: 1, label: "Name (optional)", active: true },
  { id: 2, label: "Age range", active: false },
  { id: 3, label: "Length of stay", active: false },
  { id: 4, label: "Postcode", active: false },
  { id: 5, label: "Visa status", active: false },
  { id: 6, label: "GP status", active: false },
]

const triageFlow = [
  { step: "Severity check", status: "On a scale of 0-10, how severe are your symptoms?" },
  { step: "Red flags", status: "Any chest pain, breathing issues, or heavy bleeding?" },
  { step: "Next step", status: "Based on answers, I route you to the right NHS service." },
]

const usefulLinks = [
  { title: "Find a GP", url: "https://www.nhs.uk/service-search/find-a-gp" },
  { title: "Register with a GP", url: "https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/" },
  { title: "Use NHS 111 online", url: "https://111.nhs.uk/" },
  { title: "NHS services guide", url: "https://www.nhs.uk/using-the-nhs/nhs-services/" },
  { title: "LBS health and wellbeing", url: "https://www.london.edu/masters-experience/student-support" },
  {
    title: "LBS mental wellbeing support",
    url: "https://www.london.edu/masters-experience/student-support/mental-health",
  },
]

export default function Home() {
  const [chatInput, setChatInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [promptSuggestions, setPromptSuggestions] = useState(initialPromptSuggestions)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

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
  }

  const sendMessage = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isThinking) return

    setMessages((prev) => [...prev, { role: "user", message: trimmed }])
    setChatInput("")
    setIsThinking(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.")
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message:
            "Sorry, I ran into a connection issue. Please try again in a moment or refresh the page.",
        },
      ])
    } finally {
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
            <h3 className="font-serif text-2xl font-bold text-sand mb-6 text-center">Onboarding preview</h3>
            <Card className="bg-sand/95 border-sand/50 p-8 shadow-2xl backdrop-blur-sm">
              <p className="text-navy/80 mb-6 text-center leading-relaxed">One question at a time, no extra data.</p>
              <div className="space-y-4">
                {onboardingSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all animate-fade-in ${
                      step.active ? "border-teal bg-teal/10" : "border-navy/20 bg-white/50"
                    }`}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        step.active ? "bg-teal text-white" : "bg-navy/20 text-navy/60"
                      }`}
                    >
                      {step.id}
                    </div>
                    <span className={`font-medium ${step.active ? "text-teal" : "text-navy/60"}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-serif text-2xl font-bold text-sand mb-6 text-center">Triage preview</h3>
            <Card className="bg-sand/95 border-sand/50 p-8 shadow-2xl backdrop-blur-sm">
              <div className="space-y-6">
                {triageFlow.map((item, idx) => (
                  <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-teal rounded-full mt-2"></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-navy mb-1">{item.step}</h4>
                        <p className="text-navy/70 leading-relaxed">{item.status}</p>
                      </div>
                    </div>
                    {idx < triageFlow.length - 1 && <div className="ml-1 h-8 w-0.5 bg-teal/30 mt-2"></div>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
