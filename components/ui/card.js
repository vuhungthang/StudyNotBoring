export function Card({ children, className = "", ...props }) {
  const classes = `rounded-lg border bg-card text-card-foreground shadow-sm ${className}`;
  
  return `
    <div class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')}>
      ${children}
    </div>
  `;
}

export function CardHeader({ children, className = "", ...props }) {
  const classes = `flex flex-col space-y-1.5 p-6 ${className}`;
  
  return `
    <div class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')}>
      ${children}
    </div>
  `;
}

export function CardTitle({ children, className = "", ...props }) {
  const classes = `text-2xl font-semibold leading-none tracking-tight ${className}`;
  
  return `
    <h3 class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')}>
      ${children}
    </h3>
  `;
}

export function CardDescription({ children, className = "", ...props }) {
  const classes = `text-sm text-muted-foreground ${className}`;
  
  return `
    <p class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')}>
      ${children}
    </p>
  `;
}

export function CardContent({ children, className = "", ...props }) {
  const classes = `p-6 pt-0 ${className}`;
  
  return `
    <div class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')}>
      ${children}
    </div>
  `;
}

export function CardFooter({ children, className = "", ...props }) {
  const classes = `flex items-center p-6 pt-0 ${className}`;
  
  return `
    <div class="${classes}" ${Object.keys(props).map(key => `${key}="${props[key]}"`).join(' ')}>
      ${children}
    </div>
  `;
}