import { cva, cx, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-accent to-accentSoft px-4 py-2 text-white shadow-[0_8px_20px_rgba(21,54,106,0.25)] hover:brightness-105 focus-visible:ring-accent",
        subtle:
          "border border-[#c7d2e4] bg-white/85 px-4 py-2 text-slate-800 hover:bg-white focus-visible:ring-slate-400",
        ghost:
          "border border-line bg-white/80 px-3 py-1.5 text-slate-700 hover:bg-white focus-visible:ring-slate-400",
        refresh:
          "rounded-xl border border-[#0f766e]/35 bg-gradient-to-r from-[#0f766e] to-[#0d9488] px-4 py-2 text-white shadow-[0_10px_18px_rgba(6,95,70,0.28)] hover:brightness-105 focus-visible:ring-[#0f766e]"
      },
      active: {
        true: "",
        false: ""
      }
    },
    compoundVariants: [
      {
        variant: "subtle",
        active: true,
        className:
          "border-transparent bg-gradient-to-r from-accent to-accentSoft text-white shadow-[0_8px_20px_rgba(21,54,106,0.24)]"
      }
    ],
    defaultVariants: {
      variant: "primary",
      active: false
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, active, ...props }: ButtonProps) {
  return <button className={cx(buttonStyles({ variant, active }), className)} {...props} />;
}
