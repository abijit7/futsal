import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '../../components/LegalPage';
import { BRAND_NAME } from '../../constants/brand';

/**
 * Terms of use.
 *
 * <p>Written to describe what this software actually does, clause by clause, rather than to read
 * like a generic template: the confirmation flow, the auto-approval lead time, the cancellation
 * cutoff and the refund route are all real behaviour in BookingService, RefundService and the
 * payment gateway. A term nobody can point at in the running system is worse than no term.
 *
 * <p>NOTE FOR MAINTAINERS: this has not been reviewed by a lawyer. Treat it as a plain-language
 * description of the service, and get it checked before relying on it.
 */
export function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      updated="13 September 2026"
      intro={`${BRAND_NAME} connects players with futsal venues in Nepal. These terms describe how booking, payment and cancellation work here. Using the site means you accept them.`}
    >
      <LegalSection heading="What we do, and what we don't">
        <p>
          We list courts and take bookings for them. The courts themselves are run by the venues,
          not by us. The venue sets its own hours and its own hourly price, and is responsible for
          the condition of the pitch and for honouring a booking it has accepted.
        </p>
      </LegalSection>

      <LegalSection heading="When a booking is confirmed">
        <p>
          A new booking is held as pending, not confirmed. What happens next depends on how you pay.
        </p>
        <p>
          Paid through eSewa, it is confirmed as soon as the gateway reports the payment as
          complete. Paying cash at the venue, it stays pending until the venue accepts or declines
          it — and if nobody answers, it is accepted automatically shortly before kickoff, so you
          always know where you stand before you travel.
        </p>
        <p>
          A booking that is still undecided once its slot has passed lapses, and the slot is
          released. Nobody can accept a game that has already not happened.
        </p>
      </LegalSection>

      <LegalSection heading="Prices">
        <p>
          The price of a slot is worked out from the venue's hourly rate and the length of the slot,
          and is always calculated by us rather than sent from your browser. All prices are in
          Nepalese rupees.
        </p>
      </LegalSection>

      <LegalSection heading="Cancelling">
        <p>
          You can cancel your own booking up to 24 hours before it starts. After that the slot is
          close enough to kickoff that the venue is unlikely to fill it again, so it stays booked.
        </p>
        <p>
          A venue can cancel at any time — a flooded pitch or a power cut does not keep to a
          schedule. If that happens to a booking you have paid for, you are owed a refund.
        </p>
      </LegalSection>

      <LegalSection heading="Refunds">
        <p>
          When a paid booking is cancelled, declined or lapses, we record that a refund is owed and
          it is paid back to you by the operator. eSewa offers merchants no way to return a payment
          automatically, so this step involves a person and is not instant.
        </p>
      </LegalSection>

      <LegalSection heading="Reviews">
        <p>
          You can review a venue once you have actually played there — a booking that was accepted
          and whose slot has passed. One review per booking, so a venue you visit often can be
          reviewed each time.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          Register with details that are yours and keep them current, since a venue may need to
          reach you about a booking. You are responsible for what happens through your account, so
          keep your password to yourself. We may suspend an account being used to make bookings in
          bad faith.
        </p>
      </LegalSection>

      <LegalSection heading="Your data">
        <p>
          What we store and why is set out in our <Link className="font-bold text-green-700 hover:text-green-800" to="/privacy">privacy notice</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
