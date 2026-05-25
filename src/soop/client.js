import { WebSocket } from 'ws';

import * as config from '#soop/config';
import * as http from '#soop/http';
import * as packet from '#soop/packet';

import * as handler from '#handler';

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
                console.error(error);
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
            console.log('채팅 서버 연결됨');

            this.sendLogin();

            setTimeout(() => {
                this.sendJoinChannel(password);
            }, 300);
        });

        this.socket.on('message', data => {
            console.log('RECV:', data.toString());
        });

        this.socket.on('close', (code, reason) => {
            console.log('채팅 서버 종료:', code, reason.toString());
        });

        this.socket.on('error', error => {
            console.log('채팅 서버 오류:', error.message);
        });
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
            packet.login(ticket, '', 0)
        );
    }

    sendJoinChannel(password = '') {
        return this.send(
            packet.joinChannel(
                this.channel?.CHATNO,
                this.channel?.FTK || '',
                0,
                password,
                ''
            )
        );
    }

    disconnect() {
        
    }
}