import { WebSocket } from 'ws';

import * as config from '#soop/config';
import * as http from '#soop/http';

export class SoopClient {
    constructor(options = {}) {
        this.options = options;

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
    }

    off(event, handler) {
        const handlers = this.events.get(event)
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
        const handlers = this.events.get(event)
        for (const handler of handlers) {
            try {
                handler(payload);
            } catch (error) {
                console.error(error);
            }
        }
    }

    async connect(streamerId = this.streamerId) {
        if (!this.channel) {
            this.channel = await http.getLive(streamerId, {
                cookie: this.options.cookie
            });
        }
        
        const domain = this.channel?.CHDOMAIN;

        if (!domain) return false;

        const url = domain.startsWith('ws')
            ? `${domain}/Websocket`
            : `wss://${domain}/Websocket`;
        
        const headers = {
            'User-Agent': this.userAgent,
            ...(this.options.cookie ? {
                Cookie: this.options.cookie
            } : {})
        };

        this.socket = new WebSocket(url, ['chat'], {
            headers
        });

        this.socket.on('open', () => {
            console.log('채팅 서버 연결됨');
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

    disconnect() {
        
    }
}