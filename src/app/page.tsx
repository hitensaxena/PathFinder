"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Brain, Rocket, Clock, LineChart, BookOpen, Quote, Map as MapIcon, ChevronRight, Menu, X } from "lucide-react";
import { AuthButtons } from "@/components/auth-buttons";

export default function PathAInderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
 
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/90 z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 whitespace-nowrap overflow-x-auto">
                Your Personalized Learning Journey Starts Here
              </h1>
              <p className="text-lg text-muted-foreground mb-10">
                Enter what you want to learn, and we'll create a custom roadmap just for you
              </p>
            </div>
            <div className="flex justify-center mb-16">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const learningGoal = formData.get('learningGoal') as string;
                  router.push(`/generate?goal=${encodeURIComponent(learningGoal)}`);
                }}
                className="w-full max-w-4xl flex gap-4 items-center bg-card/90 shadow-2xl rounded-xl p-6 md:p-8 border-2 border-primary/30 animate-fade-in"
                style={{ boxShadow: '0 0 40px 0 rgba(255, 140, 0, 0.15)' }}
              >
                <Input
                  name="learningGoal"
                  placeholder="What would you like to learn? (e.g., Web Development, Data Science, Machine Learning, Digital Marketing...)"
                  className="flex-1 text-xl py-8 px-6 rounded-lg border-2 border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/30 bg-background/80 shadow-md  transition-all duration-300 focus:scale-105 focus:shadow-lg focus:shadow-primary/30"
                  autoFocus
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  className="px-10 py-8 rounded-lg font-bold text-xl bg-gradient-to-r from-primary to-accent animate-gradient hover:scale-110 hover:shadow-primary/40 transition-all duration-300 animate-bounce-slow whitespace-nowrap focus:animate-pulse"
                >
                  <span className="mr-2">Generate Path</span>
                  <ChevronRight className="h-6 w-6 animate-slide-in-right" />
                </Button>
              </form>
            </div>

            {/* Popular Learning Paths */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-8">Popular Learning Paths</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "Web Development",
                  "Data Science",
                  "Machine Learning",
                  "Digital Marketing",
                  "UI/UX Design",
                  "Mobile Development",
                  "Cloud Computing",
                  "Cybersecurity",
                  "Python Programming",
                  "JavaScript Mastery",
                  "React Development",
                  "SQL & Databases",
                ].map((path, index) => (
                  <button
                    key={path}
                    onClick={() => {
                      const input = document.querySelector('input[name="learningGoal"]') as HTMLInputElement;
                      if (input) {
                        input.value = path;
                        input.focus();
                      }
                    }}
                    className="group relative p-4 rounded-xl bg-card/80 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {path}
                      </h3>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
            <div className="relative max-w-5xl mx-auto">
              {/* Vertical Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary/20 rounded-full" />
              
              {[
                {
                  title: "Enter Your Goal",
                  description: "Tell us what you want to learn, and we'll analyze your requirements.",
                  Icon: Target,
                },
                {
                  title: "Get Your Path",
                  description: "Receive a personalized learning roadmap tailored to your goals.",
                  Icon: MapIcon,
                },
                {
                  title: "Start Learning",
                  description: "Follow your custom path and track your progress along the way.",
                  Icon: Rocket,
                },
              ].map((step, index) => (
                <div
                  key={step.title}
                  className={`relative flex items-center mb-16 last:mb-0 ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10">
                    <step.Icon className="w-4 h-4 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                    <div className="relative p-6 rounded-2xl bg-card shadow-lg border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose PathAInder?</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  title: "Personalized Learning",
                  description: "Get a custom roadmap that matches your learning style and goals.",
                  Icon: Brain,
                },
                {
                  title: "Time Efficient",
                  description: "Learn faster with a structured path that focuses on what matters.",
                  Icon: Clock,
                },
                {
                  title: "Track Progress",
                  description: "Monitor your learning journey and celebrate your achievements.",
                  Icon: LineChart,
                },
              ].map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="relative p-6 rounded-2xl bg-card shadow-lg border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories Section */}
        <section id="success-stories" className="py-20 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">Success Stories</h2>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    quote: "PathAInder helped me transition from marketing to web development in just 6 months!",
                    author: "Sarah Johnson",
                    role: "Frontend Developer",
                    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
                  },
                  {
                    quote: "The personalized learning path made it easy to learn data science at my own pace.",
                    author: "Michael Chen",
                    role: "Data Scientist",
                    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
                  },
                  {
                    quote: "I went from zero to landing my dream job in cybersecurity thanks to PathAInder!",
                    author: "David Rodriguez",
                    role: "Security Engineer",
                    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
                  },
                  {
                    quote: "The structured learning path helped me master Python programming faster than I expected.",
                    author: "Emma Wilson",
                    role: "Python Developer",
                    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
                  },
                ].map((story, index) => (
                  <div
                    key={story.author}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl transform transition-transform group-hover:scale-105" />
                    <div className="relative p-6 rounded-2xl bg-card shadow-lg border border-border/50 hover:border-primary/50 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={story.image}
                            alt={story.author}
                            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                          />
                        </div>
                        <div className="flex-1">
                          <Quote className="w-8 h-8 text-primary/50 mb-4" />
                          <p className="text-lg mb-4">{story.quote}</p>
                          <div>
                            <p className="font-semibold">{story.author}</p>
                            <p className="text-muted-foreground">{story.role}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  question: "How does PathAInder create personalized learning paths?",
                  answer: "We use advanced AI to analyze your learning goals and create a custom roadmap that matches your needs, experience level, and learning style.",
                },
                {
                  question: "Is PathAInder suitable for beginners?",
                  answer: "Yes! Our paths are designed for all skill levels, from complete beginners to experienced professionals looking to expand their knowledge.",
                },
                {
                  question: "Can I modify my learning path?",
                  answer: "Absolutely! Your learning path is flexible and can be adjusted as your goals or interests change.",
                },
              ].map((faq, index) => (
                <div
                  key={faq.question}
                  className="relative p-6 rounded-2xl bg-card shadow-lg border border-border/50 hover:border-primary/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Learning Journey?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get your personalized learning path today and take the first step towards achieving your goals.
            </p>
            <Button
              size="lg"
              className="px-8 py-6 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-accent animate-gradient hover:scale-105 hover:shadow-primary/40 transition-all duration-300"
              onClick={() => {
                const input = document.querySelector('input[name="learningGoal"]') as HTMLInputElement;
                if (input) {
                  input.focus();
                }
              }}
            >
              Create Your Learning Path
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
