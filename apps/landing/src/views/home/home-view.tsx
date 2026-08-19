import { Container } from "../../components/container.tsx";
import { Reveal } from "../../components/reveal.tsx";
import { SectionHead } from "../../components/section-head.tsx";

export function HomeView() {
  return (
    <main className="min-h-svh bg-background py-24 text-foreground">
      <Container>
        <SectionHead
          num="01 — Placeholder"
          title="Your marketing site starts here"
          lead="This page is prerendered to static HTML at build time. Edit src/views/home/home-view.tsx, and declare new pages in src/routes.ts."
        />
        <Reveal className="mt-12 text-center">
          <a
            className="text-brand-2 underline underline-offset-4"
            href="/about"
          >
            Go to the second prerendered page →
          </a>
        </Reveal>
      </Container>
    </main>
  );
}
