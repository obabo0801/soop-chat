import readline from 'readline';

import { SoopClient } from '#soop/client';
import * as http from '#soop/http';

import * as log from '#utils/log';
import * as handler from '#handler';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''}
);

// 스트리머 아이디
const streamerId = '';

// 필요하면 브라우저 쿠키 넣기
const cookie = ''

// 비밀번호 방송이면 입력
const password = '';

// 이모티콘 링크 표시 여부
const isLink = true;

const client = new SoopClient({
    streamerId, password, cookie
});

(async () => {
    // open
    client.on('open', () => {
        log.debug('[알림]', '연결 성공');
    });

    // quit
    client.on('quit', data => {
        let message = '';

        switch (data.type) {
        case 1:
            message = '스트리머에 의해 강제퇴장 되었습니다.';
            break;
        
        case 2:
            message = '매니저에 의해 강제퇴장 되었습니다.';
            break;
        
        default:
            message = `${data.adminName}에 의해 강제퇴장 되었습니다.`;
            break;
        }

        log.error('[알림]', message.get(data.type));
    });

    // userList
    client.on('userList', data => {
    });

    // chuser
    client.on('chuser', data => {
        let message = '';

        switch (data.type) {
        case 1:
            break;

        case -1:
            break;

        case 5:
            message = '님이 블라인드 상태에서 탈출을 시도하여 강제퇴장 되었습니다.';
            break;
        
        default:
            console.log(data.type, '#');
            message = `님이 강퇴되었습니다. (누적 ${data.user.count}회)`
            break;
        }

        const info = data.type === 1 ? '입장' : '퇴장';

        const badge = data.tier
            ? `${data.user.role}/${data.user.tier}${data.fw}`
            : data.user.role
        
        message = [
            `[${info}]`, `[${badge}]`,
            `${data.user.name}(${data.user.id})${message}`
        ];

        if (data.type > 1) {
            log.error(...message);
        } else {
//            log.debug(...message);
        }
    });

    // chat
    client.on('chat', data => {
        const badge = data.tier
            ? `${data.role}${data.tier}/${data.subMonth}`
            : data.role

        if (isLink) { //----------------------------------------------------

        const extras = client.getChatAssets(data);

        for (const item of extras.emoticons) {
            log.warn('[이모티콘]', item.keyword, item.smallUrl);
        }

        if (extras.tierUrl) {
            log.load(`[티어${extras.tier}]`, extras.tierUrl);
        }

        } //----------------------------------------------------------------

        log.info('\x1b[94m[채팅]\x1b[0m', `[${badge}]`,
            `${data.userName}(${data.userId}): ${data.message}`
        );
    });

    // directChat
    client.on('directChat', data => {
        let message = '';
        
        const badge = data.tier
            ? `${data.role}${data.tier}/${data.subMonth}`
            : data.role

        if (isLink) { //----------------------------------------------------

        const extras = client.getChatAssets(data);

        for (const item of extras.emoticons) {
            log.warn('[이모티콘]', item.keyword, item.smallUrl);
        }

        if (extras.tierUrl) {
            log.load(`[티어${extras.tier}]`, extras.tierUrl);
        }

        } //----------------------------------------------------------------

        if (data.type === 1) {
            message = `${data.fromName}(${data.fromId})님의 귓말 ${data.message}`;
        } else {
            message = `${data.toName}(${data.toId})님에게 귓말 ${data.message}`;
        }

        log.load('[귓속말]', `[${badge}]`, message);
    });

    // userFlag
    client.on('userFlag', data => {
        const flag = data.flag.isBlock ? '거부' : '허용';

        log.debug('[알림]', 
            `${data.userName}(${data.userId})님이 귓속말 ${flag} 하셨습니다.`
        );
    });

    // subBj
    client.on('subBj', data => {
        const message = data.flag.isManager
            ? '님이 매니저가 되셨습니다.'
            : '님이 매니저에서 해임 되셨습니다.';

        log.allim('[알림', `${data.userName}(${data.userId})${message}`);
    });

    // nickName
    client.on('nickName', data => {
        log.debug('[알림]',
            `${data.oldName}(${data.userId})님이 ${data.newName}` 
            + '으로 닉네임을 변경 하셨습니다.');
    });

    // iceMode
    client.on('iceMode', data => {
        if (data.index === 0) {
            log.warn('[얼음]', '채팅을 녹였습니다.');
            return;
        }

        const { auth, count, date } = data;

        const names = [
            auth.isStreamerAllowed && '스트리머',
            auth.isTopFanAllowed && '열혈팬',
            auth.isSubscriberAllowed && (
                date > 0 ? `구독팬(${date}개월↑)` : '구독팬'
            ),
            auth.isFanClubAllowed && (
                count > 0 ? `팬클럽(${count}개↑)` : '팬클럽'
            ),
            auth.isSupporterAllowed && '서포터',
            auth.isManagerAllowed && '매니저',
        ].filter(Boolean);

        log.warn('[얼음] 채팅을 얼렸습니다.', names.join(', '));


    });

    // slowMode
    client.on('slowMode', data => {
        let message = '';

        if (data.count > 0) {
            message = (
                '저속모드가 활성화되었습니다.',
                `${data.count}초 간격으로 채팅 입력이 가능합니다.`
            );
        } else {
            message = (
                '저속모드가 비활성화되었습니다.',
                '지연 없이 채팅 입력이 가능합니다.'
            );
        }

        log.debug('[알림]', message);
    });

    // managerChat
    client.on('managerChat', data => {
        const badge = data.tier
            ? `${data.role}${data.tier}/${data.subMonth}`
            : data.role

        if (isLink) { //----------------------------------------------------

        const extras = client.getChatAssets(data);

        for (const item of extras.emoticons) {
            log.warn('[이모티콘]', item.keyword, item.smallUrl);
        }

        if (extras.tierUrl) {
            log.load(`[티어${extras.tier}]`, extras.tierUrl);
        }

        } //----------------------------------------------------------------

        log.info('\x1b[91m[매니저 채팅]\x1b[0m', `[${badge}]`,
            `${data.userName}(${data.userId}): ${data.message}`
        );
    });

    // banWord
    client.on('banWord', data => {
        if (data.after.length > 0) {
            log.debug('[알림]',
                '금칙어가 적용되어있습니다.',
                `(금칙어: ${data.after.join(', ')} / `,
                `대체어: ${data.before})`
            );
        }
    });

    // adminNotice
    client.on('adminNotice', data => {
        log.warn('[SOOP 안내]', data.message);
    });

    // kickState
    client.on('kickState', data => {
        const flag = data.index === 0 ? '켜짐' : '꺼짐';
        log.debug('[알림]', `유저에게 강제 퇴장 메시지 표시: ${flag}`);
    });

    // translationState
    client.on('translationState', data => {
        const flag = data.index === 1 ? '켜짐' : '꺼짐';
        log.debug('[알림]', `채팅 번역 기능: ${flag}`);
    });

    // notice
    client.on('notice', data => {
        if (data.state === 1) {
            log.debug('[공지]', `\n${data.message}`);
        }
    });

    // ogq
    client.on('ogq', data => {
        const badge = data.tier
            ? `${data.role}${data.tier}/${data.subMonth}`
            : data.role
        
        const message = data.message ? `: ${data.message}` : '';
        
        const extras = client.getChatAssets(data);

        if (isLink) { //----------------------------------------------------

        for (const item of extras.emoticons) {
            log.warn('[이모티콘]', item.keyword, item.smallUrl);
        }

        if (extras.tierUrl) {
            log.load(`[티어${extras.tier}]`, extras.tierUrl);3
        }

        log.warn('[OGQ]', `[${badge}]`,
            `${data.userName}(${data.userId})${message}`, data.imageUrl
        );

        } //----------------------------------------------------------------

        else if (data.message) {
            log.info('\x1b[94m[채팅]\x1b[0m', `[${badge}]`,
                `${data.userName}(${data.userId})${message}`
            );
        }

    });

    // subtitle
    client.on('subtitle', data => {
        log.info('\x1b[91m[자막]\x1b[0m', `\x1b[1m${data.message}\x1b[0m`);
    });

    // userLang
    client.on('userLang', data => {
        let message = '';

        if (data.index < 0) {
            message = '자막 언어 설정이 꺼져있습니다.';
        } else {
            message = '자막 언어 설정이 변경되었습니다.';
        }

        log.debug('[알림]', message, data.lang.label);
    });

    // error
    client.on('error', error => {
        log.error('[에러]', error);
    });

    // close
    client.on('close', () => {
        log.debug('[알림]', '연결 종료');
    });

    // packet
    client.on('packet', data => {
        log.warn('[수신]', {
            CODE: data.service,
            SIZE: data.length,
            FLAG: data.flag,
            DATA: data.fields
        });
    });

    await client.connect();
    await client.sendSubtitle(0);
})();

export function shutdown() {
    pause();
    close();
    client.disconnect();
    process.exit(0);
}

export function prompt() {
    if (!rl.closed) rl.prompt();
}

export function pause() {
    if (!rl.closed) rl.pause();
}

export function close() {
    if (!rl.closed) rl.close();
}

async function command(cmd) {
    if (!client.socket) {
        prompt();
        return;
    }
}

rl.on('line', async (input) => {
    const cmd = input.trim();
    log.input(input);

    if (!cmd) {
        prompt();
        return;
    }

    await command(cmd);
});

rl.on('SIGINT', shutdown);