function init() {
  document.getElementById('separator2').style.backgroundColor = '#ccd433';
  document.getElementById('progress_bar').children[1].style.backgroundColor = '#ccd443';
  document.getElementById('separator3').style.backgroundColor = '#ccd433';
  document.getElementById('progress_bar').children[3].style.color = 'white';
  document.getElementById('progress_bar').children[3].style.backgroundColor = '#ccd443';
  document.getElementById('progress_bar').children[3].style.textShadow = '#000 0 0 .2em';
  document.getElementById('progress_bar').children[5].style.backgroundColor = 'white';
}

function go() {
  init();
}

window.onload = go;
