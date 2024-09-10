import {GameObject} from '../game';

export function formatObjectTitle(object: GameObject): string {
  return `${object.toString()}

${object.bonuses?.map(bonus => `.${bonus.cssClass}`).join('\n')}`;
}

export function msToString(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;
  const timeStr = `${padZero(minutes)}:${padZero(secondsLeft)}`;
  return timeStr;
}

function padZero(num: number): string {
  return num < 10 ? num.toString().padStart(2, '0') : num.toString();
}
