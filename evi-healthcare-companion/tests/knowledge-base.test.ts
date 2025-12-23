import { describe, expect, it } from "vitest"
import { knowledgeBase } from "../lib/knowledge-base"

describe("knowledge base", () => {
  it("includes well-formed articles with sources", () => {
    expect(knowledgeBase.length).toBeGreaterThan(5)
    knowledgeBase.forEach((article) => {
      expect(article.id).toBeTruthy()
      expect(article.title).toBeTruthy()
      expect(article.summary).toBeTruthy()
      expect(article.content).toBeTruthy()
      expect(article.sources.length).toBeGreaterThan(0)
      article.sources.forEach((source) => {
        expect(source.title).toBeTruthy()
        expect(source.url.startsWith("https://")).toBe(true)
      })
    })
  })

  it("includes student-focused guidance", () => {
    const studentArticles = knowledgeBase.filter((article) => article.tags.includes("students"))
    expect(studentArticles.length).toBeGreaterThan(0)
  })
})
