import { Button } from "../button";
import { HextimatorLogo } from "../hextimator-logo";

const navigation = [
  { label: "Features", href: "#features" },
  { label: "Playground", href: "#playground" },
  { label: "Docs", href: "https://github.com/fgrgic/hextimator" },
];

const resources = [
  {
    label: "GitHub",
    href: "https://github.com/fgrgic/hextimator",
  },
  {
    label: "npm",
    href: "https://www.npmjs.com/package/hextimator",
  },
];

const support = [
  {
    label: "Report an Issue",
    href: "https://github.com/fgrgic/hextimator/issues",
  },
  {
    label: "Contact",
    href: "mailto:support@hextimator.dev",
  },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className='flex flex-col gap-3'>
      <h4 className='text-sm px-2 font-semibold text-base-foreground'>
        {title}
      </h4>
      <ul className='flex flex-col gap-1'>
        {links.map((link) => (
          <li key={link.label}>
            <Button
              variant='ghost'
              href={link.href}
              className='self-start justify-end py-1 hover:bg-base-weak text-sm font-light text-base-foreground transition-colors'
            >
              {link.label}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className='border-t border-base-weak text-base-foreground'>
      <div className='mx-auto max-w-5xl px-6 py-12'>
        <div className='grid grid-cols-2 gap-8 md:grid-cols-4'>
          <div className='col-span-2 md:col-span-1'>
            <HextimatorLogo scale={0.6} />
            <p className='mt-3 text-sm font-light text-base-foreground'>
              Perceptually uniform color palettes from a single color.
            </p>
          </div>

          <FooterColumn title='Navigation' links={navigation} />
          <FooterColumn title='Resources' links={resources} />
          <FooterColumn title='Support' links={support} />
        </div>

        <div className='mt-10 font-light border-t border-base-weak pt-6 text-center text-xs text-base-foreground'>
          &copy; {new Date().getFullYear()} hextimator
        </div>
      </div>
    </footer>
  );
}
