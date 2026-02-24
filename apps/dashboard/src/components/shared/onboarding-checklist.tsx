import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const TASKS = [
  "Create your first project",
  "Connect a custom domain",
  "Set up environment variables",
  "Invite a team member",
  "Deploy to production",
] as const;

export function OnboardingChecklist({
  completedTasks = new Set(),
}: {
  completedTasks?: Set<number>;
}) {
  const [expanded, setExpanded] = useState(false);

  const completedCount = completedTasks.size;
  const progress = completedCount / TASKS.length;

  return (
    <motion.div
      className="fixed bottom-5 right-5 z-50 w-[320px]"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{ transformOrigin: "bottom right" }}
    >
      {/* Collapsed pill */}
      {!expanded && (
        <motion.button
          key="pill"
          onClick={() => setExpanded(true)}
          className="ml-auto flex items-center gap-2 rounded-full border-[0.5px] border-dash-border bg-dash-bg px-4 py-2.5 text-sm font-medium text-dash-text-strong shadow-[0px_2px_3px_rgba(0,0,0,0.06),inset_0px_-3px_2px_rgba(245,245,245,0.3)] transition-colors hover:bg-dash-bg-elevated dark:shadow-[0px_2px_3px_rgba(0,0,0,0.2)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {/* Progress ring */}
          <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0">
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-dash-border"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="#3c6ce7"
              strokeWidth="2"
              strokeDasharray={`${progress * 50.27} 50.27`}
              strokeLinecap="round"
              transform="rotate(-90 10 10)"
            />
          </svg>
          <span>
            {completedCount}/{TASKS.length} completed
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-dash-text-faded"
          >
            <path
              d="M4 10L8 6L12 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      )}

      {/* Expanded card */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="card"
            className="overflow-hidden rounded-lg border-[0.5px] border-dash-border bg-dash-bg shadow-[0px_2px_3px_rgba(0,0,0,0.06),inset_0px_-3px_2px_rgba(245,245,245,0.3)] dark:shadow-[0px_2px_3px_rgba(0,0,0,0.2)]"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-[0.5px] border-dash-border bg-dash-bg-elevated px-4 py-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-dash-text-strong">
                  Getting started
                </h3>
                <p className="mt-0.5 text-xs text-dash-text-faded">
                  {completedCount}/{TASKS.length} completed
                </p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-dash-text-faded transition-colors hover:bg-dash-bg hover:text-dash-text-strong"
              >
                <motion.svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <path
                    d="M4 10L8 6L12 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-dash-border">
              <motion.div
                className="h-full rounded-r-full bg-[#3c6ce7]"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.35, ease: EASE }}
              />
            </div>

            {/* Task list */}
            <ul className="px-4 py-2">
              {TASKS.map((task, i) => {
                const done = completedTasks.has(i);
                return (
                  <li key={i}>
                    <div className="flex items-center gap-3 px-1 py-2">
                      {/* Checkbox (read-only) */}
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
                          done
                            ? "border-[#3c6ce7] bg-[#3c6ce7]"
                            : "border-dash-border"
                        }`}
                      >
                        {done && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5.5L4 7.5L8 3"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`text-sm transition-colors ${
                          done
                            ? "text-dash-text-faded line-through"
                            : "text-dash-text-strong"
                        }`}
                      >
                        {task}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
