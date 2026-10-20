import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { designSystem } from "@/content/design-system";
import { cn } from "@/lib/utils";

export function RadiusSection() {
  return (
    <Section>
      <Container>
        <SectionHeading
          title={designSystem.radius.title}
          description={designSystem.radius.description}
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {designSystem.radius.tokens.map((token) => (
            <li
              key={token.name}
              className="rounded-lg border border-border p-4"
            >
              <div
                className={cn(
                  "h-16 border border-border bg-muted",
                  token.className,
                )}
              />
              <p className="mt-3 font-mono text-sm font-medium">{token.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {token.usage}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
