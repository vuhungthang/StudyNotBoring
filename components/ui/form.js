export function Form({ children, className = "", ...props }) {
  return (
    <form className={className} {...props}>
      {children}
    </form>
  );
}

export function FormItem({ children, className = "" }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function FormLabel({ children, className = "" }) {
  return (
    <label className={className}>
      {children}
    </label>
  );
}

export function FormControl({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export function FormDescription({ children, className = "" }) {
  return (
    <p className={className}>
      {children}
    </p>
  );
}

export function FormMessage({ children, className = "" }) {
  return (
    <p className={className}>
      {children}
    </p>
  );
}