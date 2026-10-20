import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { buttonStyles } from "@/components/ui/button";
import { home } from "@/content/home";

export function HomeHero() {
  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">
            {home.hero.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {home.hero.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {home.hero.description}
          </p>
          <div className="mt-8">
            <Link
              href={home.hero.primaryAction.href}
              className={buttonStyles({ size: "lg" })}
            >
              {home.hero.primaryAction.label}
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
