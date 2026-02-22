import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-medium tracking-[-0.03px] text-dash-text-body">
        {title}
      </h2>
      {children && (
        <p className="mt-2 max-w-[560px] text-sm font-light leading-[1.3] text-dash-text-extra-faded">
          {children}
        </p>
      )}
    </div>
  );
}
