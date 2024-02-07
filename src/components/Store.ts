import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { map } from 'nanostores';

export const $ExcalirawApi = map<Record<number, ExcalidrawImperativeAPI>>({});

// export function setExcalirawApi(api: ExcalidrawImperativeAPI | null) {
//   $ExcalirawApi.set(api);
// }

export const $ExcalidrawElements = map<Record<number, ExcalidrawElement[]>>({});

// export function setExcalidrawElements(el: ExcalidrawElement[]) {
//   $ExcalidrawElements.set(el);
// }

export const $ExcalirawPanelEdit = map<Record<number, boolean>>({});
