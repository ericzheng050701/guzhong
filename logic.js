
function calculate() {
    const Y = Number(document.getElementById("year").value);
    const M = Number(document.getElementById("month").value);
    const D = Number(document.getElementById("day").value);
    const hourInput = document.getElementById("hour").value;

    let date = new Date(`${Y}-${M}-${D}T00:00:00`);
    date.setHours(date.getHours() + 8); // 强制中国时间

    if (hourInput !== "unknown" && Number(hourInput) >= 23) {
        date.setDate(date.getDate() + 1);
    }

    const lunar = solarToLunar(date);
    let hourList = [];

    if (hourInput === "unknown") {
        hourList = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    } else {
        hourList = [hourToShichen(Number(hourInput))];
    }

    let html = `<div class='result-block'>
        <div class='bone-title'>${Y}年 农历${lunar.month}月${lunar.day}日</div>
    `;

    hourList.forEach(sc => {
        const weight = calcWeight(lunar.year, lunar.month, lunar.day, sc);
        const weightStr = formatWeight(weight);
        const poem = bonePoems[weightStr] || "(未找到对应歌诀)";

        html += `<div><b>${sc}时：</b>${weightStr}<br><pre>${poem}</pre></div>`;
    });

    html += "</div>";
    document.getElementById("result").innerHTML = html;
}

function hourToShichen(h) {
    if (h >= 23 || h < 1) return "子";
    if (h < 3) return "丑";
    if (h < 5) return "寅";
    if (h < 7) return "卯";
    if (h < 9) return "辰";
    if (h < 11) return "巳";
    if (h < 13) return "午";
    if (h < 15) return "未";
    if (h < 17) return "申";
    if (h < 19) return "酉";
    if (h < 21) return "戌";
    return "亥";
}

function solarToLunar(date) {
    return hkLunarCalc(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    );
}

function calcWeight(y, m, d, sc) {
    return (yearWeight[y] || 0)
        + (monthWeight[m] || 0)
        + (dayWeight[d] || 0)
        + (hourWeight[sc] || 0);
}

function formatWeight(total) {
    return `${Math.floor(total / 10)}两${total % 10}钱`;
}
