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

// 방송 비밀번호
const password = '';

// 이모티콘 링크 표시
const isLink = true;

// 프로토콜 옵션
// 0: 참여자 목록 표시, 입장/퇴장 모두 표시
// 1: 입장/퇴장 모두 표시
// 2: 입장/퇴장 열혈 이상 표시
const pver = 2;

// 자막이 허용된 방송에서 자막 표시
// (-1: 끄기 / 0: 한국어 / 1: English)
const subtitle = 0

const client = new SoopClient({
    streamerId, password, pver, subtitle, cookie
});

(async () => {

    // open
    client.on('open', () => {
        log.debug('[알림]', '연결 성공');
    });

    // rule
    client.on('rule', data => {
        if (data.chat_rule_display > 0) {
            log.info('[규칙]', `\x1b[1m${data.chat_rule}\x1b[0m`);
        }
    })

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

        log.error('[알림]', message);
    });

    // dumb
    client.on('dumb', data => {
        let message = '';

        if (data.count > 2) {
            message = ('님이 채팅금지 횟수 초과로 블라인드 처리 되었습니다. '
                + `${data.count}초 동안 채팅과 방송화면을 볼 수 없습니다.`
            );
        } else {
            message = `님이 채팅금지(${data.time}초) ${data.count}회가 되었습니다.`;
        }

        const admin = client.userList.get(data.adminId);
        const name = admin?.name ? admin.name : data.adminId;

        log.error('[채금]', `\x1b[1m${data.userName}(${data.userId})${message}`, `(처리자: ${name})\x1b[0m`);
    });

    // userList
    client.on('userList', data => {
    });

    // chuser
    client.on('chuser', data => {
        let message = '';

        switch (data.type) {
        case 1:
            message = '님이 대화방에 참여했습니다.';
            break;

        case -1:
            message = '님이 대화방에서 나가셨습니다.';
            break;

        case 5:
            message = '님이 블라인드 상태에서 탈출을 시도하여 강제퇴장 되었습니다.';
            break;
        
        default:
            message = `님이 강퇴되었습니다. (누적 ${data.user.count}회)`
            break;
        }

        const info = data.type === 1 ? '입장' : '퇴장';

        const badge = data.tier
            ? `${data.user.role}/${data.user.tier}${data.user.fw}`
            : data.user.role
        
        message = [
            `[${info}]`, `[${badge}]`, `${data.user.name}(${data.user.id})${message}`
        ];

        if (data.type > 1) {
            log.error(...message);
        } else {
            log.debug(...message);
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

        log.load('[귓속말]', `\x1b[1m[${badge}]`, `${message}\x1b[0m`);
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

        log.allim('[알림', `\x1b[1m${data.userName}(${data.userId})${message}\x1b[0m`);
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
            log.allim('[얼음]', '\x1b[1m채팅을 녹였습니다. 채팅에 참여 하실 수 있습니다.\x1b[0m');
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

        log.allim('[얼음]', `\x1b[1m채팅을 얼렸습니다. ${names.join(', ')}만 채팅에 참여할 수 있습니다.\x1b[0m`);
    });

    // slowMode
    client.on('slowMode', data => {
        let message = '';

        if (data.count > 0) {
            message = [
                '저속모드가 활성화되었습니다.', `${data.count}초 간격으로 채팅 입력이 가능합니다.`
            ];
        } else {
            message = [
                '저속모드가 비활성화되었습니다.', '지연 없이 채팅 입력이 가능합니다.'
            ];
        }

        log.debug('[알림]', ...message);
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

        log.info('\x1b[91m[매니저 채팅]\x1b[0m', `\x1b[1m[${badge}]`,
            `${data.userName}(${data.userId}): ${data.message}\x1b[0m`
        );
    });

    // banWord
    client.on('banWord', data => {
        if (data.after.length > 0) {
            log.debug('[알림]', '금칙어가 적용되어있습니다.', `(금칙어: ${data.after.join(', ')} /`, `대체어: ${data.before})`);
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

    // translation
    client.on('translation', data => {
        log.info('[번역]', `\x1b[1m${data.message} (${data.before.label} → ${data.after.label})\x1b[0m`);
        
        if (data.mode === 2) rl.write(data.message);
    });

    // notice
    client.on('notice', data => {
        if (data.state === 1) {
            log.info('[공지]', `\x1b[1m${data.message}\x1b[0m`);
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
            log.load(`[티어${extras.tier}]`, extras.tierUrl);
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

    // adInBroad
    client.on('adInBroad', data => {
        let message = '';
        if (data.ad_in_room === 1) {
            message = '쉬는시간이 설정되었습니다. 쉬는시간에도 채팅입력이 가능합니다.';
        } else {
            message = '쉬는시간이 종료되었습니다.';
        }

        log.warn('[알림]', message);
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

//    await client.sendUserList();
 
    await client.sendSubtitle();
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