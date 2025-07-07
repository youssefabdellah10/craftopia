import React from "react";

const Button = React.forwardRef(
  ({ className = "", variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variantClasses = {
      default: "bg-coral text-cream hover:bg-coral/90",
      outline: "border border-burgundy text-burgundy hover:bg-burgundy hover:text-cream",
      ghost: "hover:bg-coral/10 text-burgundy",
    };

    const sizeClasses = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-9 px-3 text-sm",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10 p-2",
    };

    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const combinedClassName = [
      baseClasses,
      variantClasses[variant] || variantClasses.default,
      sizeClasses[size] || sizeClasses.default,
      className,
    ].join(" ");

    return <Comp ref={ref} className={combinedClassName} {...props} />;
  }
);

Button.displayName = "Button";

export { Button };
