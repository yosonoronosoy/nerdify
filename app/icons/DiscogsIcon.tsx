export default function DiscogsIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      className="h-8 w-8 text-red-500"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" /> <circle cx="12" cy="12" r="9" />{" "}
      <circle cx="12" cy="12" r="1" /> <path d="M7 12a5 5 0 0 1 5 -5" />{" "}
      <path d="M12 17a5 5 0 0 0 5 -5" />
    </svg>
  );
}
