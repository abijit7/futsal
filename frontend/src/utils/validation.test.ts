import { describe, expect, it } from 'vitest';
import { validateEmail, validatePassword } from './validation';

describe('validateEmail', () => {
  /** The whole point of the rule: real providers and real organisations must keep working. */
  it.each([
    'player@gmail.com',
    'PLAYER@Gmail.com',
    'sales@outlook.com',
    'a.b+tag@icloud.com',
    'booking@daraz.com.np',
    'student@student.ku.edu.np',
    'ops@merofutsal.io'
  ])('accepts %s', (email) => {
    expect(validateEmail(email)).toBeUndefined();
  });

  it.each([
    ['a@example.com', /reserved test domain/],
    ['a@sub.example.com', /reserved test domain/],
    ['a@example.org', /reserved test domain/],
    ['a@futsal.test', /reserved test domain/],
    ['a@box.invalid', /reserved test domain/],
    ['a@merofutsal.local', /reserved test domain/]
  ])('rejects the unreachable domain in %s', (email, message) => {
    expect(validateEmail(email)).toMatch(message);
  });

  it.each(['a@mailinator.com', 'a@inbox.mailinator.com', 'a@yopmail.com', 'a@10minutemail.com'])(
    'rejects the disposable address %s',
    (email) => {
      expect(validateEmail(email)).toMatch(/Disposable email/);
    }
  );

  it.each(['', 'player', 'player@gmail', 'player@@gmail.com', 'player@gmail..com', '.player@gmail.com'])(
    'rejects the malformed address %s',
    (email) => {
      expect(validateEmail(email)).toBeDefined();
    }
  );
});

describe('validatePassword', () => {
  it.each(['Futsal7Kathmandu', 'gh4-Rana-tuki', 'pitch9side9run'])('accepts %s', (password) => {
    expect(validatePassword(password)).toBeUndefined();
  });

  /** The case that prompted this: eight characters was the only bar, and a counting sequence cleared it. */
  it.each(['12345678', '87654321', 'abcdefgh', 'aaaaaaaa'])('rejects the sequence %s', (password) => {
    expect(validatePassword(password)).toMatch(/sequence/);
  });

  it.each(['password', 'Password1', 'password2024', 'qwerty123', 'iloveyou', 'futsal123'])(
    'rejects the common password %s',
    (password) => {
      expect(validatePassword(password)).toMatch(/too common/);
    }
  );

  it('rejects a password missing letters or digits', () => {
    expect(validatePassword('!@#$%^&*()')).toMatch(/one letter and one number/);
    expect(validatePassword('greenpitchside')).toMatch(/one letter and one number/);
  });

  it('rejects a password built from the name or the email', () => {
    expect(validatePassword('Shrestha99', { name: 'Bibek Shrestha' })).toMatch(/your name or email/);
    expect(validatePassword('99bibek99', { email: 'bibek@gmail.com' })).toMatch(/your name or email/);
  });

  it('enforces the 8-72 range BCrypt and the server agree on', () => {
    expect(validatePassword('Ab3xk9')).toMatch(/at least 8/);
    expect(validatePassword(`${'Ab3xk9pq'.repeat(10)}`)).toMatch(/72 characters or fewer/);
  });
});
