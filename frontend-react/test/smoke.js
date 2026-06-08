import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'index.html',
  'src/main.jsx',
  'src/App.jsx',
  'src/styles.css'
];

const missing = requiredFiles.filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length > 0) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}

const sourceChecks = [
  {
    file: 'src/api/client.js',
    patterns: [
      ['default API base uses backend port 9090', /localhost:9090/],
      ['auth failures clear local auth state', /Auth\.logout\(\)/]
    ]
  },
  {
    file: 'src/api/slot.js',
    patterns: [
      ['public mixed-status slot endpoint exists', /\/slots\/public/]
    ]
  },
  {
    file: 'src/pages/Slots.jsx',
    patterns: [
      ['booking page loads mixed available and booked slots', /SlotAPI\.getPublic/],
      ['booked slots are disabled in the UI', /disabled=\{isBooked\}/]
    ]
  },
  {
    file: 'src/pages/Futsals.jsx',
    patterns: [
      ['custom sort dropdown trigger exists', /sort-trigger/],
      ['custom sort menu exists', /sort-menu/]
    ]
  },
  {
    file: 'src/pages/Login.jsx',
    patterns: [
      ['login navigation uses normalized backend role', /navigate\(role === 'ADMIN' \? '\/admin' : '\/dashboard'\)/]
    ]
  },
  {
    file: 'src/utils/auth.js',
    patterns: [
      ['auth checks token expiry', /payload\.exp/],
      ['admin role falls back to saved user role', /this\.tokenRole\(user\) \|\| user\?\.role/]
    ]
  }
];

const failures = [];
sourceChecks.forEach(({ file, patterns }) => {
  const content = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  patterns.forEach(([label, pattern]) => {
    if (!pattern.test(content)) {
      failures.push(`${file}: ${label}`);
    }
  });
});

if (failures.length > 0) {
  console.error('Smoke test failed:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Smoke test passed.');
