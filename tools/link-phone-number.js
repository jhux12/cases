#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function printUsage() {
  console.log(`Usage: node tools/link-phone-number.js \
  --service-account <path/to/serviceAccount.json> \
  --database-url https://your-project-default-rtdb.firebaseio.com \
  (--uid <firebase-uid> | --email <user@example.com>) \
  --phone +15551234567`);
  console.log('\nThe script links an existing Firebase Auth user to a phone number and marks the profile verified.');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printUsage();
    process.exit(0);
  }

  const serviceAccountPath = args['service-account'];
  const databaseURL = args['database-url'];
  const uid = args.uid;
  const email = args.email;
  const phone = args.phone;

  if (!serviceAccountPath || !databaseURL || !phone || (!uid && !email)) {
    console.error('Missing required arguments.');
    printUsage();
    process.exit(1);
  }

  const phonePattern = /^\+[1-9]\d{6,14}$/;
  if (!phonePattern.test(phone)) {
    console.error('Phone numbers must be provided in E.164 format, e.g. +15551234567.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Service account file not found at ${resolvedPath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL
  });

  let userRecord;
  try {
    if (uid) {
      userRecord = await admin.auth().getUser(uid);
    } else {
      userRecord = await admin.auth().getUserByEmail(email);
    }
  } catch (err) {
    console.error('Failed to locate user:', err.message);
    process.exit(1);
  }

  const targetUid = userRecord.uid;
  const display = userRecord.email || userRecord.uid;
  console.log(`Linking phone ${phone} to user ${display} (${targetUid})...`);

  try {
    await admin.auth().updateUser(targetUid, { phoneNumber: phone });
    console.log('✔ Firebase Auth phone number updated.');
  } catch (err) {
    console.error('Failed to update Firebase Auth user:', err.message);
    process.exit(1);
  }

  try {
    await admin.database().ref(`users/${targetUid}`).update({
      phoneNumber: phone,
      phoneVerified: true
    });
    console.log('✔ Realtime Database profile updated.');
  } catch (err) {
    console.error('Failed to update Realtime Database profile:', err.message);
    process.exit(1);
  }

  console.log('Done. The user can now log in with the linked phone number.');
  process.exit(0);
})();
