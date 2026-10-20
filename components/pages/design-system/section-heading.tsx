export type SectionHeadingProps = {
  title: string;
  description: string;
};

export function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <header className="max-w-2xl">
      <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
    </header>
  );
}
