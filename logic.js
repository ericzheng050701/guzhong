/************************************************
 * logic.js — 称骨小程序核心逻辑
 * 负责：
 *  - 阳历 → 农历
 *  - 小时 → 时辰
 *  - 查骨重表（年/月/日/时）
 *  - 求和 → 转换成几两几钱
 *  - 匹配称骨歌诀（db.js 提供）
 ************************************************/

// ========== 1. 小时 → 时辰 ==========
function hourToShichen(hour) {
    if (hour >= 23 || hour < 1) return "子时";
    if (hour >= 1 && hour < 3) return "丑时";
    if (hour >= 3 && hour < 5) return "寅时";
    if (hour >= 5 && hour < 7) return "卯时";
    if (hour >= 7 && hour < 9) return "辰时";
    if (hour >= 9 && hour < 11) return "巳时";
    if (hour >= 11 && hour < 13) return "午时";
    if (hour >= 13 && hour < 15) return "未时";
    if (hour >= 15 && hour < 17) return "申时";
    if (hour >= 17 && hour < 19) return "酉时";
    if (hour >= 19 && hour < 21) return "戌时";
    if (hour >= 21 && hour < 23) return "亥时";
}

// ========== 2. 阳历 → 农历算法（不依赖网络，纯本地） ==========
//
// 传统黄历转换算法，支持 1900–2100
//
// 把输入日期当作“中国时区的当天 00:00”，避免受设备时区影响
function chinaMidnightTimestamp(y, m, d) {
    const UTC8_OFFSET = 8 * 60 * 60 * 1000;
    return Date.UTC(y, m - 1, d) - UTC8_OFFSET;
}

function solarToLunar(y, m, d) {
    // 农历数据
    const lunarInfo = [
        0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,
        0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,
        0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,
        0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,
        0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
        0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,
        0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,
        0x052d0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,
        0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,
        0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
        0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,
        0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,
        0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,
        0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,
        0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
        0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,
        0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,
        0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,
        0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
    ];

    let total, offset, days, leap, temp = 0;
    // 以中国时区的 1900-01-31 00:00 为基准，避免受设备时区/DST 干扰
    const baseDate = chinaMidnightTimestamp(1900, 1, 31);
    const objDate = chinaMidnightTimestamp(y, m, d);
    offset = Math.floor((objDate - baseDate) / 86400000);

    let i = 1900;
    for (; i < 2101 && offset > 0; i++) {
        temp = yearDays(i, lunarInfo);
        offset -= temp;
    }
    if (offset < 0) { offset += temp; i--; }

    let year = i;
    leap = leapMonth(year, lunarInfo);
    let isLeap = false;

    let month;
    for (month = 1; month < 13 && offset > 0; month++) {
        if (leap > 0 && month === (leap + 1) && !isLeap) {
            month--;
            isLeap = true;
            temp = leapDays(year, lunarInfo);
        } else {
            temp = monthDays(year, month, lunarInfo);
        }

        if (isLeap && month === (leap + 1)) isLeap = false;
        offset -= temp;
    }

    if (offset === 0 && leap > 0 && month === leap + 1) {
        if (isLeap) isLeap = false;
        else {
            isLeap = true;
            month--;
        }
    }

    if (offset < 0) { offset += temp; month--; }

    return {
        year,
        month,
        day: offset + 1
    };
}

function yearDays(y, info) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) sum += (info[y - 1900] & i) ? 1 : 0;
    return sum + leapDays(y, info);
}
function leapMonth(y, info) {
    return info[y - 1900] & 0xf;
}
function leapDays(y, info) {
    if (leapMonth(y, info)) return (info[y - 1900] & 0x10000) ? 30 : 29;
    return 0;
}
function monthDays(y, m, info) {
    return (info[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

// ========== 3. 倒数中文数字 ==========
function numToChinese(n) {
    const c = ["零","一","二","三","四","五","六","七","八","九"];
    if (n < 10) return c[n];
    return c[Math.floor(n/10)] + c[n%10];
}

// ========== 4. 钱 → “x两y钱”格式 ==========
function convertMoney(totalQian) {
    const liang = Math.floor(totalQian / 10);
    const qian = totalQian % 10;
    // bonePoem 数据中，整两的键没有“零钱”二字，因此零钱为 0 时直接返回“X两”
    return qian === 0
        ? `${numToChinese(liang)}两`
        : `${numToChinese(liang)}两${numToChinese(qian)}钱`;
}

// ========== 5. 计算骨重 ==========
function calcBoneWeight(lunar, shichen) {
    const yearWeight = boneYear[lunar.year];
    const monthWeight = boneMonth[lunar.month];
    const dayWeight = boneDay[lunar.day];
    const hourWeight = boneHour[shichen];

    const total = yearWeight + monthWeight + dayWeight + hourWeight;
    return convertMoney(total);
}

// ========== 6. 输出 HTML 块 ==========
function makeResultBlock(title, content) {
    return `
        <div class="result-block">
            <div class="bone-title">${title}</div>
            <pre>${content}</pre>
        </div>
    `;
}

// ========== 7. 主入口：calculate() ==========
function calculate() {
    const year = parseInt(document.getElementById("year").value);
    const month = parseInt(document.getElementById("month").value);
    const day = parseInt(document.getElementById("day").value);
    const hourValue = document.getElementById("hour").value;

    const lunar = solarToLunar(year, month, day);
    let outputHTML = "";

    // ======= 小时未知：输出 12 个时辰 =======
    if (hourValue === "unknown") {
        const shichens = ["子时","丑时","寅时","卯时","辰时","巳时",
                          "午时","未时","申时","酉时","戌时","亥时"];

        shichens.forEach(sc => {
            const result = calcBoneWeight(lunar, sc);
            const poem = bonePoem[result] || "（未找到对应歌诀）";
            outputHTML += makeResultBlock(`${sc}：${result}`, poem);
        });

        document.getElementById("result").innerHTML = outputHTML;
        return;
    }

    // ======= 小时已知：输出 1 条 =======
    const hour = parseInt(hourValue);
    const shichen = hourToShichen(hour);
    const result = calcBoneWeight(lunar, shichen);
    const poem = bonePoem[result] || "（未找到对应歌诀）";

    outputHTML = makeResultBlock(
        `${lunar.year}年 农历${lunar.month}月${lunar.day}日 ${shichen}：${result}`,
        poem
    );

    document.getElementById("result").innerHTML = outputHTML;
}
