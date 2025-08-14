export function Input({ className = "", type = "text", ...props }) {
  const classes = `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;
  
  return `
    <input type="${type}" class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')} />
  `;
}

export function Label({ children, className = "", ...props }) {
  const classes = `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`;
  
  return `
    <label class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')}>
      ${children}
    </label>
  `;
}

export function Select({ children, className = "", ...props }) {
  const classes = `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;
  
  return `
    <select class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')}>
      ${children}
    </select>
  `;
}