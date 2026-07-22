# Frontend Architecture Guidelines (Clean Code)

## Principles
1. **DRY (Don't Repeat Yourself)**: Avoid duplicating UI logic. We use central components with predefined variants for UI elements like buttons, inputs, and cards.
2. **Thematic Consistency**: Avoid hardcoding hex colors (like `#073c2a`). All colors should be semantic CSS variables (`--primary`, `--background`) mapped inside the Tailwind theme.
3. **Separation of Concerns**: Keep page files clean by extracting complex sections into dedicated components.
4. **Type Safety**: Use TypeScript (`.tsx`) for all new frontend code to ensure prop validation and self-documenting code.

## File Structure
- `/app/globals.css`: Contains all CSS variables (theme configuration).
- `/lib/utils.ts`: Contains the `cn` function for merging Tailwind classes safely (`clsx` + `tailwind-merge`).
- `/components/ui/`: Contains atomic, reusable, invariant components (Button, Input, Card).
- `/components/home/`: Specific components just for the Home page to avoid cluttering `app/page.tsx`.

## Component Variants Pattern
Instead of repeatedly writing `<button className="bg-green-600 text-white rounded hover:bg-green-700">`, use the unified `<Button>` component:
```tsx
<Button variant="primary" size="lg">Submit</Button>
<Button variant="outline">Cancel</Button>
```
