"use strict";

// 固定使用台灣時區；即使電腦在其他時區也會顯示台灣時間。
const $ = (id) => document.getElementById(id);
const dateFormatter = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", weekday: "long", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
function updateClock() {
  const now = new Date();
  const p = Object.fromEntries(dateFormatter.formatToParts(now).map(part => [part.type, part.value]));
  $("date").textContent = `${p.year} 年 ${p.month} 月 ${p.day} 日`;
  $("weekday").textContent = p.weekday;
  $("clock").innerHTML = `${p.hour}:${p.minute}<span class="seconds">:${p.second}</span>`;
  $("clock").dateTime = now.toISOString();
  $("clock").setAttribute("aria-label", `台灣目前時間 ${p.hour} 時 ${p.minute} 分 ${p.second} 秒`);
  $("year").textContent = p.year;
  const elapsed = Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second);
  $("day-progress").style.width = `${elapsed / 86400 * 100}%`;
  $("day-message").textContent = Number(p.hour) < 12 ? "早安，開啟新的一天。" : Number(p.hour) < 18 ? "午安，持續前進。" : "晚安，留點時間給自己。";
}
updateClock();
setInterval(updateClock, 1000);

function weatherDescription(code, isDay) {
  if (code === 0) return [isDay ? "晴朗" : "晴朗夜晚", isDay ? "☀" : "☾"];
  if ([1, 2].includes(code)) return ["晴時多雲", "☁"];
  if (code === 3) return ["陰天", "☁"];
  if ([45, 48].includes(code)) return ["有霧", "≋"];
  if ([51, 53, 55, 56, 57].includes(code)) return ["毛毛雨", "☂"];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ["降雨", "☂"];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["降雪", "❄"];
  if ([95, 96, 99].includes(code)) return ["雷雨", "ϟ"];
  return ["天氣狀態未知", "◎"];
}

// 台中市座標；免費公開氣象 API，不需要 API 金鑰。
const weatherURL = "https://api.open-meteo.com/v1/forecast?latitude=24.1477&longitude=120.6736&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=Asia%2FTaipei";
async function loadWeather() {
  if ($("refresh").disabled) return;
  $("refresh").disabled = true;
  $("weather-status").textContent = "正在更新天氣…";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(weatherURL, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const c = data.current;
    if (!c || ![c.temperature_2m, c.apparent_temperature, c.relative_humidity_2m, c.wind_speed_10m, c.weather_code, c.is_day].every(Number.isFinite) || typeof c.time !== "string") throw new Error("Invalid weather data");
    const [description, icon] = weatherDescription(c.weather_code, c.is_day);
    $("temperature").innerHTML = `${Math.round(c.temperature_2m)}<small>°C</small>`;
    $("condition").textContent = description;
    $("weather-icon").textContent = icon;
    $("feels").textContent = `${Math.round(c.apparent_temperature)}°C`;
    $("humidity").textContent = `${c.relative_humidity_2m}%`;
    $("wind").textContent = `${c.wind_speed_10m} km/h`;
    $("weather-status").textContent = `資料時間 ${c.time.replace("T", " ")} · 每 15 分鐘更新`;
  } catch (error) {
    $("temperature").innerHTML = '--<small>°C</small>';
    $("condition").textContent = "暫時無法取得";
    $("weather-icon").textContent = "◎";
    ["feels", "humidity", "wind"].forEach(id => $(id).textContent = "--");
    $("weather-status").textContent = "請確認網路連線，再按重新整理。";
  } finally {
    clearTimeout(timeout);
    $("refresh").disabled = false;
  }
}
$("refresh").addEventListener("click", loadWeather);
loadWeather();
setInterval(loadWeather, 15 * 60 * 1000);
