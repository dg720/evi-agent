import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.text()
  const baseUrl =
    process.env.BACKEND_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000"

  const targetUrl = `${baseUrl.replace(/\/$/, "")}/api/profile`

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Proxy error" },
      { status: 502 }
    )
  }
}
