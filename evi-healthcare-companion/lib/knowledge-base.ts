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
  {
    id: "international-students-access",
    title: "International students and NHS access",
    summary: "Student-focused guidance on NHS access, eligibility, and what to expect.",
    content:
      "International students can access NHS services depending on visa status, length of stay, and residency.\n\nUKCISA provides student-focused guidance on healthcare entitlement and the NHS surcharge. If you are unsure about eligibility, check the latest guidance or ask your university support team.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["students", "eligibility", "nhs"],
    sources: [
      {
        title: "UKCISA: Health and healthcare",
        url: "https://www.ukcisa.org.uk/Information--Advice/Studying--living-in-the-UK/Health-and-healthcare",
      },
    ],
  },
  {
    id: "pharmacy-services",
    title: "Pharmacy services and minor illness care",
    summary: "What pharmacists can help with and when to use a pharmacy first.",
    content:
      "Pharmacists can provide advice for minor illnesses, self-care guidance, and over-the-counter treatments.\n\nIf symptoms are mild and you can function normally, a pharmacy is often the quickest route. If symptoms worsen or you are unsure, use NHS 111 or contact a GP.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["pharmacy", "self-care", "urgent"],
    sources: [{ title: "Pharmacies", url: "https://www.nhs.uk/nhs-services/pharmacies/" }],
  },
  {
    id: "nhs-dentist",
    title: "Finding an NHS dentist",
    summary: "How to find an NHS dentist and what to expect for dental care.",
    content:
      "Dental services in the UK are separate from GP services and can involve charges.\n\nUse the NHS dentist search to find a practice near you and ask about availability. For urgent dental problems, NHS 111 can advise where to go.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["dentist", "costs", "services"],
    sources: [
      {
        title: "How to find an NHS dentist",
        url: "https://www.nhs.uk/nhs-services/dentists/how-to-find-an-nhs-dentist/",
      },
      { title: "NHS 111", url: "https://111.nhs.uk/" },
    ],
  },
  {
    id: "sexual-health",
    title: "Sexual health services",
    summary: "Where to access confidential sexual health advice and clinics.",
    content:
      "Sexual health services are confidential and often free. You can access testing, contraception, and advice through local sexual health clinics.\n\nUse the NHS service finder to locate a clinic near you.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["sexual-health", "services", "students"],
    sources: [
      { title: "Sexual health services", url: "https://www.nhs.uk/service-search/sexual-health" },
    ],
  },
  {
    id: "vaccinations",
    title: "Vaccinations and immunisations",
    summary: "General NHS vaccination guidance and how to stay up to date.",
    content:
      "Vaccinations protect you and those around you. You can discuss recommended vaccines with your GP or local clinic.\n\nNHS guidance lists routine and seasonal vaccines and eligibility criteria.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["vaccinations", "prevention", "students"],
    sources: [{ title: "Vaccinations", url: "https://www.nhs.uk/vaccinations/" }],
  },
  {
    id: "prescription-savings",
    title: "Saving money on prescriptions",
    summary: "How prescription charges work and ways to reduce costs.",
    content:
      "Prescription charges apply in England, but you may be eligible for exemptions or cost-saving options.\n\nIf you need multiple prescriptions, a prepayment certificate can reduce costs. Check NHS guidance for the latest details.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["prescriptions", "costs", "eligibility"],
    sources: [
      {
        title: "Prescription prepayment certificate (PPC)",
        url: "https://www.nhs.uk/nhs-services/prescriptions/save-money-with-a-prescription-prepayment-certificate-ppc/",
      },
    ],
  },
  {
    id: "fit-note",
    title: "Sick notes and fit notes",
    summary: "When you need a fit note and how to request one.",
    content:
      "If you are off sick from work or study for more than 7 days, you may need a fit note from a GP or hospital.\n\nNHS guidance explains when a fit note is required and how to request one.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["gp", "work", "students"],
    sources: [
      { title: "Getting a fit note", url: "https://www.nhs.uk/nhs-services/gps/getting-a-fit-note/" },
    ],
  },
  {
    id: "lbs-student-support",
    title: "LBS student support and wellbeing",
    summary: "How to access LBS wellbeing services and student support.",
    content:
      "LBS provides student support services, including wellbeing and mental health resources.\n\nUse LBS support pages for up-to-date services, referrals, and contact details.",
    version: "1.0.0",
    updatedAt: "2025-01-10",
    tags: ["students", "wellbeing", "lbs"],
    sources: [
      {
        title: "LBS student support",
        url: "https://www.london.edu/masters-experience/student-support",
      },
    ],
  },
]
