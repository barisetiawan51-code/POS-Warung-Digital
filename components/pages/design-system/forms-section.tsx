"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/layouts/section";
import { SectionHeading } from "@/components/pages/design-system/section-heading";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Textarea } from "@/components/ui/textarea";
import { designSystem } from "@/content/design-system";

export function FormsSection() {
  const { forms } = designSystem;
  const [service, setService] = useState(forms.service.options[0]);

  return (
    <Section>
      <Container>
        <SectionHeading title={forms.title} description={forms.description} />
        <Card className="mt-8 max-w-xl">
          <div className="space-y-6">
            <Field
              id="demo-name"
              label={forms.name.label}
              hint={forms.name.hint}
            >
              <Input
                id="demo-name"
                name="name"
                placeholder={forms.name.placeholder}
              />
            </Field>
            <Field
              id="demo-email"
              label={forms.email.label}
              error={forms.email.error}
            >
              <Input
                id="demo-email"
                name="email"
                type="email"
                placeholder={forms.email.placeholder}
              />
            </Field>
            <Field id="demo-service" label={forms.service.label}>
              <CustomSelect
                id="demo-service"
                value={service}
                onChange={setService}
                options={forms.service.options.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </Field>
            <Field id="demo-message" label={forms.message.label}>
              <Textarea
                id="demo-message"
                name="message"
                placeholder={forms.message.placeholder}
                rows={4}
              />
            </Field>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
