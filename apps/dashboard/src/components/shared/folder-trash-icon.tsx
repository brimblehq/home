interface FolderTrashIconProps {
  className?: string;
  color?: string;
}

export function FolderTrashIcon({
  className = "size-4",
  color = "#ef2f1f",
}: FolderTrashIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.5 4C13.5 4.82843 11.0376 5.5 8 5.5C4.96243 5.5 2.5 4.82843 2.5 4M13.5 4C13.5 3.17157 11.0376 2.5 8 2.5C4.96243 2.5 2.5 3.17157 2.5 4M13.5 4L12 13C12 13 11.5 14 8 14C4.5 14 4 13 4 13L2.5 4M9.25 8.25L6.75 10.75M6.75 8.25L9.25 10.75"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
