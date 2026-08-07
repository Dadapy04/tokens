# @tokens/ui

A modern React component library built with Tailwind CSS, Radix UI, and TypeScript. Designed for building beautiful, accessible user interfaces.

## Installation

```bash
npm install @tokens/ui
# or
bun add @tokens/ui
# or
yarn add @tokens/ui
```

## Setup

### 1. Import CSS

Import the global styles in your app's root layout or entry file:

```tsx
import '@tokens/ui/globals.css';
```

### 2. Configure Tailwind CSS

Ensure your `tailwind.config.js` includes the UI package content:

```js
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}', './node_modules/@tokens/ui/src/**/*.{js,ts,jsx,tsx}'],
    // ... rest of your config
};
```

## Usage

### Import Components

You can import components individually (recommended for tree-shaking):

```tsx
import { Button } from '@tokens/ui/button';
import { Card, CardHeader, CardTitle } from '@tokens/ui/card';
```

Or use the barrel export:

```tsx
import { Button, Card, Badge } from '@tokens/ui';
```

### Basic Example

```tsx
import { Button } from '@tokens/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@tokens/ui/card';

function App() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome</CardTitle>
            </CardHeader>
            <CardContent>
                <Button>Click me</Button>
            </CardContent>
        </Card>
    );
}
```

## Components

- **Alert** - Display important messages
- **Avatar** - User profile images with fallback
- **Badge** - Status indicators and labels
- **Button** - Interactive button component
- **Card** - Container for content sections
- **Checkbox** - Binary input selection
- **Command** - Command palette interface
- **Dialog** - Modal dialogs
- **Dropdown Menu** - Context menus
- **Input** - Text input fields
- **Label** - Form labels
- **Popover** - Floating content containers
- **Progress** - Progress indicators
- **Radio Group** - Single selection from options
- **Scroll Area** - Custom scrollable containers
- **Select** - Dropdown select inputs
- **Separator** - Visual dividers
- **Sheet** - Slide-out panels
- **Skeleton** - Loading placeholders
- **Spinner** - Loading indicators
- **Switch** - Toggle switches
- **Tabs** - Tabbed interfaces
- **Textarea** - Multi-line text input
- **Tooltip** - Hover tooltips

## Hooks

The package includes several useful React hooks:

```tsx
import { useIsMobile, useMediaQuery, useLockBodyScroll, useLocalStorage } from '@tokens/ui/hooks';
```

### `useIsMobile(breakpoint?)`

Detects if the viewport is mobile-sized.

```tsx
const isMobile = useIsMobile(); // defaults to 768px
const isMobile = useIsMobile(600); // custom breakpoint
```

### `useMediaQuery(query)`

Matches a media query string.

```tsx
const isLargeScreen = useMediaQuery('(min-width: 1024px)');
```

### `useLockBodyScroll(locked)`

Locks/unlocks body scroll (useful for modals).

```tsx
const [locked, setLocked] = useLockBodyScroll(false);
```

### `useLocalStorage(key, initialValue)`

Syncs state with localStorage.

```tsx
const [value, setValue] = useLocalStorage('theme', 'light');
```

## Utilities

### `cn(...inputs)`

Utility for merging Tailwind CSS classes.

```tsx
import { cn } from '@tokens/ui/cn';

<div className={cn('base-class', condition && 'conditional-class')} />;
```

### `formatNumber(value, decimals?)`

Formats numbers with K/M/B suffixes.

```tsx
import { formatNumber } from '@tokens/ui';

formatNumber(1500); // "1.50K"
formatNumber(2000000); // "2.00M"
```

### `formatCurrency(value, currency?)`

Formats numbers as currency.

```tsx
import { formatCurrency } from '@tokens/ui';

formatCurrency(1234.56); // "$1,234.56"
```

### `truncateAddress(address, chars?)`

Truncates addresses for display.

```tsx
import { truncateAddress } from '@tokens/ui';

truncateAddress('0x1234567890abcdef'); // "0x12...cdef"
```

## Requirements

- React 18+ or 19+
- Tailwind CSS 4.0+
- TypeScript (recommended)

## License

MIT
