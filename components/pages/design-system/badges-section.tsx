import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { Badge } from "@/components/ui/badge";
import { designSystem } from "@/content/design-system";

export function BadgesSection() {
  const { badges } = designSystem;

  return (
    <Section>
      <Container>
        <SectionHeading title={badges.title} description={badges.description} />
        <ul className="mt-8 space-y-4">
          {badges.variants.map((item) => (
            <li
              key={item.variant}
              className="flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              <Badge variant={item.variant}>{item.label}</Badge>
              <p className="text-sm text-muted-foreground">{item.usage}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
