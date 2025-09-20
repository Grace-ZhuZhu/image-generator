"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Sparkles, Heart, Share2, Zap } from "lucide-react";

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
              </p>
            </div>
          </motion.div>
        </div>
      </section>


      {/* CTA Section */}
    </div>
  );
}
