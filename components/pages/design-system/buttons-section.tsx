import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { Button, buttonStyles } from "@/components/ui/button";
import { designSystem } from "@/content/design-system";

export function ButtonsSection() {
  const { buttons } = designSystem;

  return (
    <Section>
      <Container>
        <SectionHeading
          title={buttons.title}
          description={buttons.description}
        />
        <div className="mt-8 space-y-10">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Varian
            </h3>
            <ul className="mt-4 space-y-4">
              {buttons.variants.map((item) => (
                <li
                  key={item.variant}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2"
                >
                  <Button variant={item.variant}>{item.label}</Button>
                  <p className="text-sm text-muted-foreground">{item.usage}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Ukuran
            </h3>
            <ul className="mt-4 space-y-4">
              {buttons.sizes.map((item) => (
                <li
                  key={item.size}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2"
                >
                  <Button size={item.size}>{item.label}</Button>
                  <p className="text-sm text-muted-foreground">{item.usage}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Tautan bergaya tombol
            </h3>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                href="/"
                className={buttonStyles({ variant: "outline", size: "md" })}
              >
                Kembali ke Beranda
              </Link>
              <p className="text-sm text-muted-foreground">
                {buttons.linkNote}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
