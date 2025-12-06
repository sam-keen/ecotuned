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

**Your Postcode**: Used to fetch accurate local weather data

**Your Setup**:
1. Do you have a garden or balcony? (for line-drying laundry)
2. Do you have an electric vehicle? (for smart charging times)
3. Do you cycle to work? (for cycle-friendly weekday cycling tips)
4. Do you have solar panels? (for solar generation forecasts)

**Weekday Availability** (when you're typically home):
- Mornings (6am-12pm)
- Afternoons (12pm-6pm)
- Evenings (6pm-12am)

*Note: Weekend availability is assumed to be flexible*

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom eco-themed design system
- **Data Fetching**: TanStack Query (React Query) for client-side caching
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Testing**: Jest (unit tests) + Playwright (e2e tests)
- **APIs** (both free, no registration required):
  - [Postcodes.io](https://postcodes.io/) - Free UK postcode to lat/long conversion
  - [Open-Meteo](https://open-meteo.com/) - Free weather forecast data from national weather services

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

The core of the app is a pure, synchronous function:

```typescript
generateRecommendations(
  weather: SimplifiedWeather,
  prefs: UserPreferences,
  isToday: boolean,
  day: 'today' | 'tomorrow'
): Recommendation[]
```

- No side effects or API calls
- Time-aware: marks recommendations as "passed" when their window has closed
- Easy to unit test in isolation
- Can be reused anywhere (server components, future API routes, etc.)
- Returns prioritised recommendations (high → medium → low)
- Day-aware logic for weekend vs weekday tips

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

- **Line-dry laundry**: "Perfect drying conditions today with 4 hours of sunny weather (10am-2pm). Hang laundry outside now to save on tumble dryer costs."
- **Cycle to work**: "Great cycling conditions today: dry, light winds (8mph), and mild temps. Cycle to work and save on fuel."
- **EV charging**: "Charge your EV between 11am-3pm today during peak solar generation hours to maximise renewable energy use."
- **Batch hot water**: "Cold forecast today (2-8°C). Schedule showers, baths, and hot water-intensive cleaning for off-peak hours when your heating is on anyway."
- **Natural ventilation**: "Mild conditions today (14-18°C, low 11°C). Open windows to naturally ventilate instead of running heating."
- **Off-peak appliances**: "Set your dishwasher and washing machine to run during off-peak hours tonight (11pm-7am)."

*Recommendations adapt based on weather, time of day, day of week, and user preferences*

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
