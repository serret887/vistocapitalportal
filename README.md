# Partner Onboarding Portal

A modern SaaS onboarding portal for real estate partners built with Next.js 15, TypeScript, Tailwind CSS, and Shadcn/UI. The backend is powered by Supabase.

## Features

- **4-Step Onboarding Flow**: Guided partner registration process
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Form Validation**: Real-time validation with helpful error messages
- **Progress Tracking**: Visual step indicator showing completion status
- **Database Integration**: Stores partner data in Supabase
- **Toast Notifications**: User-friendly success/error feedback
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/UI
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Package Manager**: Yarn

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn package manager
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd partner-onboarding-portal
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Get your project URL and anon key from the API settings

4. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.local.example .env.local
   
   # Update with your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── onboarding/        # Onboarding flow
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Shadcn/UI components
│   ├── steps/            # Onboarding step components
│   └── StepIndicator.tsx # Progress indicator
├── contexts/             # React contexts
│   └── OnboardingContext.tsx
├── lib/                  # Utility functions
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # General utilities
└── types/                # TypeScript type definitions
    └── index.ts
```

## Onboarding Flow

The application features a 4-step onboarding process:

1. **Partner Type Selection**: Choose from Wholesaler, Investor, Real Estate Agent, or Marketing Partner
2. **Contact Information**: Enter phone number
3. **Business Information**: Deals per month, monthly volume, and transaction types
4. **License Information**: Optional license details for Real Estate Agents

## Database Schema

The `partner_profiles` table stores:

- `id`: Unique identifier (UUID)
- `user_id`: User identifier (placeholder for now)
- `partner_type`: Type of partner
- `phone_number`: Contact phone number
- `deals_per_month`: Number of deals per month
- `monthly_volume`: Monthly transaction volume
- `transaction_types`: Array of transaction types
- `license_number`: Optional license number
- `license_state`: Optional license state
- `onboarding_completed`: Completion status
- `created_at`: Timestamp

## Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically detect Next.js and deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Development

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

### Adding New Components

To add new Shadcn/UI components:

```bash
npx shadcn@latest add <component-name>
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
