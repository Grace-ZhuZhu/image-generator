# AI-Petography 🐾

Transform your beloved pets into stunning artistic creations with advanced AI technology. Create professional-quality photos with holiday themes, fantasy adventures, and more.

## 🌟 Overview

AI-Petography is a modern, production-ready platform built with Next.js, Supabase, and Creem.io. It leverages the power of Seedream 4 AI to transform ordinary pet photos into extraordinary artistic masterpieces.

## ✨ Core Features

- 🎨 **AI-Powered Pet Photo Generation**
  - Advanced Seedream 4 AI integration
  - Multiple quality levels (Normal, 2K, 4K)
  - 5 core themes: Holiday, Professional, Fantasy, Fashion, Art
  - Professional-grade image generation in ~10 seconds

- 🖼️ **Beautiful User Interface**
  - Modern, responsive design optimized for all devices
  - Smooth animations and transitions with Framer Motion
  - Waterfall layout for browsing reference images
  - Intuitive drag-and-drop upload interface

- 🚀 **Next.js App Router**
  - Latest Next.js features and optimizations
  - Server and client components for optimal performance
  - Built-in route protection and middleware
  - Fast page loading and navigation

- 🔐 **Complete Authentication System**
  - Powered by Supabase Auth
  - Email/password authentication
  - OAuth provider support (Google, GitHub, etc.)
  - Secure session management
  - Row-level security (RLS) for data protection

- 💳 **Flexible Payment & Credit System**
  - Seamless Creem.io integration for global payments
  - Credit-based pricing model (100/300/500 credits)
  - Detailed usage tracking and history
  - Automatic customer record management

- 🛠️ **Developer Experience**
  - Full TypeScript type safety
  - Clean, modular project structure
  - Comprehensive documentation
  - Modern development tools and practices

## 🎯 How It Works

1. **Upload Pet Photos**: Users upload up to 3 photos of their pets
2. **Choose Theme & Style**: Select from 5 curated themes with reference images
3. **AI Generation**: Seedream 4 AI creates stunning transformations in ~10 seconds
4. **Quality Selection**: Choose from Normal (100 credits), 2K (300 credits), or 4K (500 credits)
5. **Download & Share**: Save results and share on social media platforms

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Creem.io account
- Seedream 4 API access

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ai-petography.git
cd ai-petography
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Create a new project on [Supabase](https://app.supabase.com)
   - Click "New Project"
   - Fill in project details (name, password, etc.)

2. Go to Project Settings > API to get your credentials
   - Copy the project URL and anon key
   - Paste them into your .env.local file

3. Run the database migrations
   ```bash
   npx supabase db push
   ```

### Step 4: Set Up Creem.io Payment System

1. Sign up for [Creem.io](https://www.creem.io/)
2. Initial setup
   - Enable test mode for development
   - Navigate to "Developer" section in the top navigation
   - Copy your API Key and paste it into your .env.local file

3. Create Webhooks
   - Go to Developer > Webhooks
   - Create a new webhook
   - Set URL: `https://yourdomain.com/api/webhooks/creem`
   - Copy the webhook secret and add it to your .env.local file

4. Update environment variables
   ```bash
   cp .env.example .env.local
   ```

   Add to your `.env.local`:
   ```
   CREEM_API_KEY=your_api_key
   CREEM_WEBHOOK_SECRET=your_webhook_secret
   CREEM_API_URL=https://test-api.creem.io/v1
   ```

### Step 5: Configure Seedream 4 API

1. Get access to Seedream 4 API
2. Add your API credentials to `.env.local`:
   ```
   SEEDREAM_API_KEY=your_seedream_api_key
   SEEDREAM_API_URL=https://api.seedream.ai/v1
   SEEDREAM_MODEL=seedream-4
   ```

### Step 6: Set Up Image Storage

1. In your Supabase project, create a storage bucket:
   - Go to Storage in the Supabase dashboard
   - Create a new bucket named "pet-images"
   - Set appropriate permissions for authenticated users

2. Add the bucket name to your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=pet-images
   ```

### Step 7: Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

### Step 8: Deploy to Vercel

1. Push your code to GitHub
2. Import your repository to [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy your application

### Step 9: Update Production Webhooks

1. In Creem.io dashboard, switch to production mode
2. Update webhook configuration:
   - Go to Developer > Webhooks
   - Edit your webhook
   - Update URL to: `https://yourdomain.com/api/webhooks/creem`

## 🏗️ Project Structure

```
ai-petography/
├── app/                    # Next.js App Router
│   ├── (auth-pages)/      # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   └── profile/           # User profile
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Dashboard-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── supabase/            # Database migrations
└── utils/               # Helper functions
```

## 🧪 Testing

Test the system functionality:

1. **User Authentication**: Sign up and sign in flows
2. **Credit System**: Purchase credits using test card (4242 4242 4242 4242)
3. **Image Upload**: Upload pet photos and test validation
4. **AI Generation**: Test the complete generation workflow

## 📚 API Documentation

### Core Endpoints

- `POST /api/credits` - Manage user credits
- `POST /api/webhooks/creem` - Handle payment webhooks
- `POST /api/pet-generation` - Generate AI pet photos (coming soon)

## 🔒 Security Features

- Row Level Security (RLS) for data protection
- File upload validation and sanitization
- Rate limiting for API endpoints
- Content moderation for generated images
- Secure payment processing with Creem.io
## 💡 Usage Examples

### Basic Pet Photo Generation

```typescript
// Example API call for generating pet photos
const generatePetPhoto = async (petImage: File, theme: string, quality: string) => {
  const formData = new FormData();
  formData.append('petImage', petImage);
  formData.append('theme', theme);
  formData.append('quality', quality);

  const response = await fetch('/api/pet-generation', {
    method: 'POST',
    body: formData,
  });

  return response.json();
};
```

### Credit Management

```typescript
// Check user credits
const { credits, loading } = useCredits();

// Spend credits for generation
const success = await spendCredits(300, 'pet_photo_generation');
```

## 🎨 Themes Available

1. **Holiday** - Festive seasonal transformations
2. **Professional** - Business and career-themed photos
3. **Fantasy** - Magical and mythical adventures
4. **Fashion** - Stylish and trendy looks
5. **Art** - Artistic and creative interpretations

## 🔧 Configuration

### Environment Variables

All required environment variables are documented in `.env.example`. Key configurations include:

- **Supabase**: Database and authentication
- **Creem.io**: Payment processing
- **Seedream 4**: AI image generation
- **Storage**: Image upload and management

### Database Schema

The application uses the following main tables:
- `customers` - User and payment information
- `credits_history` - Credit transaction tracking
- `ip_usage_logs` - Rate limiting for free users
- `pet_generations` - Generated image records (coming soon)

## 🚀 Production Deployment

### Switch to Production Mode

1. Update Creem.io to production mode
2. Update environment variables:
   ```
   CREEM_API_URL=https://api.creem.io
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```
3. Update webhook URLs in Creem.io dashboard

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For questions and support, please open an issue on GitHub or contact the development team.
