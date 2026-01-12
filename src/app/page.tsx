"use client";

import { TextHumanizer } from "@/components/TextHumanizer";
import { Ghost, Zap, Shield, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Ghost,
    title: "Stealthy Output",
    description: "Text that passes through undetected, naturally blending with human-written content.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get results in under 5 seconds. No waiting, no delays.",
  },
  {
    icon: Shield,
    title: "Meaning Preserved",
    description: "Your original message stays intact while the style transforms.",
  },
  {
    icon: Sparkles,
    title: "Pattern Breaking",
    description: "Advanced algorithms break AI patterns and inject natural variations.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out PolterText",
    features: ["500 words/day", "All tones & levels", "Basic processing", "Web access"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Student",
    price: "$4.99",
    period: "/month",
    description: "For students and light users",
    features: ["5,000 words/day", "Priority processing", "Download history", "Email support"],
    cta: "Get Student",
    popular: false,
  },
  {
    name: "Pro",
    price: "$14.99",
    period: "/month",
    description: "For professionals and creators",
    features: ["50,000 words/day", "Fastest processing", "API access", "Priority support", "Batch processing"],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Agency",
    price: "$49.99",
    period: "/month",
    description: "For teams and businesses",
    features: ["Unlimited words", "Custom integrations", "Dedicated support", "SLA guarantee", "Team accounts"],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ghost className="w-7 h-7 text-primary" />
            <span className="text-xl font-semibold tracking-tight">PolterText</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#editor" className="hover:text-foreground transition-colors">Editor</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Sign In</Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs uppercase tracking-widest border-primary/30 text-primary">
                AI Text Humanizer
              </Badge>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
            >
              Make Your Text
              <span className="block text-primary">Invisibly Human</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Transform AI-generated content into naturally flowing human text. 
              Stealthy, fast, and undetectable—like a ghost in your words.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-12 px-8 text-base">
                <Sparkles className="w-4 h-4 mr-2" />
                Try It Free
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border/50 bg-card/30">
                See How It Works
              </Button>
            </motion.div>
          </div>
        </section>

        <section id="editor" className="py-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <TextHumanizer />
          </motion.div>
        </section>

        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why PolterText?</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A sophisticated blend of rule-based processing and AI refinement for natural, undetectable output.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6 border-t border-border/30">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground text-lg">Three layers of transformation for natural output</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Rule-Based Preprocessing", desc: "AI patterns are detected and broken. Generic phrases removed, sentences restructured." },
                { step: "02", title: "AI Refinement Layer", desc: "Controlled AI rewrites with strict temperature settings for natural flow." },
                { step: "03", title: "Post-Processing Polish", desc: "Final pass adds human touches—contractions, varied rhythm, natural imperfections." },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 px-6 border-t border-border/30">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
              <p className="text-muted-foreground text-lg">Choose the plan that fits your needs</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                    plan.popular 
                      ? "bg-primary/5 border-primary/50 shadow-lg shadow-primary/10" 
                      : "bg-card/30 border-border/30 hover:border-primary/30"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-card hover:bg-accent border border-border/50"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6 border-t border-border/30">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Ghost className="w-16 h-16 text-primary mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Haunt Your Text?</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Start transforming your AI-generated content today. No credit card required.
              </p>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-12 px-8">
                Get Started Free
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ghost className="w-5 h-5 text-primary" />
            <span className="font-semibold">PolterText</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Polish AI-assisted writing. Improve readability & naturalness.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
