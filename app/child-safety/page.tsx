import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Child safety standards | ɃU',
  description:
    'ɃU standards regarding child sexual abuse and exploitation (CSAE), reporting, and enforcement.',
}

const canonicalStandardsUrl = process.env.NEXT_PUBLIC_CHILD_SAFETY_STANDARDS_URL?.trim()

export default function ChildSafetyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Child safety standards
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: May 12, 2026
        </p>

        {canonicalStandardsUrl ? (
          <p className="mt-8 text-sm leading-relaxed">
            <a
              href={canonicalStandardsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-4 hover:no-underline"
            >
              Read our full Child Safety Standards
            </a>{' '}
            (opens in a new tab).
          </p>
        ) : null}

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p className="text-foreground">
            ɃU (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;the service&rdquo;) is committed to protecting
            children and combating child sexual abuse and exploitation (CSAE). This page summarizes our
            standards for how the service is operated and how safety issues are handled.
          </p>

          <div>
            <h2 className="text-base font-semibold text-foreground">Zero tolerance</h2>
            <p className="mt-2">
              We prohibit any content, conduct, or use of the service that facilitates, depicts, promotes,
              or solicits child sexual abuse or exploitation. There is no tolerance for CSAE-related
              material or behavior on our platform.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">Prohibited use</h2>
            <p className="mt-2">Users must not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Share, request, store, or distribute CSAE-related content in any form.</li>
              <li>Use the service to groom, coerce, or endanger minors.</li>
              <li>Circumvent enforcement, reporting, or legal obligations related to child safety.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">Detection, reporting, and removal</h2>
            <p className="mt-2">
              We take reports seriously. When we become aware of content or activity that may violate these
              standards or applicable law, we may remove content, restrict or terminate accounts, preserve
              records as required, and cooperate with law enforcement and competent authorities where
              permitted by law.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">How to report concerns</h2>
            <p className="mt-2">
              If you become aware of CSAE-related concerns involving our service, report them through the
              in-app support or help options, or through the official contact channels listed in our app
              store listing.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">Age and audience</h2>
            <p className="mt-2">
              Our services are intended for adults who can lawfully enter into agreements and use payment
              features. We do not design the service for children to use independently. Parents and
              guardians are responsible for supervising minors&rsquo; device and account use where
              applicable.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground">Updates</h2>
            <p className="mt-2">
              We may update these standards to reflect changes in law, industry practice, or product risk.
              The &ldquo;Last updated&rdquo; date at the top of this page will be revised when material
              changes are made.
            </p>
          </div>
        </section>

        <p className="mt-12 text-xs text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Back to ɃU
          </Link>
        </p>
      </div>
    </main>
  )
}
