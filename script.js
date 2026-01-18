
function startPvP(){
    window.location.href="Karsilikli.html";
}

function Kolay(){
  window.location.href="Bot1.html";
}
function Orta(){
  window.location.href="Bot2.html";
}
function Zor(){
  window.location.href="Bot3.html";
}
function showBotMenu() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("botMenu").classList.remove("hidden");

}
function backToMenu() {
  document.getElementById("botMenu").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");

}
function startBot(level) {
  gameMode = "bot";
  botLevel = level;

}

