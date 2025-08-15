// ui.js - Reusable UI components inspired by shadcn/ui

class UIComponents {
  // Button component
  static button({ variant = 'default', size = 'default', className = '', children, ...props }) {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
    
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'underline-offset-4 hover:underline text-primary'
    };
    
    const sizes = {
      default: 'h-10 py-2 px-4',
      sm: 'h-9 px-3 rounded-md',
      lg: 'h-11 px-8 rounded-md'
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
    
    return `<button class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</button>`;
  }
  
  // Card component
  static card({ className = '', children, ...props }) {
    const classes = `rounded-lg border bg-card text-card-foreground shadow-sm ${className}`;
    return `<div class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</div>`;
  }
  
  // Card header component
  static cardHeader({ className = '', children, ...props }) {
    const classes = `flex flex-col space-y-1.5 p-6 ${className}`;
    return `<div class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</div>`;
  }
  
  // Card title component
  static cardTitle({ className = '', children, ...props }) {
    const classes = `text-2xl font-semibold leading-none tracking-tight ${className}`;
    return `<h3 class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</h3>`;
  }
  
  // Card description component
  static cardDescription({ className = '', children, ...props }) {
    const classes = `text-sm text-muted-foreground ${className}`;
    return `<p class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</p>`;
  }
  
  // Card content component
  static cardContent({ className = '', children, ...props }) {
    const classes = `p-6 pt-0 ${className}`;
    return `<div class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</div>`;
  }
  
  // Card footer component
  static cardFooter({ className = '', children, ...props }) {
    const classes = `flex items-center p-6 pt-0 ${className}`;
    return `<div class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</div>`;
  }
  
  // Input component
  static input({ className = '', ...props }) {
    const classes = `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;
    return `<input class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')} />`;
  }
  
  // Label component
  static label({ className = '', children, ...props }) {
    const classes = `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`;
    return `<label class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</label>`;
  }
  
  // Select component
  static select({ className = '', children, ...props }) {
    const classes = `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;
    return `<select class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</select>`;
  }
  
  // Textarea component
  static textarea({ className = '', ...props }) {
    const classes = `flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;
    return `<textarea class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}></textarea>`;
  }
  
  // Badge component
  static badge({ variant = 'default', className = '', children, ...props }) {
    const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    
    const variants = {
      default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
      outline: 'text-foreground'
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${className}`;
    return `<span class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</span>`;
  }
  
  // Alert component
  static alert({ variant = 'default', className = '', children, ...props }) {
    const baseClasses = 'relative w-full rounded-lg border p-4';
    
    const variants = {
      default: 'bg-background text-foreground',
      destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${className}`;
    return `<div class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</div>`;
  }
  
  // Alert title component
  static alertTitle({ className = '', children, ...props }) {
    const classes = `mb-1 font-medium leading-none tracking-tight ${className}`;
    return `<h5 class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</h5>`;
  }
  
  // Alert description component
  static alertDescription({ className = '', children, ...props }) {
    const classes = `text-sm [&_p]:leading-relaxed ${className}`;
    return `<div class="${classes}" ${Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ')}>${children}</div>`;
  }
}

// Export as default
export default UIComponents;