import type { IconType } from "react-icons";
import { LuCheck, LuMapPin, LuPhone } from "react-icons/lu";
import { TbChefHat } from "react-icons/tb";
import { PiStorefront } from "react-icons/pi";
import { RiScissorsLine } from "react-icons/ri";
import { HiMiniSparkles } from "react-icons/hi2";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { designSystem } from "@/content/design-system";

const iconMap: Record<string, IconType> = {
  LuPhone,
  LuMapPin,
  TbChefHat,
  PiStorefront,
  RiScissorsLine,
  HiMiniSparkles,
  FaWhatsapp,
  FaInstagram,
};

export function IconsSection() {
  const { icons } = designSystem;

  return (
    <Section>
      <Container>
        <SectionHeading title={icons.title} description={icons.description} />
        <div className="mt-8 space-y-10">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Ukuran
            </h3>
            <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
              {icons.sizes.map((item) => (
                <li key={item.size} className="flex items-center gap-3">
                  <LuCheck className={item.size} aria-hidden />
                  <div>
                    <p className="font-mono text-xs font-medium">{item.size}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.usage}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Paket dan contoh
            </h3>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {icons.items.map((item) => {
                const Icon = iconMap[item.name];
                return (
                  <li
                    key={item.name}
                    className="rounded-lg border border-border p-4"
                  >
                    <Icon className="size-6" aria-hidden />
                    <p className="mt-3 font-mono text-xs text-muted-foreground">
                      {item.pack}
                    </p>
                    <p className="font-mono text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.usage}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
