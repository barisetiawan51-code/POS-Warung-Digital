import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { designSystem } from "@/content/design-system";

export function MotionSection() {
  const { motion } = designSystem;

  return (
    <Section>
      <Container>
        <SectionHeading title={motion.title} description={motion.description} />
        <div className="mt-8 space-y-10">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Durasi
            </h3>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {motion.durations.map((item) => (
                <li
                  key={item.name}
                  className="rounded-lg border border-border p-4"
                >
                  <p className="font-mono text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.usage}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Easing
            </h3>
            <div className="mt-4 rounded-lg border border-border p-6">
              <p className="font-mono text-sm font-medium">
                {motion.easing.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {motion.easing.usage}
              </p>
              <div className="group mt-6 flex items-center gap-6">
                <div className="size-10 shrink-0 rounded-md bg-primary transition-transform duration-400 ease-smooth group-hover:translate-x-24" />
                <p className="text-sm text-muted-foreground">
                  {motion.demoHint}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
