function getPassword() {
  return localStorage.getItem('app_password') || ''
}

async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-password': getPassword(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    let msg
    try { msg = JSON.parse(text).error } catch { msg = text }
    const err = new Error(msg || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  return res.json()
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path, body)  => request('DELETE', path, body),
}
