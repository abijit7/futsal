import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '../../components/LegalPage';
import { BRAND_NAME } from '../../constants/brand';

/**
 * Privacy notice.
 *
 * <p>Describes what the running system genuinely stores and does - the BCrypt password hash, the
 * expiring single-use verification codes, the token whose version is bumped on a password change,
 * and the fact that eSewa handles the payment so no card details ever reach this application.
 *
 * <p>NOTE FOR MAINTAINERS: not reviewed by a lawyer, and the contact route below is still missing.
 * See the TODO in "Asking about your data" - that has to be filled before this page is relied on.
 */
export function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      updated="13 September 2026"
      intro={`What ${BRAND_NAME} stores about you, why it is stored, and what you can do about it. In short: enough to run your bookings, and nothing we do not need.`}
    >
      <LegalSection heading="What we store">
        <p>
          Your name, email address and phone number, because a venue needs to know who is coming and
          how to reach you. Your password is never stored as you typed it — only a BCrypt hash of
          it, which cannot be read back.
        </p>
        <p>
          Alongside that: the bookings you make, the reviews you write, and whether your email and
          phone have been verified.
        </p>
      </LegalSection>

      <LegalSection heading="Verification codes">
        <p>
          Confirming your email or phone, or resetting a password, sends a six-digit code to that
          address or number. Codes are single use, expire shortly after they are sent, and allow
          only a few attempts before they stop working.
        </p>
      </LegalSection>

      <LegalSection heading="Payments">
        <p>
          Card and wallet details are handled entirely by eSewa and never reach us. What we keep is
          the reference for your transaction, the amount and its status, which is what lets us tell
          whether a booking is paid and whether a refund is owed.
        </p>
      </LegalSection>

      <LegalSection heading="Staying signed in">
        <p>
          Signing in puts a signed token in your browser. It carries your account id and role, and
          it expires. Changing your password invalidates every token issued before the change, so
          signing in again on one device signs out anywhere your old password was still being used.
        </p>
      </LegalSection>

      <LegalSection heading="Who else sees it">
        <p>
          A venue sees what it needs to honour your booking: your name, your contact details and the
          slot you booked. We do not sell your details, and we do not send marketing you did not ask
          for.
        </p>
      </LegalSection>

      <LegalSection heading="Changing or removing your data">
        <p>
          You can edit your name and phone number from your <Link className="font-bold text-green-700 hover:text-green-800" to="/profile">profile</Link> at
          any time. An account with no booking history can be deleted outright; where there are
          bookings, the record has to be kept, since it is also the venue's record of a game that
          was played and paid for.
        </p>
      </LegalSection>

      <LegalSection heading="Asking about your data">
        {/* TODO: contact route for data requests. This page should not be linked publicly until
            there is a real address or form here - a privacy notice with no way to reach anyone is
            the one section that cannot be left unfinished. */}
        <p>
          A route for data questions is being set up and will be published here.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
