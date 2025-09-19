"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Camera,
  Heart,
  Settings,
  Download,
  Zap
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    setLoading(false);
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your pet creations and account</p>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{user.email}</CardTitle>
                <p className="text-muted-foreground">Pet Photography Enthusiast</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pet Gallery Coming Soon</h3>
              <p className="text-muted-foreground mb-6">
                Your generated pet photos and creation history will appear here once you start creating!
              </p>
              <Button onClick={() => router.push("/pet-generator")}>
                <Zap className="mr-2 h-4 w-4" />
                Create Your First Photo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}