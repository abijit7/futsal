/**
 * One place for the rules that decide whether an account is real enough to create.
 *
 * These mirror the Spring constraints on `UserRegisterRequest` and the checks in
 * `UserService.register` field for field, message for message, so the inline error a visitor
 * reads while typing is the same sentence the server would have sent back. The server is what
 * actually enforces them - this module exists so nobody has to submit a form to find out.
 */

export const NAME_PATTERN = /^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$/;
export const PHONE_PATTERN = /^(98|97|96)\d{8}$/;

export const PASSWORD_MIN = 8;
/** BCrypt ignores input past 72 bytes, so anything longer is silently truncated. */
export const PASSWORD_MAX = 72;

const EMAIL_SHAPE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/**
 * RFC 2606 / RFC 6761 names that are reserved precisely so they can never resolve. Registration
 * promises a verification email, and mail to these is guaranteed to go nowhere.
 */
const RESERVED_EMAIL_DOMAINS = ['example.com', 'example.net', 'example.org'];
const RESERVED_EMAIL_TLDS = ['test', 'example', 'invalid', 'localhost', 'local'];

const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  'discard.email',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mohmal.com',
  'moakt.com',
  'sharklasers.com',
  'spam4.me',
  'spamgourmet.com',
  'temp-mail.org',
  'tempmail.com',
  'tempmailo.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
  'yopmail.net'
];

/**
 * Base words behind the passwords that top every breach list, plus the ones this product invites
 * by name. Compared against the password lowercased and again with trailing digits stripped, so
 * one entry covers `password`, `Password1` and `password2024`.
 */
const COMMON_PASSWORDS = new Set([
  'abc',
  'abcd',
  'abcdef',
  'admin',
  'administrator',
  'asdfgh',
  'baseball',
  'batman',
  'changeme',
  'computer',
  'cricket',
  'dragon',
  'facebook',
  'football',
  'freedom',
  'futsal',
  'google',
  'hello',
  'helloworld',
  'iloveyou',
  'internet',
  'jordan',
  'kathmandu',
  'letmein',
  'login',
  'master',
  'merofutsal',
  'michael',
  'monkey',
  'nepal',
  'passw0rd',
  'password',
  'princess',
  'qwerty',
  'qwertyuiop',
  'samsung',
  'secret',
  'shadow',
  'sunshine',
  'superman',
  'test',
  'testing',
  'trustno',
  'welcome',
  'whatever',
  'zxcvbn'
]);

export type PasswordContext = { name?: string; email?: string };

function domainOf(email: string): string {
  return email.slice(email.lastIndexOf('@') + 1).toLowerCase();
}

/** True when `domain` is the listed name itself or a subdomain of it. */
function matchesDomain(domain: string, list: string[]): boolean {
  return list.some((entry) => domain === entry || domain.endsWith(`.${entry}`));
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return 'Email address is required.';
  if (email.length > 254) return 'Email address is too long.';

  const local = email.slice(0, email.lastIndexOf('@'));
  if (!EMAIL_SHAPE.test(email) || email.includes('..') || local.startsWith('.') || local.endsWith('.')) {
    return 'Enter a valid email address, like you@gmail.com.';
  }

  const domain = domainOf(email);
  const tld = domain.slice(domain.lastIndexOf('.') + 1);
  if (matchesDomain(domain, RESERVED_EMAIL_DOMAINS) || RESERVED_EMAIL_TLDS.includes(tld)) {
    return `${domain} is a reserved test domain. Use an address you can actually receive mail at.`;
  }
  if (matchesDomain(domain, DISPOSABLE_EMAIL_DOMAINS)) {
    return "Disposable email addresses aren't accepted - you'll need this address to verify the account.";
  }
  return undefined;
}

/**
 * Catches the whole-string runs a blocklist would never keep up with: `12345678`, `87654321`,
 * `abcdefgh`, `aaaaaaaa`.
 */
function isRun(value: string): boolean {
  if (value.length < 3) return false;
  let ascending = true;
  let descending = true;
  let repeated = true;
  for (let i = 1; i < value.length; i += 1) {
    const step = value.charCodeAt(i) - value.charCodeAt(i - 1);
    if (step !== 1) ascending = false;
    if (step !== -1) descending = false;
    if (step !== 0) repeated = false;
  }
  return ascending || descending || repeated;
}

function isCommon(password: string): boolean {
  const lowered = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowered)) return true;
  const withoutTrailingDigits = lowered.replace(/\d+$/, '');
  return withoutTrailingDigits.length >= 3 && COMMON_PASSWORDS.has(withoutTrailingDigits);
}

/** Name words and the email local part, long enough that finding them in a password is telling. */
function personalTokens({ name, email }: PasswordContext): string[] {
  const tokens = (name ?? '').trim().toLowerCase().split(/\s+/);
  const local = (email ?? '').trim().toLowerCase().split('@')[0] ?? '';
  return [...tokens, local].filter((token) => token.length >= 4);
}

function reusesPersonalDetails(password: string, context: PasswordContext): boolean {
  const lowered = password.toLowerCase();
  return personalTokens(context).some((token) => lowered.includes(token));
}

export function validatePassword(value: string, context: PasswordContext = {}): string | undefined {
  if (!value) return 'Password is required.';
  if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (value.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`;
  if (isRun(value)) return "That's a sequence, not a password. Mix it up.";
  if (isCommon(value)) return 'That password is too common. Pick something harder to guess.';
  if (reusesPersonalDetails(value, context)) return "Don't use your name or email address in your password.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Use at least one letter and one number.';
  return undefined;
}

/**
 * The same rules as `validatePassword`, but as a checklist. Both read the same predicates so the
 * green ticks can never disagree with what the submit button allows.
 */
export function passwordRequirements(value: string, context: PasswordContext = {}) {
  const items = [
    { label: `At least ${PASSWORD_MIN} characters`, met: value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX },
    { label: 'Letters and numbers', met: /[A-Za-z]/.test(value) && /\d/.test(value) },
    { label: 'Not a common or sequential password', met: value.length > 0 && !isRun(value) && !isCommon(value) }
  ];
  if (personalTokens(context).length > 0) {
    items.push({ label: 'Not your name or email', met: value.length > 0 && !reusesPersonalDetails(value, context) });
  }
  return items;
}

export function validateName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return 'Full name is required.';
  if (name.length < 5 || name.length > 50 || !NAME_PATTERN.test(name)) {
    return 'Use first and last name, letters only, 5-50 characters.';
  }
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  const phone = value.trim();
  if (!phone) return 'Phone number is required.';
  if (!PHONE_PATTERN.test(phone)) return 'Enter a valid 10-digit phone number starting with 98, 97, or 96.';
  return undefined;
}
