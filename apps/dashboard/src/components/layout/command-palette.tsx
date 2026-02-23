import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { Command } from "cmdk";
import { useScoutBar } from "../../contexts/scoutbar-context";

const projects = [
  { name: "Kemdirimdesign", slug: "kemdirimdesign" },
  { name: "Audioly", slug: "audioly" },
  { name: "Cool-Projects", slug: "cool-projects" },
];

const domains = [
  { name: "kemdirim.com", project: "kemdirimdesign" },
  { name: "kem.design", project: "kemdirimdesign" },
];

const teams = [
  { name: "Kemdirimakujuobi", type: "personal" as const },
  { name: "Brimble Team", type: "team" as const },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useScoutBar();

  // ⌘K / Ctrl+K to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  const runAction = (fn: () => void) => {
    setIsOpen(false);
    fn();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="cmdk-overlay"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild aria-label="Command palette">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="cmdk-dialog"
              >
                <Command loop>
                  <Command.Input placeholder="Search or jump to" />
                  <Command.List>
                    <Command.Empty>No results found.</Command.Empty>

                    <Command.Group heading="PROJECTS">
                      {projects.map((p) => (
                        <Command.Item
                          key={p.slug}
                          value={`project ${p.name}`}
                          onSelect={() =>
                            runAction(() =>
                              navigate({ to: `/projects/${p.slug}` })
                            )
                          }
                        >
                          <img
                            src="/icons/scoutbar/search-alt.svg"
                            width="16"
                            height="16"
                            alt=""
                          />
                          <span>{p.name}</span>
                        </Command.Item>
                      ))}
                      <Command.Item
                        value="new project create"
                        onSelect={() =>
                          runAction(() => navigate({ to: "/projects/new" }))
                        }
                      >
                        <img
                          src="/icons/scoutbar/add.svg"
                          width="16"
                          height="16"
                          alt=""
                        />
                        <span>New project</span>
                        <span className="cmdk-shortcut cmdk-shortcut-blue">
                          N
                        </span>
                      </Command.Item>
                    </Command.Group>

                    <Command.Group heading="DOMAINS">
                      {domains.map((d) => (
                        <Command.Item
                          key={d.name}
                          value={`domain ${d.name} ${d.project}`}
                          onSelect={() =>
                            runAction(() => navigate({ to: "/domains" }))
                          }
                        >
                          <img
                            src="/icons/scoutbar/earth.svg"
                            width="16"
                            height="16"
                            alt=""
                          />
                          <span>{d.name}</span>
                        </Command.Item>
                      ))}
                      <Command.Item
                        value="new domain add"
                        onSelect={() =>
                          runAction(() => navigate({ to: "/domains" }))
                        }
                      >
                        <img
                          src="/icons/scoutbar/add.svg"
                          width="16"
                          height="16"
                          alt=""
                        />
                        <span>New domain</span>
                        <span className="cmdk-shortcut cmdk-shortcut-red">
                          D
                        </span>
                      </Command.Item>
                      <Command.Item
                        value="buy domain register"
                        onSelect={() =>
                          runAction(() => navigate({ to: "/domains/buy" }))
                        }
                      >
                        <img
                          src="/icons/scoutbar/earth.svg"
                          width="16"
                          height="16"
                          alt=""
                        />
                        <span>Buy domain</span>
                        <span className="cmdk-shortcut cmdk-shortcut-red">
                          B
                        </span>
                      </Command.Item>
                    </Command.Group>

                    <Command.Group heading="DATABASES">
                      <Command.Item
                        value="new database create"
                        onSelect={() =>
                          runAction(() => navigate({ to: "/projects/new" }))
                        }
                      >
                        <img
                          src="/icons/scoutbar/add.svg"
                          width="16"
                          height="16"
                          alt=""
                        />
                        <span>New database</span>
                        <span className="cmdk-shortcut cmdk-shortcut-green">
                          D
                        </span>
                        <span className="cmdk-shortcut cmdk-shortcut-green">
                          B
                        </span>
                      </Command.Item>
                    </Command.Group>

                    <Command.Group heading="TEAM">
                      {teams.map((t) => (
                        <Command.Item
                          key={t.name}
                          value={`team ${t.name} ${t.type}`}
                          onSelect={() =>
                            runAction(() => navigate({ to: "/projects" }))
                          }
                        >
                          <img
                            src="/icons/scoutbar/People.svg"
                            width="16"
                            height="16"
                            alt=""
                          />
                          <span>{t.name}</span>
                        </Command.Item>
                      ))}
                      <Command.Item
                        value="new team create workspace"
                        onSelect={() =>
                          runAction(() => navigate({ to: "/workspace/new" }))
                        }
                      >
                        <img
                          src="/icons/scoutbar/add.svg"
                          width="16"
                          height="16"
                          alt=""
                        />
                        <span>New team</span>
                        <span className="cmdk-shortcut cmdk-shortcut-orange">
                          T
                        </span>
                      </Command.Item>
                    </Command.Group>

                    <Command.Group heading="HELP">
                      <Command.Item
                        value="cli docs documentation"
                        onSelect={() =>
                          runAction(() =>
                            window.open("https://docs.brimble.io", "_blank")
                          )
                        }
                      >
                        <img
                          src="/icons/scoutbar/desktop.svg"
                          width="16"
                          height="16"
                          alt=""
                        />
                        <span>CLI docs</span>
                      </Command.Item>
                      <Command.Item
                        value="contact support email help"
                        onSelect={() =>
                          runAction(
                            () =>
                              (window.location.href =
                                "mailto:hello@brimble.app")
                          )
                        }
                      >
                        <img
                          src="/icons/scoutbar/mail.svg"
                          width="16"
                          height="16"
                          alt=""
                        />
                        <span>Contact support</span>
                      </Command.Item>
                    </Command.Group>
                  </Command.List>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
