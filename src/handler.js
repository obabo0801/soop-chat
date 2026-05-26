import {
    SVC,
    USER_FLAG1,
    USER_FLAG2
} from '#soop/config';

export function packet(soop, packet) {

    switch (packet.service) {

    // 1
    case SVC.LOGIN: {
        soop.userId = packet.fields[0];
        soop.userFlag = packet.fields[1];
        soop.sendJoinChannel(soop.password);
        break;
    }

    // 2
    case SVC.JOIN_CHANNEL: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }
        soop.userFlag = packet.fields[6];

        if (soop.cookie?.AuthTicket) {
            soop.sendUserFlag(soop.userFlag);
        }
        break;
    }

    // 4
    case SVC.CHUSER: {
        const users = userList(soop, packet.fields);

        if (users.length > 1) {
            break;
        }

        const type = Number(packet.fields[0]);

        soop.emit('chuser', type, users[0]);
        break;
    }
    
    // 5
    case SVC.CHAT: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        soop.emit('chat', {
            message: packet.fields[0],
            userId: packet.fields[1],
            userName: packet.fields[5],
            subMonth: Number(packet.fields[7]),
            userFlag: packet.fields[6],
            ...checkFlag(packet.fields[6])
        });
        break;``
    }

    // 9
    case SVC.DIRECT_CHAT: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        console.log('[DIRECT_CHAT]', packet.fields);

        soop.emit('dchat', {
            message: packet.fields[0],
            userId: packet.fields[1],
            receiverId: packet.fields[2],
            receiverName: packet.fields[5],
            userName: packet.fields[6],
            userFlag: packet.fields[7],
            ...checkFlag(packet.fields[7])
        });
        break;
    }

    // 12
    case SVC.SET_USER_FLAG: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }
    }

    // 13
    case SVC.SET_SUB_BJ: {
        const userId = packet.fields[0];
        const userName = packet.fields[3];
        const flag = checkFlag(packet.fields[1]);

        if (flag.isManager) {
            soop.emit('alarm', `${userName}(${userId})님이 매니저가 되셨습니다.`);
        } else {
            soop.emit('alarm', `${userName}(${userId})님이 매니저에서 해임 되셨습니다.`);
        }
        break;
    }

    // 19
    case SVC.ICE_MODE: {
        const mode = checkFlag2(packet.fields[2]);

        console.log('[ICE_MODE]', packet.fields);
        break;
    }

    // 21
    case SVC.ICE_MODE_EX: {
        console.log('[ICE_MODE_EX]', packet.fields);
        break;
    }

    // 23
    case SVC.SLOW_MODE: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        console.log('[SLOW_MODE]', packet.fields);
        const count = Number(packet.fields[1]);
        soop.emit('alarm', count > 0
            ? `슬로우 모드가 활성화되었습니다. (채팅 간 ${count}초 간격)`
            : '슬로우 모드가 해제되었습니다.'
        );
        break;
    }

    // 26
    case SVC.MANAGER_CHAT: {
        if (packet.fields.length < 2) {
            soop.emit('error', packet.fields[0]);
            break;
        }

        soop.emit('mchat', {
            message: packet.fields[0],
            userId: packet.fields[1],
            userName: packet.fields[4],
            userFlag: packet.fields[5],
            ...checkFlag(packet.fields[5])
        });
        break;
    }

    // 54
    case SVC.BAN_WORD: {
        console.log('[BAN_WORD]', packet.fields);
        break;
    }

    // 90
    case SVC.KICK_MSG_STATE: {
        console.log('[KICK_MSG_STATE]', packet.fields);
        break;
    }

    // 94
    case SVC.TRANSLATION_STATE: {
        console.log('[TRANSLATION_STATE]', packet.fields);
        break;
    }

    // 104
    case SVC.BJ_NOTICE: {
        console.log('[BJ_NOTICE]', packet.fields);
        break;
    }

    // 110
    case SVC.PUNGASI_START_JSON: {
        console.log('[PUNGASI_START_JSON]', packet.fields);
        break;
    }

    // 127
    case SVC.CHUSER_EXTEND: {
//        console.log('[CHUSER_EXTEND]', packet.fields);
        break;
    }

    default:
        console.log('[PACKET]', packet);
        break;
    }
}

export function userList(soop, fields = []) {
    const type = Number(fields[0]);
    const users = [];

    if (type === 1) {
        for (let i = 1; i < fields.length; i += 3) {
            const id = fields[i];
            const name = fields[i + 1];
            const flag = fields[i + 2];

            if (!id) continue;

            const user = {
                id,
                name,
                flag,
                ...splitFlag(flag)
            };

            soop.userList.set(id, user);
            users.push(user);
        }

        return users;
    }

    if (type === -1) {
        const id = fields[1];
        const name = fields[2];
        const kick = Number(fields[3])
        const count = Number(fields[4])
        const flag = fields[5];

        if (!id) return users;

        const user = {
            id,
            name,
            kick,
            count,
            flag,
            ...splitFlag(flag)
        }

        soop.userList.delete(id);
        users.push(user);

        return users;
    }

    return users;
}

export function splitFlag(flag = '0|0') {
    const [flag1 = 0, flag2 = 0] = String(flag).split('|');

    return {
        flag1: Number(flag1) || 0,
        flag2: Number(flag2) || 0
    };
}

export function hasFlag(value = 0, flag = 0) {
    return (value & flag) === flag;
}

export function checkFlag(flag = '0|0') {
    const { flag1, flag2 } = splitFlag(flag);

    return {
        raw: flag,
        flag1,
        flag2,

        isAdmin: hasFlag(flag1, USER_FLAG1.ADMIN),
        isHidden: hasFlag(flag1, USER_FLAG1.HIDDEN),
        isBJ: hasFlag(flag1, USER_FLAG1.BJ),
        isGuest: hasFlag(flag1, USER_FLAG1.GUEST),
        isFanClub: hasFlag(flag1, USER_FLAG1.FANCLUB),
        isManager: hasFlag(flag1, USER_FLAG1.MANAGER),
        isMobile: hasFlag(flag1, USER_FLAG1.MOBILE),
        isTopFan: hasFlag(flag1, USER_FLAG1.TOP_FAN),
        isRealName: hasFlag(flag1, USER_FLAG1.REAL_NAME),
        isQuickView: hasFlag(flag1, USER_FLAG1.QUICKVIEW),
        isMobileWeb: hasFlag(flag1, USER_FLAG1.MOBILE_WEB),
        isNightBot: hasFlag(flag1, USER_FLAG1.NIGHTBOT),

        isGlobalPc: hasFlag(flag2, USER_FLAG2.GLOBAL_PC),
        isClan: hasFlag(flag2, USER_FLAG2.CLAN),
        isTopClan: hasFlag(flag2, USER_FLAG2.TOP_CLAN),
        isTop20: hasFlag(flag2, USER_FLAG2.TOP_20),
        isEmployee: hasFlag(flag2, USER_FLAG2.EMPLOYEE),
        isCleanAti: hasFlag(flag2, USER_FLAG2.CLEAN_ATI),
        isPolice: hasFlag(flag2, USER_FLAG2.POLICE),
        isAdminChat: hasFlag(flag2, USER_FLAG2.ADMIN_CHAT),
        isPc: hasFlag(flag2, USER_FLAG2.PC),
        isSpecify: hasFlag(flag2, USER_FLAG2.SPECIFY),
        isTier1: hasFlag(flag2, USER_FLAG2.FOLLOW_TIER1),
        isTier2: hasFlag(flag2, USER_FLAG2.FOLLOW_TIER2),
        isTier3: hasFlag(flag2, USER_FLAG2.FOLLOW_TIER3)
    };
}

export function checkFlag2(flag1 = '0') {
    return {
        isAdmin: hasFlag(flag1, USER_FLAG1.ADMIN),
        isHidden: hasFlag(flag1, USER_FLAG1.HIDDEN),
        isBJ: hasFlag(flag1, USER_FLAG1.BJ),
        isGuest: hasFlag(flag1, USER_FLAG1.GUEST),
        isFanClub: hasFlag(flag1, USER_FLAG1.FANCLUB),
        isManager: hasFlag(flag1, USER_FLAG1.MANAGER),
        isMobile: hasFlag(flag1, USER_FLAG1.MOBILE),
        isTopFan: hasFlag(flag1, USER_FLAG1.TOP_FAN),
        isRealName: hasFlag(flag1, USER_FLAG1.REAL_NAME),
        isQuickView: hasFlag(flag1, USER_FLAG1.QUICKVIEW),
        isMobileWeb: hasFlag(flag1, USER_FLAG1.MOBILE_WEB),
        isNightBot: hasFlag(flag1, USER_FLAG1.NIGHTBOT)
    };
}

export function userRole(flag = '0|0') {
    const flagInfo = checkFlag(flag);
    if (flagInfo.isBJ) return '스트리머';
    if (flagInfo.isManager) return '매니저';
    if (flagInfo.isTopFan) return '최고 팬';
    if (flagInfo.isFanClub) return '팬클럽';

    return '일반';
}

export function subTier(flag = '0|0') {
    const flagInfo = checkFlag(flag);
    if (flagInfo.isTier3) return '티어 3';
    if (flagInfo.isTier2) return '티어 2';
    if (flagInfo.isTier1) return '티어 1';

    return '';
}