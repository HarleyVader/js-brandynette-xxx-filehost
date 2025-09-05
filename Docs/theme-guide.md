# 🎨 Cyber Goth Theme Guide

Welcome to the **2030 Neon Cyber Goth Wave** aesthetic! This guide covers the visual design system powering the Brandynette platform.

## 🌈 Color Palette

### Primary Colors

The cyber goth theme uses a carefully crafted neon color palette:

**Base Colors:**

- `--cyber-black: #0a0a0f` - Deep space black background
- `--cyber-dark: #111118` - Dark surface color
- `--cyber-darker: #1a1a2e` - Darker accent surfaces
- `--cyber-surface: #16213e` - Interactive surface elements

**Neon Colors:**

- `--neon-pink: #ff0080` - Electric pink highlights
- `--neon-cyan: #00ffff` - Bright cyan primary
- `--neon-purple: #8a2be2` - Deep purple accents
- `--neon-green: #39ff14` - Radioactive green
- `--neon-orange: #ff4500` - Warning orange
- `--neon-blue: #0066ff` - Electric blue
- `--neon-yellow: #ffd93d` - Bright yellow highlights

### Gradient Combinations

**Primary Gradient:**

```css
--gradient-primary: linear-gradient(135deg, var(--neon-pink), var(--neon-purple));
```

**Secondary Gradient:**

```css
--gradient-secondary: linear-gradient(135deg, var(--neon-cyan), var(--neon-blue));
```

**Accent Gradient:**

```css
--gradient-accent: linear-gradient(135deg, var(--neon-green), var(--neon-yellow));
```

## 🔤 Typography

### Font Families

**Audiowide** - Futuristic headings

- Used for main titles and branding
- Evokes retro-futuristic aesthetics
- Perfect for the cyber theme

**Space Mono** - Primary interface text

- Monospace font for code-like appearance
- Clean and readable for body text
- Maintains the technical aesthetic

**Fira Code** - Code blocks and technical text

- Optimized for code display
- Ligature support for better readability
- Used in documentation code examples

**JetBrains Mono** - Alternative monospace

- Alternative for technical content
- Excellent for data display
- Used in API responses and logs

### Text Styling

**Headings:**

- Neon glow effects with `text-shadow`
- Gradient text using background-clip
- Audiowide font family for impact

**Body Text:**

- High contrast for readability
- Justified alignment for documentation
- Appropriate line-height for comfort

## ✨ Visual Effects

### Scanlines Animation

The signature scanline effect creates an authentic retro CRT monitor feel:

```css
@keyframes scanlines {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
}
```

**Features:**

- Subtle transparency (3% opacity)
- Continuous 10-second loop
- Covers entire viewport
- Non-interactive overlay

### Glow Effects

**Neon Glow:**

- Used on borders, text, and interactive elements
- Multiple shadow layers for depth
- Color-matched to neon palette
- Animated pulsing for attention

**Box Shadows:**

```css
box-shadow: 0 0 20px rgba(255, 0, 128, 0.4);
```

### Pulse Animations

**Subtle Pulsing:**

```css
@keyframes pulse-glow {
    from { box-shadow: 0 0 5px var(--neon-purple); }
    to { box-shadow: 0 0 20px var(--neon-pink), 0 0 30px var(--neon-purple); }
}
```

## 🎯 Component Styling

### Buttons and Interactive Elements

**Default State:**

- Semi-transparent backgrounds
- Neon border colors
- Smooth transitions (0.3s ease)

**Hover State:**

- Increased glow intensity
- Color shifts within neon palette
- Subtle transform effects

**Active State:**

- Full opacity backgrounds
- Maximum glow effects
- Visual feedback confirmation

### Cards and Containers

**Surface Treatment:**

- Semi-transparent dark backgrounds
- Neon border accents
- Backdrop blur effects where supported

**Layout:**

- Clean geometric shapes
- Consistent border radius (8px)
- Appropriate spacing and padding

## 📱 Responsive Design

### Breakpoints

**Mobile First Approach:**

- Base styles for mobile devices
- Progressive enhancement for larger screens
- Flexible grid systems

**Key Breakpoint:**

```css
@media (max-width: 768px) {
    /* Mobile optimizations */
}
```

### Mobile Optimizations

**Layout Adjustments:**

- Stack sidebars vertically on mobile
- Reduce font sizes appropriately
- Optimize touch targets (44px minimum)

**Performance:**

- Simplified animations on mobile
- Reduced glow effects for battery life
- Optimized font loading

## 🎬 Video Player Integration

### Player Controls

**Control Bar:**

- Semi-transparent dark background
- Neon accent colors for progress
- Smooth hover transitions

**Progress Bar:**

- Neon cyan primary color
- Glow effect on hover/interaction
- Clean geometric design

### Loading States

**Spinner Animation:**

- Matching neon color scheme
- Smooth rotation animation
- Consistent with overall theme

## 🔧 Customization Guide

### Adding New Colors

1. Define the color variable in `:root`
2. Follow the neon naming convention
3. Test contrast ratios for accessibility
4. Create corresponding gradient if needed

### Creating New Animations

1. Use existing timing functions (ease, linear)
2. Keep durations reasonable (1-3 seconds)
3. Ensure animations respect reduced motion preferences
4. Test performance on various devices

### Theme Consistency

**Guidelines:**

- Always use CSS custom properties
- Maintain neon glow effects
- Keep animations subtle but engaging
- Ensure high contrast for readability

## 🎪 Advanced Effects

### Backdrop Filters

Used for glassmorphism effects:

```css
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
```

### Custom Scrollbars

Themed scrollbars match the cyber aesthetic:

```css
::-webkit-scrollbar-thumb {
    background: var(--gradient-primary);
    border-radius: 6px;
}
```

### Code Syntax Highlighting

Integration with highlight.js using the `github-dark` theme, customized with neon accents for consistency.

## 🚀 Performance Considerations

### Optimization Strategies

**Animation Performance:**

- Use `transform` and `opacity` for smooth animations
- Avoid animating layout properties
- Implement will-change for critical animations

**Color Efficiency:**

- CSS custom properties reduce redundancy
- Efficient gradient implementations
- Optimized glow effect combinations

**Font Loading:**

- Strategic font subsetting
- Preload critical fonts
- Fallback font stacks

---

## Theme activated! Experience the cyber future! 🌆✨
