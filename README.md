# EcoTuned

A weather-driven energy and money-saving suggestion app that helps UK users make smarter decisions about household activities based on today and tomorrow's forecast.

## Features

- Personalised energy-saving recommendations based on today and tomorrow's weather
- Simple setup with postcode and household preferences
- Server-side rendering for fast initial load with client-side caching
- Cookie-based preferences (no database required for MVP)
- Responsive design optimised for mobile and desktop
- Time-aware recommendations (greyed out when opportunity has passed)
- Tabbed interface for today vs tomorrow tips

## User Setup Questions

**Your Postcode**: Used to fetch accurate local weather data for your area

**Your Home Setup**:

1. **Garden / Balcony**: For outdoor line-drying recommendations (indoor drying tips available to everyone)
2. **Electric Vehicle**: For smart EV charging times (solar + off-peak optimisation)
3. **Solar Panels**: For solar generation forecasts and energy usage timing
4. **Cheaper Night-Time Electricity**: Time-of-use tariffs like Economy 7, Octopus Agile, etc.
5. **Heating Type**: Gas Boiler, Electric Heating, Heat Pump, or Other (for heating-specific tips)
6. **Hot Water System**: Combi Boiler, Hot Water Tank, Electric Immersion, or Other (for timing recommendations)
7. **Preferred Home Temperature**: 15-25°C (for personalised heating recommendations)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom eco-themed design system
- **Data Fetching**: TanStack Query (React Query) for client-side caching
- **Form Handling**: React Hook Form with Zod validation
- **Validation**: Zod schemas for runtime type safety
- **Code Quality**: ESLint + Prettier for consistent code formatting
- **Testing**: Jest (unit tests) + Playwright (e2e tests)
- **UI Components**: Radix UI for accessible modals and dialogs
- **Analytics**: Vercel Analytics
- **APIs** (both free, no registration required):
  - [Postcodes.io](https://postcodes.io/) - Free UK postcode to lat/long conversion
  - [Open-Meteo](https://open-meteo.com/) - Free weather forecast data (temperature, humidity, solar radiation, wind, precipitation)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- **No API keys required!** Both APIs (Open-Meteo and Postcodes.io) are free and require no registration

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ecotuned
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Copy environment file:

```bash
cp .env.example .env.local
```

**Note**: No API keys needed! The app uses Open-Meteo and Postcodes.io, both of which are free and require no authentication.

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Code Quality

Format code with Prettier:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

Lint code with ESLint:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

## Project Structure

```
ecotuned/
├── app/
│   ├── actions.ts          # Server actions for cookie management
│   ├── error.tsx           # Error boundary component
│   ├── globals.css         # Global styles and eco design tokens
│   ├── icon.svg            # Favicon
│   ├── layout.tsx          # Root layout with header/footer
│   ├── page.tsx            # Main page (server component)
│   └── providers.tsx       # React Query provider
├── components/
│   ├── Badge.tsx           # Reusable badge component
│   ├── Dashboard.tsx       # Main dashboard with tabs (client component)
│   ├── EditPreferences.tsx # Edit preferences modal
│   ├── RecommendationsList.tsx
│   ├── SetupForm.tsx       # Initial user setup form
│   └── WeatherSummary.tsx  # Weather data display
├── lib/
│   ├── api.ts              # API utilities for Postcodes.io & Open-Meteo
│   ├── recommendations.ts  # Recommendation engine (pure function)
│   ├── schemas.ts          # Zod schemas for validation
│   └── weatherColors.ts    # Weather condition color mappings
├── __tests__/
│   ├── recommendations.test.ts
│   └── schemas.test.ts
├── e2e/
│   ├── edit-preferences.spec.ts
│   ├── fresh-user.spec.ts
│   └── returning-user.spec.ts
└── ...config files
```

## Architecture Highlights

### Hybrid Rendering Approach

- **Server-side initial load**: Main page fetches weather data server-side for fast first paint
- **Client-side caching**: React Query manages subsequent fetches with 5-minute stale time
- **Dashboard component**: Client component with tabbed interface for today/tomorrow
- **Portal-based header**: Client components inject content into server layout via React portals

### Cookie Strategy

- Uses Next.js `cookies()` API (not js-cookie)
- httpOnly flag prevents client-side JS access
- Preferences saved via server action with Zod validation
- 1-year expiry, secure in production

### Recommendation Engine

The core of the app is a pure, synchronous function (`lib/recommendations.ts`):

```typescript
generateRecommendations(
  weather: SimplifiedWeather,
  prefs: UserPreferences,
  isToday: boolean,
  day: 'today' | 'tomorrow'
): Recommendation[]
```

**Key Features**:

- **Pure function**: No side effects or API calls - easy to test and reason about
- **Time-aware**: Marks recommendations as "passed" when their action window has closed (e.g., line-drying after sunset)
- **Personalisation-first**: Prioritises recommendations based on user's specific setup (heating type, tariff, etc.)
- **Category diversity**: Max 2 recommendations per category to avoid overwhelming users
- **Priority sorting**: High → medium → low, with personalised recommendations favored
- **Weather-driven**: Uses postcode-specific forecast data (temperature, humidity, solar radiation, wind, precipitation)
- **Smart categorisation**: laundry, heating, mobility, cooking, insulation, appliances

**Recommendation Categories**:

1. **Laundry**: Line-drying (outdoor), indoor drying (low humidity)
2. **Mobility**: EV charging (solar + off-peak optimisation)
3. **Heating**: Heat pump efficiency, natural ventilation, hot water timing
4. **Cooking**: Batch cooking on cold/rainy days, avoid oven heat on hot days
5. **Insulation**: Curtains/blinds for temperature control
6. **Appliances**: Off-peak dishwasher/washing machine for time-of-use tariffs

## Testing

### Unit Tests

Run Jest tests for schemas and recommendation logic:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

### End-to-End Tests

Run Playwright tests for user flows:

```bash
npm run test:e2e
```

UI mode (for debugging):

```bash
npm run test:e2e:ui
```

Test coverage:

- Fresh user setup flow
- Returning user with saved preferences
- Edit preferences
- Error handling (invalid postcode, API failures)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Deploy (no environment variables needed!)

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform that supports Node.js:

- Railway
- Render
- AWS Amplify
- Netlify

No environment variables required!

## Example Recommendations

**Personalised recommendations** (based on user setup):

- **Line-dry laundry**: "Excellent line-drying conditions tomorrow with 5 hours of good drying and 10mph wind at 65% humidity. Hang your washing outside to save energy and money."
- **EV solar charging**: "Best charging window: 12:00-14:00 when your solar panels will generate maximum power. Clear skies with temperatures around 18°C mean strong solar generation."
- **Heat pump efficiency**: "Temperatures tomorrow (10°C) are ideal for heat pump efficiency. Your system will use 30-40% less energy than in very cold weather."
- **Hot water tank timing**: "Mild night ahead (12°C low) means less heat loss from your tank. Heat during off-peak hours (11pm-7am) for maximum savings."
- **Electric heating with solar**: "Strong solar generation tomorrow - run electric heating 13:00-15:00 to use your own electricity."

**Weather-driven recommendations** (for everyone):

- **Indoor drying**: "Low humidity tomorrow (45%) means clothes will dry quickly indoors without additional heating. Use a clothes airer near natural ventilation."
- **Natural ventilation**: "Mild temperatures tomorrow (19°C) will reach your preferred temperature of 19°C - ideal conditions for natural ventilation."
- **Curtains for insulation**: "Cold night ahead (dropping to 2°C). Close curtains and blinds at dusk to prevent heat loss."
- **Batch cooking**: "Cold and wet tomorrow - ideal for batch cooking. Prep multiple meals at once while the oven heat helps warm your home."

All recommendations include:

- ✅ Savings estimates (£0.15-£4.00 per action)
- ✅ Clear reasoning (why the recommendation makes sense)
- ✅ Time-specific windows (when applicable)
- ✅ Priority indicators (high/medium/low)

_Recommendations adapt based on weather, time of day, day of week, and user's specific home setup_

## API Rate Limits

- **Postcodes.io**: Free, unlimited, no authentication required
- **Open-Meteo**: Free, 10,000 calls/day for non-commercial use, no authentication required

Both APIs are more than sufficient for an MVP. The app implements:

- **Client-side caching**: React Query caches weather data for 5 minutes per postcode
- **Server-side initial fetch**: First load fetches server-side to avoid client waterfalls
- **Efficient fetching**: Single API call fetches both today and tomorrow's weather

## Future Enhancements

- **User accounts**: Database-backed authentication for cross-device sync
- **Energy provider integration**: Connect to real UK energy APIs for Time-of-Use rates (Octopus Energy, etc.)
- **Notifications**: Email/push notifications for daily tips or time-sensitive recommendations
- **Historical tracking**: Track user actions and energy savings over time
- **Advanced recommendations**: Machine learning to personalise tips based on user behaviour
- **Weather alerts**: Notify users of extreme weather conditions
- **Community features**: Share tips and savings with other users in your area

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
