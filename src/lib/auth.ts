const TOKEN_KEY = "admin_auth_token";
const USER_KEY = "admin_user_info";

export const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('Retrieved token from localStorage:', token);
    return token ? token : null;
  }
  return null;
};

export const setUserInfo = (userInfo: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
  }
};

export const getUserInfo = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem(USER_KEY);
    console.log('Retrieved user info', user);
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const removeAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const isAdmin = () => {
  const user = getUserInfo();
  console.log('isAdmin check - token exists:', !!getToken(), 'user info:', user);
  return !!getToken() && user?.role === "ADMIN";
};

export const isOwner = () => {
  const user = getUserInfo();
  return !!getToken() && user?.role === "OWNER";
};
