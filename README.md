# 🏎️ F1 Bingo Leagues

A competitive Formula 1 bingo platform where users create leagues, make race predictions, and compete for points across the F1 season.

## ✨ Features

- **League Management**: Create private leagues with unique invite codes or join existing ones
- **Race Predictions**: Submit 25 predictions for each F1 race weekend in a bingo board format
- **Live Claims**: During races, claim predictions as they happen in real-time
- **Community Voting**: League members vote to approve or reject claims
- **Leaderboards**: Track cumulative points, bingos completed, and prediction accuracy
- **Race-Specific Stats**: View individual race results and overall season standings
- **Real-time Updates**: Live leaderboard updates and claim notifications
- **Mobile Responsive**: Optimized for both desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Authentication + Real-time)
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ or Bun
- Supabase account with a configured project
- Git

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd f1-bingo-leagues
```

### 2. Install dependencies

Using npm:
```bash
npm install
```

Or using bun:
```bash
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your [Supabase project settings](https://supabase.com/dashboard).

### 4. Database Setup

You'll need to set up the following tables in Supabase:

- `users` - User profiles
- `leagues` - League information
- `league_members` - League membership and stats
- `global_races` - F1 race calendar
- `boards` - User prediction boards per race
- `predictions` - Individual predictions on boards
- `claims` - Claim submissions during races
- `claim_votes` - Votes on claims

*Refer to your Supabase migrations or contact the repository maintainer for the complete schema.*

### 5. Run Development Server

```bash
npm run dev
```

Or with bun:
```bash
bun run dev
```

Visit `http://localhost:5173` to view the app.

## 📦 Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click "Deploy"

Vercel will automatically detect the Vite configuration and deploy your app.

### Environment Variables on Vercel

In your Vercel project settings:
1. Go to Settings → Environment Variables
2. Add `VITE_SUPABASE_URL` with your Supabase URL
3. Add `VITE_SUPABASE_ANON_KEY` with your Supabase anon key
4. Make sure they're available for Production, Preview, and Development environments

## 🎮 How to Play

1. **Create an Account**: Sign up with email and password
2. **Join/Create a League**: Use an invite code to join or create your own league
3. **Make Predictions**: Before each race locks, fill out your 25-prediction bingo board
4. **Claim During Race**: Watch the race live and claim predictions as they happen
5. **Vote on Claims**: Review and vote on other members' claims
6. **Earn Points**: Get points for correct predictions, bingos (5 in a row), and full board completion
7. **Climb Leaderboard**: Compete for the top spot in your league

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   └── ...           # Feature components
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries (Supabase, utils)
├── pages/            # Route pages
├── types/            # TypeScript type definitions
└── main.tsx          # Application entry point
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🐛 Known Issues

- Claims require manual voting for approval/rejection
- Race status updates require manual admin input
- Results finalization happens when users visit race pages

## 🔮 Future Enhancements

- Admin dashboard for race management
- Automated claim verification using F1 data APIs
- Push notifications for race starts and claims
- Historical data visualization and analytics
- Mobile app (React Native)

## 📧 Support

For issues or questions, please open an issue on GitHub or contact the maintainer.

---

Built with ❤️ for F1 fans
