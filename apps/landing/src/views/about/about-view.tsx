import { Container } from "../../components/container.tsx";
import { Reveal } from "../../components/reveal.tsx";
import { SectionHead } from "../../components/section-head.tsx";

export function AboutView() {
  return (
    <main className="min-h-svh bg-background py-24 text-foreground">
      <Container>
        <SectionHead
          num="02 — Placeholder"
          title="A second page"
          lead="Its only job is to prove the multi-route prerender path works: npm run build writes this out as about.html, and Firebase Hosting serves it at /about via cleanUrls."
        />
        <Reveal className="mt-12 text-center">
          <a className="text-brand-2 underline underline-offset-4" href="/">
            ← Back home
          </a>
        </Reveal>
      </Container>
    </main>
  );
}
