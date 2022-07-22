import { classNames } from "~/utils";

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

const button = {
  hover: {
    green: "hover:bg-green-700",
    indigo: "hover:bg-indigo-700",
  },
  colors: {
    green: "bg-green-600 focus:ring-green-500",
    indigo: "bg-indigo-600 focus:ring-indigo-500",
  },
  sizes: {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-base",
  },
};

// FIX: refactor the animated state to another button skeleton
// instead of isSubmitting and isIdle, ask for the transition state object
export function AuthButton({
  isSubmitting = false,
  isIdle = true,
  color = "green",
  size = "md",
  className,
  children,
}: {
  isSubmitting?: boolean;
  isIdle?: boolean;
  className?: string;
  color?: keyof typeof button.colors;
  size?: keyof typeof button.sizes;
  children: React.ReactNode;
}) {
  const defaultClasses = classNames(
    "inline-flex items-center rounded-full",
    "border border-transparent",
    "font-medium text-white shadow-sm",
    "focus:outline-none focus:ring-2 focus:ring-offset-2"
  );

  return (
    <button
      className={classNames(
        !className ? defaultClasses : className,
        isIdle ? button.hover[color] : "",
        isSubmitting ? "disabled animate-pulse cursor-not-allowed" : "",
        button.colors[color],
        button.sizes[size]
      )}
    >
      {children}
    </button>
  );
}
