const ESC = '\x1b';
const TAB = '\x09';
const FF = '\x0c';

export const SVC = {
    KEEPALIVE: 0,
    LOGIN: 1,
    JOIN_CHANNEL: 2,
    CHAT: 5,
};

const DC1 = '\x11';
const DC2 = '\x12';

export function addInfo(data = {}) {
    return Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}${DC1}${value}${DC2}`)
        .join('');
}

export function joinLog({ password = '', authInfo = '' } = {}) {
    return addInfo({
        pwd: password,
        auth_info: authInfo,
        pver: 2,
        access_system: 'html5',
        nation_lang: 'ko_KR',
    });
}

function stringToUint(value = '') {
    try {
        value = unescape(encodeURIComponent(value));
    } catch {
        value = unescape(value);
    }

    return Uint8Array.from(
        String(value),
        ch => ch.charCodeAt(0)
    );
}

function toBuffer(value = '') {
    if (Buffer.isBuffer(value)) {
        return value;
    }

    if (value instanceof Uint8Array) {
        return Buffer.from(value);
    }

    return Buffer.from(String(value), 'utf8');
}

function makeBody(fields = []) {
    const chunks = [];

    for (const field of fields) {
        chunks.push(toBuffer(FF));
        chunks.push(toBuffer(field));
    }

    chunks.push(toBuffer(FF));

    return Buffer.concat(chunks);
}

export function makePacket(service, fields = []) {
    const body = makeBody(fields);

    const header = (
        ESC
        + TAB
        + String(service).padStart(4, '0')
        + String(body.length).padStart(6, '0')
        + '00'
    );

    return Buffer.concat([
        Buffer.from(header, 'binary'),
        body
    ]);
}

export function login(ticket = '', nick = '', flag = 0) {
    return makePacket(SVC.LOGIN, [
        ticket,
        stringToUint(nick),
        flag
    ]);
}

export function joinChannel(chatNo, fanTicket = '', type = 0, password = '', log = '') {
    return makePacket(SVC.JOIN_CHANNEL, [
        chatNo,
        fanTicket,
        type,
        stringToUint(password),
        log
    ]);
}

export function keepAlive() {
    return makePacket(SVC.KEEPALIVE, []);
}