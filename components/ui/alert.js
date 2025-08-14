import { cn } from '../lib/utils.js';

export function Alert({ children, variant = "default", className = "", ...props }) {
  const baseClasses = "relative w-full rounded-lg border p-4";
  
  const variantClasses = {
    default: "bg-background text-foreground",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
  };
  
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    className
  );
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function AlertTitle({ children, className = "", ...props }) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
      {children}
    </h5>
  );
}

export function AlertDescription({ children, className = "", ...props }) {
  return (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props}>
      {children}
    </div>
  );
}