"use client"

import Link from "next/link"

export default function EmergencyHandlingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-[#1a2942] text-sand">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="text-teal text-sm font-semibold">
          Back to Evi
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-4 mb-6">Emergency handling</h1>
        <div className="space-y-6 text-sand/90">
          <p>If you are in immediate danger, call 999.</p>
          <p>
            Evi will flag emergency symptoms and direct you to the right service, but it cannot monitor your safety or
            act on your behalf.
          </p>
          <p className="text-sm text-sand/70">
            Sources:{" "}
            <a className="underline" href="https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/" target="_blank" rel="noreferrer">
              NHS urgent and emergency care
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
