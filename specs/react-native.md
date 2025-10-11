# React Native App Specification

## Overview

The React Native app provides mobile equivalents of the web application's core pages: Home (Daily Edition), Pricing, and Articles. Built for Android with TypeScript, it maintains the same dark theme and functionality as the web version while adapting to mobile UI patterns.

## Architecture

### Project Structure
```
./native/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Main screen components
│   ├── navigation/         # Navigation setup
│   ├── data/              # Mock data
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── android/               # Android-specific files
├── ios/                  # iOS-specific files (structure only)
├── App.tsx               # Main app component
└── package.json          # Dependencies and scripts
```

### Technology Stack
- **React Native 0.82.0** with TypeScript
- **React Navigation** for screen navigation
- **React Native Safe Area Context** for proper screen boundaries
- **Mock data** (no API integration as per requirements)

## Screens

### HomeScreen (Daily Edition)
**Web Equivalent:** `/` (Home page)

Displays the latest daily edition with:
- Newspaper name and generation timestamp
- Front page headline and article
- List of topics with expandable social media comments
- Skeptical and supportive viewpoints for each topic

**Key Features:**
- Scrollable content with glassmorphism-style cards
- Expandable sections for social media buzz and comments
- Dark gradient background matching web design

### PricingScreen
**Web Equivalent:** `/pricing`

Shows subscription tiers:
- **Free**: Basic access with limited features
- **Reader** ($9.99): Full archive access (marked as "Most Popular")
- **Reporter** ($29.99): AI reporter capabilities
- **Editor** ($99.99): Full editing suite (marked as "Premium")

**Key Features:**
- Pricing cards with feature lists
- Visual badges for popular/premium tiers
- Responsive grid layout

### ArticlesScreen
**Web Equivalent:** `/articles`

Lists published articles with:
- Article headlines and timestamps
- Expandable source messages from social media
- Expandable AI generation prompts
- Article metadata (ID, reporter)

**Key Features:**
- FlatList for efficient scrolling
- Expandable sections for transparency features
- Chronological ordering

## Components

### Navigation
- Bottom tab bar with screen switching
- Consistent styling across screens
- Uses React Navigation's stack navigator

### Card Components
- **DailyEditionCard**: Header and front page content
- **TopicCard**: News topics with expandable comments
- **PricingCard**: Subscription tiers with features
- **ArticleCard**: Articles with expandable details

All cards use:
- Semi-transparent backgrounds (glassmorphism effect)
- Rounded corners and subtle borders
- Consistent spacing and typography

## Data Structure

### Mock Data
Located in `src/data/mockData.ts`:
- `mockDailyEdition`: Single daily edition with topics
- `mockArticles`: Array of 2 sample articles
- `pricingTiers`: Array of 4 subscription tiers

### Type Definitions
Located in `src/types/index.ts`:
- `DailyEdition`: Newspaper edition structure
- `Topic`: News topic with social media elements
- `Article`: Article with source messages and prompts
- `PricingTier`: Subscription tier information

## Navigation

Uses React Navigation v7 with:
- Stack navigator for screen transitions
- TypeScript integration for type safety
- Custom header styling (dark theme)
- Bottom navigation component for tab switching

## Styling

### Design System
- **Colors**: Dark gray gradients (#1f2937, #374151)
- **Typography**: White text on dark backgrounds
- **Spacing**: Consistent padding and margins
- **Effects**: Semi-transparent overlays, subtle borders

### Responsive Design
- Uses React Native's flexbox system
- Adapts to different screen sizes
- Proper safe area handling

## Key Differences from Web App

### UI Adaptations
- **Navigation**: Bottom tabs instead of top navigation
- **Layout**: Single-column mobile layout vs multi-column web
- **Interactions**: Touch gestures instead of hover effects
- **Expandable Content**: Accordion-style sections for mobile

### Technical Differences
- **Components**: React Native primitives (View, Text, ScrollView)
- **Styling**: StyleSheet objects instead of CSS
- **Navigation**: Native navigation stack
- **Data**: Mock data only (no API calls)

### Feature Parity
- **Content**: All web content represented
- **Functionality**: Expandable sections, navigation
- **Design**: Dark theme maintained
- **Transparency**: Source messages and prompts included

## Dependencies

### Core Dependencies
- `react-native`: Framework
- `@react-navigation/native`: Navigation framework
- `@react-navigation/stack`: Stack navigation
- `react-native-screens`: Native screen optimization
- `react-native-safe-area-context`: Safe area handling

### Development Dependencies
- TypeScript and related tools
- ESLint for code quality
- Jest for testing
- Metro bundler

## Setup and Development

### Prerequisites
- Node.js 20+
- Java JDK 17
- Android Studio with SDK
- Android Virtual Device or physical device

### Installation
```bash
cd native
npm install
```

### Running
```bash
npm run android  # For Android
npm run ios      # For iOS (if configured)
```

### Development
- Hot reload enabled
- TypeScript compilation
- ESLint code quality checks

## Future Enhancements

### Potential Additions
- Real API integration
- User authentication
- Offline data caching
- Push notifications
- Advanced animations
- iOS optimization

### Platform Extensions
- iOS deployment
- Tablet layouts
- Dark/light theme toggle
- Accessibility improvements

## Conclusion

The React Native app successfully provides mobile access to the core newsroom functionality while maintaining design consistency and user experience parity with the web application. The modular architecture allows for easy extension and maintenance as the platform grows.