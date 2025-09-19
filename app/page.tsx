"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Sparkles, Heart, Share2, Download, Zap } from "lucide-react";

export default function HomePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      router.push("/pet-generator");
    } else {
      router.push("/sign-up");
    }
  };

  const features = [
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: "Easy Upload",
      description: "Simply upload your pet's photo and watch the magic happen"
    },
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "AI Magic",
      description: "Advanced AI transforms your pet into stunning artistic creations"
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: "Multiple Styles",
      description: "Choose from holidays, professions, fantasy, fashion, and art styles"
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: "Social Ready",
      description: "Share your creations instantly on social media platforms"
    }
  ];

  const qualityOptions = [
    { name: "Standard", credits: 100, description: "Perfect for social sharing" },
    { name: "2K Quality", credits: 300, description: "High resolution for printing" },
    { name: "4K Ultra", credits: 500, description: "Professional grade quality" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                🎨 AI-Powered Pet Photography
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Transform Your Pet Into Art
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Create stunning, professional-quality photos of your beloved pets with our advanced AI technology. 
                From holiday themes to fantasy adventures, bring your pet's personality to life.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                disabled={isLoading}
                className="px-8 py-6 text-lg font-semibold"
              >
                <Zap className="mr-2 h-5 w-5" />
                {user ? "Start Creating" : "Get Started Free"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/gallery")}
                className="px-8 py-6 text-lg"
              >
                View Gallery
              </Button>
            </div>

            {!user && (
              <p className="text-sm text-muted-foreground">
                🎁 Try your first generation free • No credit card required
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center space-y-12"
          >
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Transform your pet photos in just a few simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center space-y-12"
          >
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Quality Options</h2>
              <p className="text-lg text-muted-foreground">
                Choose the perfect quality for your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {qualityOptions.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <Card className={`h-full ${index === 1 ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">{option.name}</CardTitle>
                      <div className="text-3xl font-bold text-primary">
                        {option.credits} Credits
                      </div>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Create Magic?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of pet owners who have already transformed their furry friends into stunning works of art.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="px-8 py-6 text-lg font-semibold"
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Your First Creation
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
