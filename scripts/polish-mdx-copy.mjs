#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const blogDir = path.join(__dirname, "..", "content", "blog")

function cleanFile(filePath) {
  let raw = fs.readFileSync(filePath, "utf8")
  let next = raw
  next = next.replaceAll("CodeTelemetryLabs", "CodeTelemetryLab")
  next = next.replaceAll("https://codetelemetrylab.me/", "https://www.codetelemetrylab.me/")
  next = next.replace(/^## SEO brief[\s\S]*?(?=^## )/gim, "")
  next = next.replace(
    /For CodeTelemetryLab, the natural CTA is[\s\S]*?\./g,
    "If this matches a problem you are solving, send a short brief through /contact with the workflow, timeline, and systems that need to connect.",
  )
  next = next.replace(/### What makes the work SEO-friendly\?[\s\S]*?(?=### |## |$)/gi, "")
  next = next.replace(/\bSEO-friendly\b/gi, "maintainable")
  next = next.replace(/\bcredible SEO foundations\b/gi, "solid product foundations")
  next = next.replace(/\band SEO\b/gi, "")
  next = next.replace(/\bSEO,\s*/gi, "")
  next = next.replace(/\bSEO\b/g, "structure")
  if (next !== raw) {
    fs.writeFileSync(filePath, next, "utf8")
    return true
  }
  return false
}

const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"))
let changed = 0
for (const file of files) {
  if (cleanFile(path.join(blogDir, file))) changed += 1
}
console.log(`Updated ${changed} of ${files.length} MDX posts`)
