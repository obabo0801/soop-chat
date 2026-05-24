export async function request(url, options = {}) {
    const {
        method = 'GET',
        headers = {},
        body,
        cookie = '',
    } = options;

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...(cookie ? { Cookie: cookie } : {}),
            ...headers,
        },
        body
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
}