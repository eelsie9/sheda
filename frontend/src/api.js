import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getToken = () => localStorage.getItem("sheda_token");
export const setToken = (t) =>
  t ? localStorage.setItem("sheda_token", t) : localStorage.removeItem("sheda_token");

// Called when the server says our login is no longer valid
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// Talks to your backend. Sends your login token automatically.
export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && path !== "/auth/login") onUnauthorized();
    const err = new Error(data.error || "Something went wrong");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Uploads a photo and returns its web address
export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

// Loads data when a page opens. Call reload() to load it again.
export function useFetch(path) {
  const [res, setRes] = useState({ path: null, data: null, error: "" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    api(path)
      .then((data) => alive && setRes({ path, data, error: "" }))
      .catch(
        (e) =>
          alive &&
          setRes({
            path,
            data: null,
            error: e.message === "Failed to fetch" ? "Can't reach the server" : e.message,
          })
      );
    return () => {
      alive = false;
    };
  }, [path, tick]);

  const current = res.path === path;
  const data = current ? res.data : null;
  const error = current ? res.error : "";
  return { data, error, loading: !data && !error, reload: () => setTick((t) => t + 1) };
}