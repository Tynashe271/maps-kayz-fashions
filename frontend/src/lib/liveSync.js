let source

export function startLiveSync() {
  if (source || typeof EventSource === 'undefined') return
  // Same cross-origin consideration as lib/api.js — see its comment.
  source = new EventSource(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/sync/events`)
  source.onmessage = ({ data }) => {
    try { window.dispatchEvent(new CustomEvent('mk-sync', { detail: JSON.parse(data) })) } catch { /* heartbeat/reconnect safety */ }
  }
}
