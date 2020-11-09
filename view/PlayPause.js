export default class PlayPause {
  constructor() {
    this.PlayBtn = document.createElement('BUTTON');
    this.PlayBtn.style.width = '40px';
    this.PlayBtn.style.height = '40px';
    this.playPauseImage = document.createElement('img');
    this.playPauseImage.src = '../icons/pause.png';
    this.playPauseImage.style.width = '100%';
    this.PlayBtn.appendChild(this.playPauseImage);
    this.Lecture();
    this.pauseProcess = () => {
      if (this.pause) {
        this.Lecture();
      } else {
        this.Pause();
      }
    };
    document.getElementById('play_pause').appendChild(this.PlayBtn);

    this.stepButton = document.createElement('BUTTON');
    this.stepButton.style.width = '40px';
    this.stepButton.style.height = '40px';
    const stepImage = document.createElement('img');
    stepImage.src = '../icons/step.png';
    stepImage.style.width = '100%';
    this.stepButton.appendChild(stepImage);
    document.getElementById('play_pause').appendChild(this.stepButton);
  }

  Step() {
    this.Pause();
    this.OneStep = true;
  }

  Pause() {
    this.pause = true;
    // this.PlayBtn.innerHTML = 'Lecture';
    this.playPauseImage.src = '../icons/play.png';
  }

  Lecture() {
    this.pause = false;
    // this.PlayBtn.innerHTML = 'Pause';
    this.playPauseImage.src = '../icons/pause.png';
  }
}
