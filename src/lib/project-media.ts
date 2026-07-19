type ProjectMediaInput = {
  category: string
  slug: string
  title: string
  screenshots: string[]
}

type StockVisual = {
  image: string
  sourceUrl: string
}

const unsplashImage = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=82`

const categoryVisuals: Array<{ terms: string[]; visual: StockVisual }> = [
  {
    terms: ["healthcare", "fitness"],
    visual: {
      image: unsplashImage("photo-1576091160399-112ba8d25d1d"),
      sourceUrl: "https://unsplash.com/s/photos/healthcare-technology",
    },
  },
  {
    terms: ["finance", "fintech", "insurance"],
    visual: {
      image: unsplashImage("photo-1551288049-bebda4e38f71"),
      sourceUrl: "https://unsplash.com/s/photos/financial-dashboard",
    },
  },
  {
    terms: ["education", "edtech", "training"],
    visual: {
      image: unsplashImage("photo-1503676260728-1c00da094a0b"),
      sourceUrl: "https://unsplash.com/s/photos/online-education",
    },
  },
  {
    terms: ["real estate", "proptech", "property"],
    visual: {
      image: unsplashImage("photo-1560518883-ce09059eeffa"),
      sourceUrl: "https://unsplash.com/s/photos/real-estate-technology",
    },
  },
  {
    terms: ["logistics", "supply chain", "dispatch"],
    visual: {
      image: unsplashImage("photo-1586528116311-ad8dd3c8310d"),
      sourceUrl: "https://unsplash.com/s/photos/logistics-technology",
    },
  },
  {
    terms: ["food", "restaurant"],
    visual: {
      image: unsplashImage("photo-1504674900247-0877df9cc836"),
      sourceUrl: "https://unsplash.com/s/photos/restaurant-technology",
    },
  },
  {
    terms: ["travel", "hospitality"],
    visual: {
      image: unsplashImage("photo-1488646953014-85cb44e25828"),
      sourceUrl: "https://unsplash.com/s/photos/travel-booking",
    },
  },
  {
    terms: ["retail", "e-commerce", "marketplace"],
    visual: {
      image: unsplashImage("photo-1441986300917-64674bd600d8"),
      sourceUrl: "https://unsplash.com/s/photos/retail-technology",
    },
  },
  {
    terms: ["manufacturing", "iot"],
    visual: {
      image: unsplashImage("photo-1565793298595-6a879b1d9492"),
      sourceUrl: "https://unsplash.com/s/photos/smart-manufacturing",
    },
  },
  {
    terms: ["automotive"],
    visual: {
      image: unsplashImage("photo-1492144534655-ae79c964c9d7"),
      sourceUrl: "https://unsplash.com/s/photos/automotive-technology",
    },
  },
  {
    terms: ["government", "public"],
    visual: {
      image: unsplashImage("photo-1480714378408-67cf0d13bc1b"),
      sourceUrl: "https://unsplash.com/s/photos/civic-technology",
    },
  },
  {
    terms: ["construction"],
    visual: {
      image: unsplashImage("photo-1504307651254-35680f356dfd"),
      sourceUrl: "https://unsplash.com/s/photos/construction-technology",
    },
  },
  {
    terms: ["media", "entertainment", "content"],
    visual: {
      image: unsplashImage("photo-1495020689067-958852a7765e"),
      sourceUrl: "https://unsplash.com/s/photos/digital-media",
    },
  },
  {
    terms: ["legal"],
    visual: {
      image: unsplashImage("photo-1589829545856-d10d557cf95f"),
      sourceUrl: "https://unsplash.com/s/photos/legal-technology",
    },
  },
  {
    terms: ["cybersecurity", "security"],
    visual: {
      image: unsplashImage("photo-1563013544-824ae1b704d3"),
      sourceUrl: "https://unsplash.com/s/photos/cybersecurity",
    },
  },
  {
    terms: ["nonprofit"],
    visual: {
      image: unsplashImage("photo-1559027615-cd4628902d4a"),
      sourceUrl: "https://unsplash.com/s/photos/nonprofit-team",
    },
  },
  {
    terms: ["hr tech", "professional services", "b2b services"],
    visual: {
      image: unsplashImage("photo-1521737711867-e3b97375f902"),
      sourceUrl: "https://unsplash.com/s/photos/business-team",
    },
  },
  {
    terms: ["ai", "automation"],
    visual: {
      image: unsplashImage("photo-1518770660439-4636190af475"),
      sourceUrl: "https://unsplash.com/s/photos/artificial-intelligence-technology",
    },
  },
  {
    terms: ["crm", "sales"],
    visual: {
      image: unsplashImage("photo-1552664730-d307ca884978"),
      sourceUrl: "https://unsplash.com/s/photos/customer-relationship-management",
    },
  },
  {
    terms: ["erp", "enterprise", "operations"],
    visual: {
      image: unsplashImage("photo-1460925895917-afdab827c52f"),
      sourceUrl: "https://unsplash.com/s/photos/business-dashboard",
    },
  },
  {
    terms: ["saas", "platform", "portal"],
    visual: {
      image: unsplashImage("photo-1551434678-e076c223a692"),
      sourceUrl: "https://unsplash.com/s/photos/saas-product-team",
    },
  },
]

const defaultVisual: StockVisual = {
  image: unsplashImage("photo-1497366811353-6870744d04b2"),
  sourceUrl: "https://unsplash.com/s/photos/software-team",
}

export function hasRealProjectScreenshot(screenshots: string[]) {
  return screenshots.some(
    (screenshot) =>
      Boolean(screenshot?.trim()) &&
      !screenshot.includes("/og-image.svg") &&
      !screenshot.toLowerCase().includes("placeholder"),
  )
}

export function getProjectVisual(project: ProjectMediaInput) {
  const realScreenshot = project.screenshots.find(
    (screenshot) =>
      Boolean(screenshot?.trim()) &&
      !screenshot.includes("/og-image.svg") &&
      !screenshot.toLowerCase().includes("placeholder"),
  )

  if (realScreenshot) {
    return {
      image: realScreenshot,
      alt: `${project.title} product interface`,
      isIllustrative: false,
      sourceUrl: null,
    }
  }

  const searchText = `${project.category} ${project.slug}`.toLowerCase()
  const match = categoryVisuals.find(({ terms }) =>
    terms.some((term) => searchText.includes(term)),
  )
  const visual = match?.visual ?? defaultVisual

  return {
    image: visual.image,
    alt: `Illustrative ${project.category.toLowerCase()} technology visual for ${project.title}`,
    isIllustrative: true,
    sourceUrl: visual.sourceUrl,
  }
}
