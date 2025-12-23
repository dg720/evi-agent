"use client"

import Link from "next/link"

export default function HowEviWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-[#1a2942] text-sand">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="text-teal text-sm font-semibold">
          Back to Evi
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-4 mb-6">How Evi works</h1>
        <div className="space-y-6 text-sand/90">
          <p>
            Evi is an informational assistant that helps international students navigate UK healthcare services.
            It provides guidance about which NHS service to use, how to register with a GP, and how to access
            urgent support.
          </p>
          <p>
            Evi uses a rule-based onboarding flow and a triage tool aligned to NHS 111 guidance. It does not
            diagnose or provide medical treatment.
          </p>
          <p className="text-sm text-sand/70">
            Sources:{" "}
            <a className="underline" href="https://www.nhs.uk/using-the-nhs/nhs-services/" target="_blank" rel="noreferrer">
              NHS services guide
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
