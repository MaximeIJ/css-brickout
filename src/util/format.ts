import {GameObject} from '../game';

export function formatObjectTitle(object: GameObject): string {
  return `${object.constructor.name}: ${object.element.id} (${object.x}, ${object.y})

${object.bonuses?.map(bonus => `.${bonus.cssClass}`).join('\n')}`;
}
