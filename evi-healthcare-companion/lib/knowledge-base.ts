export type KnowledgeSource = {
  title: string
  url: string
}

export type KnowledgeArticle = {
  id: string
  title: string
  summary: string
  content: string
  version: string
  updatedAt: string
  tags: string[]
  sources: KnowledgeSource[]
}

export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: "nhs-overview",
    title: "How the NHS works",
    summary: "A short primer on NHS services, access routes, and what is free at the point of use.",
    content:
      "The NHS provides most healthcare services in the UK and is funded by taxation.\n\nYou can access care in several ways: register with a GP for routine care, use NHS 111 for urgent guidance, visit a pharmacist for minor conditions, and go to A&E for emergencies.\n\nInternational students may be asked about visa status or length of stay, but urgent and emergency care is always available.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["nhs", "eligibility", "services"],
    sources: [
      { title: "NHS services guide", url: "https://www.nhs.uk/using-the-nhs/nhs-services/" },
    ],
  },
  {
    id: "gp-registration",
    title: "Registering with a GP",
    summary: "How to register, what documents to bring, and what to expect.",
    content:
      "Registering with a GP gives you access to routine care, referrals, and prescriptions.\n\nMost practices allow online registration. You may be asked for ID or proof of address, but you can still register if you do not have these yet. Registration is usually free.\n\nIf you need urgent advice before registration is complete, use NHS 111.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["gp", "register"],
    sources: [
      {
        title: "Register with a GP",
        url: "https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/",
      },
    ],
  },
  {
    id: "care-options",
    title: "GP vs Pharmacy vs NHS 111 vs A&E",
    summary: "How to choose the right service for different situations.",
    content:
      "Use a GP for non-urgent issues, ongoing conditions, or referrals.\n\nUse a pharmacist for minor illnesses, self-care advice, and over-the-counter treatments.\n\nUse NHS 111 for urgent problems when you are not sure what to do or need advice outside GP hours.\n\nUse A&E for emergencies such as chest pain, severe bleeding, or trouble breathing.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["111", "a&e", "pharmacy", "urgent", "emergency"],
    sources: [
      { title: "NHS 111", url: "https://111.nhs.uk/" },
      { title: "NHS services guide", url: "https://www.nhs.uk/using-the-nhs/nhs-services/" },
    ],
  },
  {
    id: "prescriptions-costs",
    title: "Prescriptions and costs",
    summary: "What is free, what may cost money, and where to check exemptions.",
    content:
      "Prescriptions in England usually have a fixed charge per item, with exemptions for certain conditions, ages, and circumstances.\n\nIf you are unsure about eligibility, ask your GP practice or pharmacist, or check NHS guidance. Dental and optical services can have separate charges.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["costs", "prescriptions", "eligibility"],
    sources: [
      { title: "Help with health costs", url: "https://www.nhs.uk/nhs-services/help-with-health-costs/" },
    ],
  },
  {
    id: "mental-health",
    title: "Mental health services",
    summary: "Support routes, urgent help, and LBS wellbeing resources.",
    content:
      "You can speak to your GP about mental health and ask for talking therapies or support services.\n\nIf you feel unsafe or at immediate risk, call 999. For urgent mental health advice, you can contact NHS 111 and request crisis support.\n\nLBS provides wellbeing services and mental health support for students.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["mental", "wellbeing"],
    sources: [
      {
        title: "LBS mental wellbeing support",
        url: "https://www.london.edu/masters-experience/student-support/mental-health",
      },
      { title: "NHS 111", url: "https://111.nhs.uk/" },
    ],
  },
  {
    id: "common-myths",
    title: "Common myths",
    summary: "Clarifying common misunderstandings about UK healthcare.",
    content:
      "Myth: You need a National Insurance number to register with a GP. Fact: You can register without one.\n\nMyth: A&E is for any health issue. Fact: A&E is for emergencies; use GP, pharmacy, or NHS 111 for non-emergency issues.\n\nMyth: International students cannot access NHS care. Fact: Access depends on visa status and residency, but urgent care is always available.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["myths", "eligibility"],
    sources: [
      { title: "NHS services guide", url: "https://www.nhs.uk/using-the-nhs/nhs-services/" },
    ],
  },
]
