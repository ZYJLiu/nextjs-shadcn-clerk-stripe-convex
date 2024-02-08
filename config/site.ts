export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Next.js",
  description:
    "Beautifully designed components built with Radix UI and Tailwind CSS.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Collection",
      href: "/images",
    },
    {
      title: "Pool",
      href: "/images-pool",
    },
  ],
  links: {
    twitter: "/",
    github: "/",
    docs: "/",
  },
};
