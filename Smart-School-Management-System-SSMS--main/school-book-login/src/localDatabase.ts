// --- FIRESTORE MOCK REDIRECTED TO EXPRESS + POSTGRESQL BACKEND ---

export const db = { type: 'mock_db' };

export const collection = (dbInstance: any, path: string) => ({ type: 'collection', path });

export const doc = (dbOrCol: any, pathOrId: string, id?: string) => {
  if (id) return { type: 'doc', path: `${pathOrId}/${id}` };
  if (dbOrCol.type === 'collection') return { type: 'doc', path: `${dbOrCol.path}/${pathOrId}` };
  return { type: 'doc', path: pathOrId };
};

export const query = (col: any, ...conditions: any[]) => ({ ...col, conditions });
export const where = (field: string, op: string, value: any) => ({ field, op, value });

// Fetch helper to query collection/document data from the database
async function fetchSnapshotData(ref: any) {
  const parts = ref.path.split('/');
  const colName = parts[0];
  const token = localStorage.getItem('ssms_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (parts.length % 2 === 0) {
    // Document Reference
    const docId = parts[1];
    const response = await fetch(`http://localhost:4000/api/collections/${colName}`, { headers });
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    const items = await response.json();
    const docData = items.find((item: any) => {
      const itemId = item.id || item.user_id || item.student_id || item.teacher_id || item.parent_id || item.staff_id;
      return String(itemId) === String(docId);
    });
    return {
      exists: () => !!docData,
      data: () => docData,
      id: docId
    };
  } else {
    // Collection Reference
    const response = await fetch(`http://localhost:4000/api/collections/${colName}`, { headers });
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    let items = await response.json();

    if (ref.conditions) {
      for (const cond of ref.conditions) {
        if (cond.op === '==') {
          items = items.filter((d: any) => {
            if (cond.value === '___none___') return false;
            // Support field maps e.g. student_id / email / parent_id
            return d[cond.field] === cond.value;
          });
        }
      }
    }

    return {
      docs: items.map((item: any) => {
        const id = item.id || item.user_id || item.student_id || item.teacher_id || item.parent_id || item.staff_id || '';
        return {
          id: String(id),
          data: () => item,
          exists: () => true
        };
      })
    };
  }
}

// Polling manager for real-time data synchronization
interface ActiveListener {
  id: number;
  ref: any;
  callback: (snapshot: any) => void;
  errorCb?: (error: any) => void;
}

const activeListeners = new Map<number, ActiveListener>();
let listenerIdCount = 0;

setInterval(async () => {
  for (const listener of activeListeners.values()) {
    try {
      const snap = await fetchSnapshotData(listener.ref);
      listener.callback(snap);
    } catch (e) {
      if (listener.errorCb) listener.errorCb(e);
    }
  }
}, 1500);

export const onSnapshot = (ref: any, callback: any, errorCb?: any) => {
  const id = ++listenerIdCount;
  const listener: ActiveListener = { id, ref, callback, errorCb };
  activeListeners.set(id, listener);

  // Trigger initial fetch asynchronously
  fetchSnapshotData(ref)
    .then(callback)
    .catch(errorCb);

  return () => {
    activeListeners.delete(id);
  };
};

export const getDoc = async (ref: any) => fetchSnapshotData(ref);
export const getDocs = async (ref: any) => fetchSnapshotData(ref);
export const getDocFromServer = getDoc;
export const serverTimestamp = () => new Date().toISOString();

export const setDoc = async (ref: any, data: any) => {
  const [col, id] = ref.path.split('/');
  const token = localStorage.getItem('ssms_auth_token');
  const response = await fetch(`http://localhost:4000/api/collections/${col}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('setDoc failed');
};

export const updateDoc = async (ref: any, data: any) => {
  const [col, id] = ref.path.split('/');
  const token = localStorage.getItem('ssms_auth_token');
  const response = await fetch(`http://localhost:4000/api/collections/${col}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('updateDoc failed');
};

export const deleteDoc = async (ref: any) => {
  const [col, id] = ref.path.split('/');
  const token = localStorage.getItem('ssms_auth_token');
  const response = await fetch(`http://localhost:4000/api/collections/${col}/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) throw new Error('deleteDoc failed');
};

export const addDoc = async (ref: any, data: any) => {
  const col = ref.path;
  const token = localStorage.getItem('ssms_auth_token');
  const response = await fetch(`http://localhost:4000/api/collections/${col}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('addDoc failed');
  const result = await response.json();
  return { id: result.id, path: `${col}/${result.id}` };
};

// --- AUTH MOCK REDIRECTED ---
export const auth = { currentUser: null as any, providerData: [] as any[] };

let authListeners: any[] = [];
const notifyAuth = () => authListeners.forEach(cb => cb(auth.currentUser));

export const onAuthStateChanged = (authInstance: any, cb: any) => {
  authListeners.push(cb);
  
  // Asynchronously restore session from API token
  const restoreSession = async () => {
    const token = localStorage.getItem('ssms_auth_token');
    if (token) {
      try {
        const res = await fetch('http://localhost:4000/api/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const user = {
            uid: String(data.user.id),
            email: data.user.email,
            emailVerified: true,
            providerData: [{ providerId: 'password', email: data.user.email }]
          };
          auth.currentUser = user;
          cb(auth.currentUser);
          return;
        }
      } catch (e) {
        console.error("Session restoration failed:", e);
      }
    }
    cb(null);
  };

  restoreSession();
  return () => {
    authListeners = authListeners.filter(l => l !== cb);
  };
};

export const createUserWithEmailAndPassword = async (authInst: any, email: string, pass: string) => {
  const response = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, role: 'Student' })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw { code: 'auth/email-already-in-use', message: err.message || 'Registration failed' };
  }
  // Log in immediately after registration
  return signInWithEmailAndPassword(authInst, email, pass);
};

export const signInWithEmailAndPassword = async (authInst: any, email: string, pass: string) => {
  const response = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw { code: 'auth/invalid-credential', message: err.message || 'Invalid credentials' };
  }
  const data = await response.json();
  localStorage.setItem('ssms_auth_token', data.accessToken);
  const user = {
    uid: String(data.user.id),
    email: data.user.email,
    emailVerified: true,
    providerData: [{ providerId: 'password', email: data.user.email }]
  };
  auth.currentUser = user;
  notifyAuth();
  return { user };
};

export const signOut = async (authInst?: any) => {
  localStorage.removeItem('ssms_auth_token');
  auth.currentUser = null;
  notifyAuth();
};

export const updateProfile = async (user: any, data: any) => {
  // Mock success, local profile state is driven by database collection updates anyway
};

export const sendEmailVerification = async (user?: any) => {};
export const sendPasswordResetEmail = async (authInst?: any, email?: string) => {};
export const signInWithPopup = async () => ({ user: { uid: 'popup123', email: 'popup@test.com', emailVerified: true, providerData: [] } });
export class GoogleAuthProvider {}

export const setPersistence = async (authInst?: any, persistence?: any) => {};
export const browserLocalPersistence = 'LOCAL';
export const browserSessionPersistence = 'SESSION';
