import { WebSocket } from 'ws';
import crypto from 'crypto';
import * as handler from '#handler';

import {
    SVC,
    DELIMITER
} from '#soop/config';

import * as http from '#soop/http';
import * as packet from '#soop/packet';
import * as log from '#utils/log';

export class SoopClient {
    constructor(options = {}) {
        this.cookie = options.cookie;
        this.password = options.password;

        this.uuid = crypto
            .randomBytes(16)
            .toString('hex');

        this.socket = null;
        this.channel = null;

        this.streamerId = null;
        this.userId = null;
        this.usefFlag = null;

        this.userList = new Map();
        this.events = new Map();

        this.ping = null;
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
    
    isOpen(socket) {
        return (
            socket
            && socket.readyState === WebSocket.OPEN
        );
    }
    
    isConnecting(socket) {
        return (
            socket
            && socket.readyState === WebSocket.CONNECTING
        );
    }

    async login(
            userId, password, secondPassword = ''
        ) {
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

    async secondLogin(
            userId, secondPassword
        ) {
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

        this.uuid = null;

        return true;
    }

    async connect(
            streamerId = '', password = ''
        ) {
        if (!streamerId) {
            streamerId = this.streamerId;
        }
        if (!password) {
            password = this.password;
        }
        this.streamerId = streamerId;
        this.password = password;

        if (!this.channel) {
            this.channel = await http.getLiveInfo(
                streamerId, {
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

        await this.openSocket();

        return true;
    }

    async openSocket() {
        this.socket.on('open', () => {
            this.sendLogin();
            this.startPing();
            this.emit('open');
        });

        this.socket.on('message', data => {
            handler.packet(
                this, 
                packet.parse(data)
            );
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
    }

    send(data) {
        if (!this.isOpen(this.socket)) {
            return false;
        }

        this.socket.send(data);
        return true;
    }

    sendLogin() {
        return this.send(
            packet.login(this.channel?.TK || '')
        );
    }

    sendJoinChannel(password = '') {
        return this.send(
            packet.joinChannel(
                this.channel,
                password,
                this.cookie?._au || this.uuid
            )
        );
    }

    sendUserFlag(flag = '') {
        return this.send(
            packet.setUserFlag(flag)
        );
    }

    sendUserList() {
        return this.send(
            packet.userList()
        );
    }

    sendPing() {
        if (!this.isOpen(this.socket)) {
            return false;
        }

        this.send(packet.keepAlive());
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

    disconnect() {
        if (!this.socket) {
            return false;
        }

        this.stopPing();
        this.socket.close();
        this.socket = null;

        return true;
    }
}