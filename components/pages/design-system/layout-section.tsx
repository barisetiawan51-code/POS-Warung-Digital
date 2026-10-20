import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { designSystem } from "@/content/design-system";

export function LayoutSection() {
  const { layout } = designSystem;

  return (
    <Section>
      <Container>
        <SectionHeading title={layout.title} description={layout.description} />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {layout.tokens.map((token) => (
            <li
              key={token.name}
              className="rounded-lg border border-dashed border-border p-4"
            >
              <p className="font-mono text-sm font-medium">{token.name}</p>
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
