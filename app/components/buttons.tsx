type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <button
      className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      {...props}
    >
      Available
    </button>
  );
}

export function SecondaryButton({ children, ...props }: ButtonProps) {
  return (
    <button
      className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-base font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      {...props}
    >
      {children}
    </button>
  );
}
