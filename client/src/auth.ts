export type UserRole = "user" | "admin";
export type UserStatus = "active" | "blocked";
export type StoredUser = {
  id: number;
  account: string;
  password: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export type AuthUser = Pick<StoredUser, "id" | "account" | "email" | "role" | "status">;

const STORAGE_KEY = "authUser";
const USERS_KEY = "authUsers";

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function seedDefaultAdmin() {
  const users = loadUsers();
  const exists = users.find((u) => u.account === "01");
  if (!exists) {
    const admin: StoredUser = {
      id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      account: "01",
      password: "999999999",
      email: "admin@example.com",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    users.push(admin);
    saveUsers(users);
  }
}

seedDefaultAdmin();

export const Auth = {
  isLoggedIn(): boolean {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  },
  getUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  isAdmin(): boolean {
    const u = this.getUser();
    return !!u && u.role === "admin";
  },
  login(account: string, password: string): AuthUser | null {
    const users = loadUsers();
    const found = users.find((u) => u.account === account && u.password === password);
    if (!found) return null;
    if (found.status === "blocked") {
      throw new Error("blocked, contact to manager");
    }
    const u: AuthUser = {
      id: found.id,
      account: found.account,
      email: found.email,
      role: found.role,
      status: found.status,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    return u;
  },
  register(account: string, password: string, email?: string): AuthUser {
    const users = loadUsers();
    if (users.some((u) => u.account === account)) {
      throw new Error("account already exist");
    }
    const nu: StoredUser = {
      id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      account,
      password,
      email,
      role: "user",
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    users.push(nu);
    saveUsers(users);
    const authUser: AuthUser = { id: nu.id, account, email, role: "user", status: "active" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    return authUser;
  },
  logout() {
    localStorage.removeItem(STORAGE_KEY);
  },
  // Admin utilities
  getAllUsers(): StoredUser[] {
    return loadUsers();
  },
  updateUser(id: number, patch: Partial<StoredUser>) {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...patch };
      saveUsers(users);
    }
  },
  deleteUser(id: number) {
    const users = loadUsers().filter((u) => u.id !== id);
    saveUsers(users);
  },
};


