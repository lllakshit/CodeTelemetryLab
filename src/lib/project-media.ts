type ProjectMediaInput = {
  category: string
  slug: string
  title: string
  screenshots: string[]
}

/** Brand-owned abstract when a project has no real screenshot. Never use stock photography. */
const BRAND_ABSTRACT = "/brand/ct-labs-logo.png"

export function hasRealProjectScreenshot(screenshots: string[]) {
  return screenshots.some(
    (screenshot) =>
      Boolean(screenshot?.trim()) &&
      !screenshot.includes("/og-image.svg") &&
      !screenshot.includes("/brand/ct-labs") &&
      !screenshot.toLowerCase().includes("placeholder") &&
      !screenshot.includes("unsplash.com"),
  )
}

export function getProjectVisual(project: ProjectMediaInput) {
  const realScreenshot = project.screenshots.find(
    (screenshot) =>
      Boolean(screenshot?.trim()) &&
      !screenshot.includes("/og-image.svg") &&
      !screenshot.includes("/brand/ct-labs") &&
      !screenshot.toLowerCase().includes("placeholder") &&
      !screenshot.includes("unsplash.com"),
  )

  if (realScreenshot) {
    return {
      image: realScreenshot,
      alt: `${project.title} product interface`,
      isIllustrative: false,
      sourceUrl: null as string | null,
    }
  }

  return {
    image: BRAND_ABSTRACT,
    alt: `${project.title} — ${project.category} engagement overview`,
    isIllustrative: true,
    sourceUrl: null as string | null,
  }
}
