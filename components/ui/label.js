import { cn } from '../lib/utils.js';

export function Label({ children, className = "", htmlFor, ...props }) {
  const baseClasses = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
  
  const classes = cn(baseClasses, className);
  
  return (
    <label className={classes} htmlFor={htmlFor} {...props}>
      {children}
    </label>
  );
}