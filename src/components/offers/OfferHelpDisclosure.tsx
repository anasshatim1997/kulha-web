import type { PublicOfferCopy } from "@/lib/offers/public-copy";

export function OfferHelpDisclosure({ copy }: { copy: PublicOfferCopy }) {
  return (
    <details className="rescue-help-disclosure rescue-help-floating" data-offers-floating-help="true">
      <summary aria-label={copy.helpButton}>
        <span className="rescue-help-icon" aria-hidden="true">?</span>
        <span>{copy.helpButton}</span>
        <span className="rescue-help-chevron" aria-hidden="true">↗</span>
      </summary>
      <section className="rescue-help-panel" aria-label={copy.guideHelperLabel}>
        <div className="rescue-help-panel-heading">
          <span className="rescue-help-mark" aria-hidden="true">✳</span>
          <div>
            <p>{copy.guideHelperLabel}</p>
            <h2>{copy.guideHelperTitle}</h2>
          </div>
        </div>
        <ol>
          {copy.guideSteps.map(([title, description], index) => (
            <li key={title}>
              <span className="rescue-help-step-number">0{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rescue-help-note">
          <strong>{copy.bookingNoteTitle}</strong>
          <p>{copy.bookingNoteBody}</p>
        </div>
      </section>
    </details>
  );
}
