export const CONTENT_TYPE = (
    'application/x-www-form-urlencoded'
);

export const AGENT = (
    'application/json, text/javascript, */*; q=0.01'
);

export const ACCEPT_LANGUAGE = (
    'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
)

export const USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    + 'AppleWebKit/537.36 (KHTML, like Gecko) '
    + 'Chrome/148.0.0.0 Safari/537.36'
);

export async function raw(url, options = {}) {
    let {
        method = 'GET',
        headers = {},
        body,
        cookie = ''
    } = options;

    headers = {
        Accept: AGENT,
        'Accept-Language': ACCEPT_LANGUAGE,
        'User-Agent': USER_AGENT,

        ...(body ? {
            'Content-Type': CONTENT_TYPE
        } : {}),

        ...(cookie ? {
            Cookie: cookieString(cookie)
        } : {}),

        ...headers,
    }

    const res = await fetch(url, {
        method,
        headers,
        body
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');

        throw new Error(
            `HTTP ${res.status} ${res.statusText}\n` +
            `URL: ${res.url}\n` +
            `Body:\n${text.slice(0, 500)}`
        );
    }

    return res;
}

export async function json(url, options = {}) {
    const res = await raw(url, options);
    const text = await res.text();

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch (err) {
        throw new Error(
            `JSON : ${err.message}\n` + 
            `URL: ${res.url}\n` +
            `Body:\n${text.slice(0, 500)}`
        );
    }
}

export function cookieRead(data) {
    const cookies = data.headers.getSetCookie?.();

    if (Array.isArray(cookies) && cookies.length > 0) {
        return cookies;
    }

    const cookie = data.headers.get('set-cookie');
    
    return cookie ? [cookie] : [];
}

export function cookieString(cookie = {}) {
    if (!cookie) return '';

    if (typeof cookie === 'string') {
        return cookie;
    }

    return (Object.entries(cookie)
        .filter(([, value]) =>
            value !== undefined
            && value !== null)
        .map(([key, value]) =>
            `${key}=${value}`)
        .join('; ')
    );
}

export function cookieJson(cookie = '') {
    if (!cookie) return {};

    const result = {};
    const cookies = (
        Array.isArray(cookie)
        ? cookie : [cookie]
    );

    cookies
        .flatMap(v => String(v)
            .split(/,(?=\s*[^;,=\s]+=)/)
        )
        .map(v => v.split(';')[0].trim())
        .filter(Boolean)
        .forEach(v => {
            const index = v.indexOf('=');
            if (index <= 0) return;

            const key = v.slice(
                0, index
            ).trim();
            const value = v.slice(
                index + 1
            ).trim();

            result[key] = value;
        });

    return result;
}