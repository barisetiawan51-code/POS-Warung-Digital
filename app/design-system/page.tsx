import type { Metadata } from "next";
import { DesignSystemHero } from "@/components/pages/design-system/hero";
import { ColorsSection } from "@/components/pages/design-system/colors-section";
import { ThemeSection } from "@/components/pages/design-system/theme-section";
import { TypographySection } from "@/components/pages/design-system/typography-section";
import { RadiusSection } from "@/components/pages/design-system/radius-section";
import { LayoutSection } from "@/components/pages/design-system/layout-section";
import { ButtonsSection } from "@/components/pages/design-system/buttons-section";
import { BadgesSection } from "@/components/pages/design-system/badges-section";
import { FormsSection } from "@/components/pages/design-system/forms-section";
import { CardsSection } from "@/components/pages/design-system/cards-section";
import { IconsSection } from "@/components/pages/design-system/icons-section";
import { MotionSection } from "@/components/pages/design-system/motion-section";

export const metadata: Metadata = {
  title: "Design System",
  description: "Referensi token dan komponen inti proyek.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesignSystemPage() {
  return (
    <>
      <DesignSystemHero />
      <ColorsSection />
      <ThemeSection />
      <TypographySection />
      <RadiusSection />
      <LayoutSection />
      <ButtonsSection />
      <BadgesSection />
      <FormsSection />
      <CardsSection />
      <IconsSection />
      <MotionSection />
    </>
  );
}
