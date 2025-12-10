# EcoTuned

A weather-driven energy and money-saving suggestion app that helps UK users make smarter decisions about household activities based on today and tomorrow's forecast.

## Features

- Personalised energy-saving recommendations based on today and tomorrow's weather
- **Live GB electricity grid mix display** - See real-time renewable vs fossil vs nuclear generation (updates every 30 minutes)
- **Grid-aware recommendations** - Get suggestions to run appliances when grid is cleanest
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
5. **Heating Type**: Gas Boiler, Electric Heating, Heat Pump, Oil Boiler, or Other (for heating-specific tips)
6. **Hot Water System**: Options adapt based on your heating type
   - Gas: Combi Boiler, Hot Water Tank, or Other
   - Electric: Hot Water Tank, Electric Immersion, or Other
   - Heat Pump: Hot Water Tank or Other
   - Oil: Hot Water Tank or Other
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
- **APIs** (all free, no registration required):
  - [Postcodes.io](https://postcodes.io/) - Free UK postcode to lat/long conversion
  - [Open-Meteo](https://open-meteo.com/) - Free weather forecast data (temperature, humidity, solar radiation, wind, precipitation)
  - [Carbon Intensity API](https://carbonintensity.org.uk/) - Free GB electricity grid generation mix and carbon intensity data

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
│   ├── api/
│   │   ├── grid/
│   │   │   └── route.ts    # Grid data API with server-side caching
│   │   └── weather/
│   │       └── route.ts    # Weather data API with server-side caching
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
│   ├── GridMix.tsx         # Live electricity grid mix visualization
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

- **Server-side initial load**: Main page fetches weather and grid data server-side for fast first paint
- **Two-tier caching strategy**:
  - **Server-side (Edge/CDN)**: Next.js API routes with HTTP cache headers
    - Weather data: 5-minute cache (`s-maxage=300`)
    - Grid data: 30-minute cache (`s-maxage=1800`)
    - Shared globally across all users on Vercel Edge network
    - `stale-while-revalidate` for graceful background updates
  - **Client-side**: React Query manages browser cache
    - Weather data: 5-minute stale time
    - Grid data: 30-minute stale time
    - Per-user caching in browser
- **API Routes**: `/api/weather` and `/api/grid` act as caching layer between client and external APIs
- **Separate queries**: Weather and grid data are fetched independently - grid failures don't break the page
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
  day: 'today' | 'tomorrow',
  gridData?: GridData  // Optional - only for "today" recommendations
): Recommendation[]
```

**Key Features**:

- **Pure function**: No side effects or API calls - easy to test and reason about
- **Time-aware**: Marks recommendations as "passed" when their action window has closed (e.g., line-drying after sunset)
- **Grid-aware**: When grid data is available (today only), generates recommendations based on renewable percentage and carbon intensity
- **Personalisation-first**: Prioritises recommendations based on user's specific setup (heating type, tariff, etc.)
- **Category diversity**: Max 2 recommendations per category to avoid overwhelming users
- **Priority sorting**: High → medium → low, with personalised recommendations favored
- **Weather-driven**: Uses postcode-specific forecast data (temperature, humidity, solar radiation, wind, precipitation)
- **Smart categorisation**: laundry, heating, mobility, cooking, insulation, appliances

**Recommendation Categories**:

1. **Laundry**: Line-drying (outdoor), indoor drying (low humidity)
2. **Mobility**: EV charging (solar + off-peak optimisation)
3. **Heating**:
   - Heat pump efficiency optimization
   - Gas heating: Thermostat reduction in mild weather, pre-heating before cold snaps, solar-electric appliance substitution
   - Oil heating: Thermostat reduction (more aggressive than gas), zone heating in cold weather, batch heating strategy
   - Hot water timing (tank-based systems)
   - Natural ventilation
4. **Cooking**: Batch cooking on cold/rainy days, avoid oven heat on hot days
5. **Insulation**: Curtains/blinds for temperature control
6. **Appliances**: Off-peak dishwasher/washing machine for time-of-use tariffs, grid-aware usage during clean energy periods

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

**Test Coverage (26 tests)**:

- **Recommendation logic** (26 tests in `__tests__/recommendations.test.ts`):
  - Line-drying recommendations (outdoor/indoor conditions)
  - EV charging recommendations (solar + off-peak)
  - Hot water timing recommendations (tanks, combi, electric)
  - Heating recommendations (heat pumps, electric, natural ventilation)
  - Appliance timing (off-peak tariffs)
  - Grid-aware recommendations (6 tests):
    - High renewable generation triggers (≥60% high priority, ≥50% medium priority)
    - Low carbon intensity triggers (<150 g/kWh)
    - Edge cases (no grid data, wrong day, insufficient renewables)
  - Priority sorting and personalisation
- **Schema validation** (tests in `__tests__/schemas.test.ts`):
  - User preferences validation
  - Weather data validation
  - Grid data validation

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
- **Gas heating - mild weather**: "Mild temperatures tomorrow (15°C) mean you can reduce your thermostat to 18.5°C (from 20°C) without discomfort. Layer up with a jumper for extra warmth. Save £0.10-£0.25 per day."
- **Gas heating - cold preheat**: "Very cold night ahead (3°C). Pre-heat your home to 20°C in the evening (6-8pm), then reduce to 18°C overnight. This reduces strain on your boiler during the coldest hours. Save £0.25-£0.50 per day."
- **Oil heating - zone heating**: "Very cold tomorrow (3°C). Close doors and reduce heating in unused rooms by 4°C. Focus heat on living spaces. Oil heating is expensive - zone heating can cut costs by 30-40%. Save £1.00-£1.50 per day."
- **Oil heating - batch heating**: "Stable mild weather tomorrow (11-15°C). Heat to 20°C twice daily (morning and evening) instead of maintaining constant low heat. Oil boilers are more efficient at higher output. Save £0.30-£0.50 per day."
- **Hot water tank timing**: "Mild night ahead (12°C low) means less heat loss from your tank. Heat during off-peak hours (11pm-7am) for maximum savings."
- **Electric heating with solar**: "Strong solar generation tomorrow - run electric heating 13:00-15:00 to use your own electricity."

**Weather-driven recommendations** (for everyone):

- **Indoor drying**: "Low humidity tomorrow (45%) means clothes will dry quickly indoors without additional heating. Use a clothes airer near natural ventilation."
- **Natural ventilation**: "Mild temperatures tomorrow (19°C) will reach your preferred temperature of 19°C - ideal conditions for natural ventilation."
- **Curtains for insulation**: "Cold night ahead (dropping to 2°C). Close curtains and blinds at dusk to prevent heat loss."
- **Batch cooking**: "Cold and wet tomorrow - ideal for batch cooking. Prep multiple meals at once while the oven heat helps warm your home."

**Grid-aware recommendations** (today only, based on live electricity mix):

- **High renewables**: "The GB grid is currently powered by 65% renewable energy (53% wind, 8% solar). This is a cleaner-than-average time to use electricity. Consider running your dishwasher, washing machine, or other high-energy appliances now."
- **Low carbon intensity**: "The grid's carbon intensity is currently 130 g/kWh (low), which is lower than the UK average of ~200 g/kWh. A good time to use electricity-intensive appliances like ovens, washing machines, or electric heating."

All recommendations include:

- ✅ Savings estimates (£0.15-£4.00 per action)
- ✅ Clear reasoning (why the recommendation makes sense)
- ✅ Time-specific windows (when applicable)
- ✅ Priority indicators (high/medium/low)

_Recommendations adapt based on weather, time of day, day of week, and user's specific home setup_

## API Rate Limits

- **Postcodes.io**: Free, unlimited, no authentication required
- **Open-Meteo**: Free, 10,000 calls/day for non-commercial use, no authentication required
- **Carbon Intensity API**: Free, no rate limits published, no authentication required

All APIs are more than sufficient for an MVP. The app implements efficient caching to minimize API usage:

- **Two-tier caching** (server + client):
  - **Server-side (Vercel Edge)**: Shared cache across all users globally
    - Weather: 5-minute cache, 10-minute stale-while-revalidate
    - Grid: 30-minute cache, 60-minute stale-while-revalidate
  - **Client-side (React Query)**: Per-user browser cache
    - Weather: 5-minute stale time
    - Grid: 30-minute stale time
- **Shared cache benefits**:
  - Multiple users requesting same postcode get cached response
  - Drastically reduces API calls under load
  - Ready to scale from MVP to production
- **Server-side initial fetch**: First page load is server-rendered for fast first paint
- **Efficient fetching**:
  - Single API call fetches both today and tomorrow's weather
  - Grid data fetched separately so failures don't break the page

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
