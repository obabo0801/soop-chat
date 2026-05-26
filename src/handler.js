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
        if (packet.fields.length < 1) {
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

    // 12
    case SVC.SET_USER_FLAG: {
        if (packet.fields.length < 1) {
            soop.emit('error', packet.fields[0]);
            break;
        }
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

        if (!id) return false;

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