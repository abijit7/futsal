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
      ['public mixed-status slot endpoint exists', /\/slots\/public/],
      ['admin slot generation endpoint exists', /\/slots\/generate/]
    ]
  },
  {
    file: 'src/utils/date.js',
    patterns: [
      ['local date input helper exists', /getFullYear\(\)/]
    ]
  },
  {
    file: 'src/pages/Slots.jsx',
    patterns: [
      ['booking page loads mixed available and booked slots', /SlotAPI\.getPublic/],
      ['booked slots are disabled in the UI', /disabled=\{isBooked\}/],
      ['booking page avoids UTC date conversion', /toDateInputValue\(\)/]
    ]
  },
  {
    file: 'src/pages/Futsals.jsx',
    patterns: [
      ['custom sort dropdown trigger exists', /sort-trigger/],
      ['custom sort menu exists', /sort-menu/],
      ['venue search is sent to backend', /q: search/],
      ['venue sort is sent to backend', /sort: sortBy/],
      ['venue cards use backend rating field', /f\.rating/],
      ['venue cards use backend court type field', /f\.courtType/]
    ]
  },
  {
    file: 'src/pages/MyBookings.jsx',
    patterns: [
      ['booking status filter is sent to backend', /status: filter === 'ALL' \? undefined : filter/],
      ['booking page renders backend page items directly', /bookings\.map/]
    ]
  },
  {
    file: 'src/pages/admin/AdminUsers.jsx',
    patterns: [
      ['admin user search is sent to backend', /q: query/],
      ['admin users table renders backend page items directly', /users\.map/]
    ]
  },
  {
    file: 'src/pages/admin/AdminFutsals.jsx',
    patterns: [
      ['admin venue form submits real verified field', /verified: form\.verified/],
      ['admin venue form submits real court type field', /courtType: form\.courtType/],
      ['admin venue form submits real rating field', /rating: form\.rating/]
    ]
  },
  {
    file: 'src/pages/admin/AdminDashboard.jsx',
    patterns: [
      ['admin dashboard uses React Router links', /<Link to="\/admin\/futsals"/]
    ]
  },
  {
    file: 'src/pages/Dashboard.jsx',
    patterns: [
      ['user dashboard uses React Router links', /<Link to="\/slots"/]
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
