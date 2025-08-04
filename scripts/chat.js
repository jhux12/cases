const db = firebase.firestore();
const auth = firebase.auth();

const messagesEl = document.getElementById('chat-messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const toggleBtn = document.getElementById('chat-toggle');
const widget = document.getElementById('chat-widget');
const closeBtn = document.getElementById('chat-close');

if (toggleBtn && widget) {
  toggleBtn.addEventListener('click', () => {
    widget.classList.remove('hidden');
    toggleBtn.classList.add('hidden');
  });
}

if (closeBtn && widget) {
  closeBtn.addEventListener('click', () => {
    widget.classList.add('hidden');
    toggleBtn.classList.remove('hidden');
  });
}

function addMessage(data) {
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message';

  const author = document.createElement('span');
  author.className = 'author';
  author.textContent = data.username || 'Anon';

  const text = document.createElement('span');
  text.textContent = data.message;

  wrapper.appendChild(author);
  wrapper.appendChild(text);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

if (messagesEl) {
  db.collection('chat')
    .orderBy('timestamp')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          addMessage(change.doc.data());
        }
      });
    });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const message = input.value.trim();
    if (!message) return;
    await db.collection('chat').add({
      uid: user.uid,
      username: user.displayName || user.email || 'User',
      message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = '';
  });
}
