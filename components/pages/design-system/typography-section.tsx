import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { designSystem } from "@/content/design-system";

export function TypographySection() {
  return (
    <Section>
      <Container>
        <SectionHeading
          title={designSystem.typography.title}
          description={designSystem.typography.description}
        />
        <ul className="mt-8 space-y-10">
          <li>
            <h3 className="text-sm font-medium text-muted-foreground">
              {designSystem.font.title}
            </h3>
            <div className="mt-4 rounded-lg border border-border p-6">
              <p className="text-2xl font-medium">{designSystem.font.sample}</p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                {designSystem.font.current}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {designSystem.font.description}
            </p>
          </li>
          <li>
            <h3 className="text-sm font-medium text-muted-foreground">
              {designSystem.typography.scaleTitle}
            </h3>
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {designSystem.typography.samples.map((item) => (
                <li
                  key={item.name}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
                >
                  <p className={item.className}>{item.sample}</p>
                  <div className="sm:text-right">
                    <p className="font-mono text-xs font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.usage}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </Container>
    </Section>
  );
}
