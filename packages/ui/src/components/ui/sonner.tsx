import {
  CheckCircleIcon,
  InfoIcon,
  SpinnerIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        // Type tints carry on the icon only; the surface stays primary.
        success: <CheckCircleIcon className="size-4 text-success" />,
        warning: <WarningIcon className="size-4 text-warning" />,
        error: <XCircleIcon className="size-4 text-destructive" />,
        info: <InfoIcon className="size-4 text-primary-foreground" />,
        loading: (
          <SpinnerIcon className="size-4 animate-spin text-primary-foreground" />
        ),
      }}
      style={
        {
          // Uniform brand-primary surface for every toast type; the type
          // accent is carried by the icon color above.
          "--normal-bg": "var(--color-secondary)",
          "--normal-text": "var(--color-secondary-foreground)",
          "--normal-border": "var(--color-secondary)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
