const liveTime = document.getElementById("heroLiveTime");

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function updateLiveTime() {
  if (!liveTime) {
    return;
  }
  const now = new Date();
  liveTime.textContent = `Updated at ${formatTime(now)}`;
}

updateLiveTime();
if (liveTime) {
  setInterval(updateLiveTime, 60 * 1000);
}
