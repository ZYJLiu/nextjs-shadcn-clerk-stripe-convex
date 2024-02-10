export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Next.js",
  description:
    "Beautifully designed components built with Radix UI and Tailwind CSS.",
  mainNav: [
    // {
    //   title: "Home",
    //   href: "/",
    // },
    {
      title: "Collection",
      href: "/images",
    },
    {
      title: "Images",
      href: "/images-pool",
    },
    {
      title: "Videos",
      href: "/videos",
    },
  ],
  links: {
    twitter: "/",
    github: "/",
    docs: "/",
  },
};
