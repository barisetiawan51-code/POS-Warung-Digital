import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { home } from "@/content/home";

export function HomeFeatures() {
  return (
    <Section className="pt-0">
      <Container>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          {home.features.title}
        </h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {home.features.items.map((item) => (
            <li
              key={item.title}
              className="rounded-lg border border-border p-6"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
