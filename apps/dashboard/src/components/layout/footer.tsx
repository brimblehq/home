const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "https://docs.brimble.io" },
  { label: "Community", href: "#" },
  { label: "Pricing", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t-[0.5px] border-dash-border-soft bg-dash-bg px-6 py-4">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between">
        <div className="flex items-center gap-[30px]">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-dash-text-extra-faded transition-colors hover:text-dash-text-body"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-[7px]">
          {/* Signal bars */}
          <div className="flex items-end gap-[1.25px]">
            <span className="h-[3.75px] w-[2.5px] rounded-[7.5px] bg-[rgba(35,214,74,0.8)]" />
            <span className="h-[7.5px] w-[2.5px] rounded-[7.5px] bg-[rgba(35,214,74,0.8)]" />
            <span className="h-[10px] w-[2.5px] rounded-[7.5px] bg-[rgba(35,214,74,0.8)]" />
          </div>
          <span className="text-sm text-dash-text-body">All systems go</span>
        </div>
      </div>
    </footer>
  );
}
