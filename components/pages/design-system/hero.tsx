import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { designSystem } from "@/content/design-system";

export function DesignSystemHero() {
  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">
            {designSystem.hero.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {designSystem.hero.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {designSystem.hero.description}
          </p>
        </div>
      </Container>
    </Section>
  );
}
