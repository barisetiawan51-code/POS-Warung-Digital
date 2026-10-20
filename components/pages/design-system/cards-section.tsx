import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { designSystem } from "@/content/design-system";

export function CardsSection() {
  const { cards } = designSystem;

  return (
    <Section>
      <Container>
        <SectionHeading title={cards.title} description={cards.description} />
        <Card className="mt-8 max-w-sm">
          <Badge>{cards.example.badge}</Badge>
          <h3 className="mt-4 text-lg font-semibold">{cards.example.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {cards.example.description}
          </p>
          <div className="mt-6">
            <Link
              href={cards.example.action.href}
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              {cards.example.action.label}
            </Link>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
