// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verify-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverSeed = document.getElementById('verify-server-seed').value.trim();
    const clientSeed = document.getElementById('verify-client-seed').value.trim();
    const nonce = document.getElementById('verify-nonce').value.trim();
    if (!serverSeed || !clientSeed || nonce === '') return;
    const data = new TextEncoder().encode(`${serverSeed}:${clientSeed}:${nonce}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
    const rand = parseInt(hashHex.substring(0, 8), 16) / 0xffffffff;
    document.getElementById('verify-hash').textContent = hashHex;
    document.getElementById('verify-output').textContent = rand;
    let outcome;
    if (rand < 0.5) outcome = 'Common';
    else if (rand < 0.8) outcome = 'Rare';
    else if (rand < 0.95) outcome = 'Ultra Rare';
    else outcome = 'Legendary';
    document.getElementById('verify-outcome').textContent = `Example outcome: ${outcome}`;
    document.getElementById('verify-result').classList.remove('hidden');
  });
});
