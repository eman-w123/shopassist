import { Link } from "react-router-dom";
import { ArrowRight, Bot, Code2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Bot,
    title: "Product-Aware",
    desc: "Trained on your catalog so it answers about real products, prices, sizes and stock — never guesses.",
  },
  {
    icon: Zap,
    title: "Instant Replies",
    desc: "Sub-second responses powered by Gemini. Shoppers get help the moment they need it.",
  },
  {
    icon: Code2,
    title: "Easy to Embed",
    desc: "Copy-paste a single script tag into your store. Live in minutes, not weeks.",
  },
];

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-soft" />
        <div className="absolute -top-32 left-1/2 -z-10 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

        <div className="container flex flex-col items-center gap-8 py-20 text-center sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Powered by Google Gemini
          </div>

          <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl">
            <span className="bg-gradient-hero bg-clip-text text-transparent">ShopAssist</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            AI Customer Support for Your Online Store. Answer product questions, recover carts, and close more sales — automatically.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-gradient-hero px-7 shadow-glow hover:opacity-95">
              <Link to="/demo">
                Try Demo <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/embed">Get embed code</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
