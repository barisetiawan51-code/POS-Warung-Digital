import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { designSystem } from "@/content/design-system";
import { site } from "@/content/site";

export function ThemeSection() {
  const { theme } = designSystem;

  return (
    <Section>
      <Container>
        <SectionHeading title={theme.title} description={theme.description} />
        <div className="mt-8 flex items-center gap-4 rounded-lg border border-border p-4">
          <ThemeToggle labels={site.theme} />
          <p className="text-sm text-muted-foreground">{theme.toggleNote}</p>
        </div>
      </Container>
    </Section>
  );
}
