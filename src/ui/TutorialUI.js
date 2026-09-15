"use strict";

// One-page, menu-only tutorial. Native dialog keeps keyboard focus off the game.
class TutorialUI {
  constructor(game, audio) {
    this.game = game;
    this.audio = audio;
    this.button = document.querySelector('#tutorial-button');
    this.dialog = document.querySelector('#tutorial-dialog');
    this.closeButton = document.querySelector('#tutorial-close');

    this.button.addEventListener('click', () => this.open());
    this.closeButton.addEventListener('click', () => this.close());
    this.dialog.addEventListener('cancel', event => {
      event.preventDefault();
      this.close();
    });
    this.dialog.addEventListener('click', event => {
      if (event.target === this.dialog) this.close();
    });
    this.dialog.addEventListener('keydown', event => event.stopPropagation());
  }

  get isOpen() { return this.dialog.open; }

  showButton(visible) {
    this.button.hidden = !visible;
    if (!visible && this.isOpen) this.close(false);
  }

  open() {
    if (this.isOpen) return;
    this.audio.playSfx('click');
    this.pausedScenes = this.game.scene.getScenes(true).map(scene => scene.sys.settings.key);
    for (const key of this.pausedScenes) this.game.scene.pause(key);
    this.dialog.showModal();
  }

  close(returnFocus = true) {
    if (!this.isOpen) return;
    this.audio.playSfx('click');
    this.dialog.close();
    for (const key of this.pausedScenes || []) {
      if (this.game.scene.isPaused(key)) this.game.scene.resume(key);
    }
    this.pausedScenes = [];
    if (returnFocus && !this.button.hidden) this.button.focus();
  }
}
