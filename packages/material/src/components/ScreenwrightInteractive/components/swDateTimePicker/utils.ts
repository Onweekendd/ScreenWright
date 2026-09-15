function getDate(d = "") {
  const time = d ? new Date(d + " 00:00:00").getTime() : new Date().setHours(0, 0, 0, 0);
  if (Number.isNaN(time)) {
    let s = d.replace(/[/.-]+/g, "");
    let dd = "";
    if (s.indexOf("年") > -1) {
      const arr = s.split("年");
      const h = arr[0];
      dd += h;
      s = arr[1];
    }
    if (s.indexOf("月") > -1) {
      const sArr = s.split("月");
      const h = sArr[0];
      if (dd) {
        dd += "-" + h;
      } else {
        dd = "1970-" + h;
      }
      s = sArr[1];
    }
    if (s.indexOf("日") > -1) {
      const h = s.split("日")[0];
      if (dd) {
        dd += "-" + h;
      } else {
        dd = "1970-01-" + h;
      }
    }
    return new Date(dd + " 00:00:00").getTime();
  } else {
    return time;
  }
}
function getTime(s = "") {
  let time = 0;
  const hour = 3600000;
  if (s.indexOf(":") > -1) {
    const sArr = s.split(":");
    if (sArr.length === 3) {
      time = parseInt(sArr[0]) * hour;
      time += parseInt(sArr[1]) * 60000;
      time += parseInt(sArr[2]) * 1000;
    } else if (sArr.length === 2) {
      time = parseInt(sArr[0]) * hour;
      time += parseInt(sArr[1]) * 60000;
    } else if (sArr.length === 1) {
      time = parseInt(sArr[0]) * hour;
    }
  } else if (s) {
    if (s.indexOf("时") > -1) {
      const arr = s.split("时");
      const h = arr[0];
      time = parseInt(h) * hour;
      s = arr[1];
    }
    if (s.indexOf("分") > -1) {
      const sArr = s.split("分");
      const h = sArr[0];
      time += parseInt(h) * 60000;
      s = sArr[1];
    }
    if (s.indexOf("秒") > -1) {
      s = s.split("秒")[0];
      const h = s;
      time += parseInt(h) * 1000;
    }
  }
  return time;
}
// // 日期格式化相关方法 - 使用dayjs代替getDateTime和formatDate
const getDateTime = (str: string): number => {
  if (!Number.isNaN(new Date(str).getTime()) && !/[时分秒年月日]+/.test(str)) {
    return new Date(str).getTime();
  }
  const ss = str.split(" ");
  const d = ss[0];
  const date = getDate(d);
  const s = ss[1] || "00:00:00";
  const time = getTime(s.length < 3 ? s + ":00" : s);
  return date + time;
};

export { getDateTime };
