"use client"

import Link from "next/link"

export default function DataPrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-[#1a2942] text-sand">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="text-teal text-sm font-semibold">
          Back to Evi
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-4 mb-6">Data and privacy</h1>
        <div className="space-y-6 text-sand/90">
          <p>
            Evi stores chat history in your browser so you can revisit past conversations. No clinical records are
            created.
          </p>
          <p>
            If you share personal information, it is used to personalize guidance and help you find relevant services.
            You can clear sessions at any time.
          </p>
          <p className="text-sm text-sand/70">
            For NHS privacy guidance, see{" "}
            <a className="underline" href="https://www.nhs.uk/your-nhs-data-matters/" target="_blank" rel="noreferrer">
              Your NHS data matters
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
