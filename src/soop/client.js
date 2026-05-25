import { WebSocket } from 'ws';

import * as config from '#soop/config';
import * as http from '#soop/http';
import * as packet from '#soop/packet';
import * as log from '#utils/log';

export class SoopClient {
    constructor(options = {}) {
        this.cookie = options.cookie;

        this.domain = config.DOMAIN;
        this.userAgent = config.USER_AGENT;
        this.subtitle = config.SUBTITLE;

        this.socket = null;
        this.streamerId = null;
        this.userId = null;
        this.userList = new Map();
        this.channel = null;
        this.events = new Map();
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push(handler);
        return this;
    }

    off(event, handler) {
        const handlers = this.events.get(event) || []

        this.events.set(
            event,
            handlers.filter(fn => fn !== handler)
        );

        return this;
    }

    once(event, handler) {
        const wrapper = payload => {
            this.off(event, wrapper);
            handler(payload);
        }

        this.on(event, wrapper);
        return this;
    }

    emit(event, payload) {
        const handlers = this.events.get(event) || []

        for (const handler of handlers) {
            try {
                handler(payload);
            } catch (error) {
                log.error(error);
            }
        }
    }

    async login(userId, password, secondPassword = '') {
        const result = await http.login(
            userId, password, {
            cookie: this.cookie
        });

        if (!result) return false;

        if (result.data.RESULT === -11) {
            return await this.secondLogin(
                userId, secondPassword
            );
        }

        if (result.cookie?.AuthTicket) {
            this.cookie = result.cookie;
        }

        return result;
    }

    async secondLogin(userId, secondPassword) {
        const result = await http.secondLogin(
            userId, secondPassword, {
            cookie: this.cookie
        });

        if (!result) return false;

        if (result.cookie?.AuthTicket) {
            this.cookie = result.cookie;
        }

        return result;
    }

    async logout() {
        await http.logout({
            cookie: this.cookie
        });

        this.cookie = '';
        this.channel = null;

        return true;
    }

    async connect(streamerId = this.streamerId, password = '') {
        this.streamerId = streamerId;

        if (!this.channel) {
            this.channel = await http.getLiveInfo(
                streamerId, password, {
                cookie: this.cookie
            });
        }
        
        const url = http.getChatUrl(this.channel);

        if (!url) return false;
        
        const headers = {
            ...(this.cookie ? {
                Cookie: http.cookieString(this.cookie)
            } : {})
        };

        this.socket = new WebSocket(url, ['chat'], {
            headers
        });

        this.socket.on('open', () => {
            this.sendLogin();

            setTimeout(() => {
                this.sendJoinChannel(password);
            }, 300);

            this.startPing();
            this.emit('open');
        });

        this.socket.on('message', data => {
            const text = data.toString();
            this.emit('packet', text);
        });

        this.socket.on('close', (code, reason) => {
            this.stopPing();

            this.emit('close', {
                code,
                reason: reason.toString()
            });
        });

        this.socket.on('error', error => {
            this.emit('error', error);
        });

        return true;
    }

    startPing() {
        this.stopPing();

        this.ping = setInterval(() => {
            this.sendPing();
        }, 60000);
    }

    stopPing() {
        if (!this.ping) {
            return false;
        }
        
        clearInterval(this.ping);
        this.ping = null;
    }

    sendPing() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return false;
        }

        this.send(packet.keepAlive());

        console.log('핑 보냄!');
        return true;
    }

    send(data) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return false;
        }

        this.socket.send(data);
        return true;
    }

    sendLogin() {
        const cookie = (
            typeof this.cookie === 'string'
            ? http.cookieJson(this.cookie)
            : this.cookie
        );

        const ticket = (
            this.channel?.TK
            || cookie?.AuthTicket
            || ''
        );

        return this.send(
            packet.login(ticket, '', 16)
        );
    }

    sendJoinChannel(password = '') {
        const joinLog = packet.joinLog({
            password,
            authInfo: this.channel?.AUTH_INFO || this.channel?.auth_info || '',
        });

        return this.send(
            packet.joinChannel(
                this.channel?.CHATNO,
                this.channel?.FTK || '',
                0,
                password,
                joinLog
            )
        );
    }

    disconnect() {
        if (!this.socket) return false;

        this.stopPing();
        this.socket.close();
        this.socket = null;

        return true;
    }
}