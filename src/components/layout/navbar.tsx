import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useTheme } from "@/hooks/use-theme";
import brimbleLogo from "@/assets/icons/brimble-logo.svg";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header
      className="w-full"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <nav className="mx-auto flex max-w-[720px] items-center justify-between px-6 pt-6">
        <Link to="/" className="shrink-0">
          <img src={brimbleLogo} alt="Brimble" className="size-8 dark:invert" />
        </Link>
        <div className="flex items-center gap-2">
          {siteConfig.navLinks.map((link, i) => (
            <motion.div
              key={link.label}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={link.href}
                className="rounded px-2 py-1 font-body text-sm font-medium text-brimble-black shadow-[var(--shadow-button)] transition-colors duration-150 hover:bg-brimble-air-gray dark:hover:bg-white/10"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={toggleTheme}
              className="ml-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-brimble-black transition-colors duration-150 hover:bg-brimble-air-gray dark:hover:bg-white/10"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </motion.div>
        </div>
      </nav>
    </motion.header>
  );
}
