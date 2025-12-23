"use client"

import Link from "next/link"

export default function ClinicalBoundariesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-[#1a2942] text-sand">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="text-teal text-sm font-semibold">
          Back to Evi
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-4 mb-6">Clinical boundaries</h1>
        <div className="space-y-6 text-sand/90">
          <p>Evi is not a clinician and does not provide diagnoses, prescriptions, or treatment plans.</p>
          <p>
            If you are unsure about symptoms or need medical advice, Evi will route you to the most appropriate NHS
            service such as NHS 111, a GP, or A&E.
          </p>
          <p className="text-sm text-sand/70">
            Source:{" "}
            <a className="underline" href="https://111.nhs.uk/" target="_blank" rel="noreferrer">
              NHS 111
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
