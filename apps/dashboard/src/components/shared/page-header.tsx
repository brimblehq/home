import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
  /** Path to an image displayed to the left of the text (hidden on mobile) */
  image?: string;
}

export function PageHeader({ title, children, image }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center gap-4">
      {image && (
        <div className="hidden shrink-0 brightness-[1.02] mix-blend-multiply dark:invert dark:mix-blend-screen dark:opacity-85 sm:block">
          <img src={image} alt="" className="size-[80px]" />
        </div>
      )}
      <div>
        <h2 className="text-base font-medium tracking-[-0.03px] text-dash-text-strong">
          {title}
        </h2>
        {children && (
          <p className="mt-2 max-w-[560px] text-sm font-light leading-[1.3] text-dash-text-extra-faded">
            {children}
          </p>
        )}
      </div>
    </div>
  );
}
