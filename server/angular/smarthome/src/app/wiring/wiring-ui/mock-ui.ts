import type { Collection } from '../wirings/collection';
import { UINode } from './ui-node';

export class MockUiNode extends UINode<Collection> {
  getIcon(): string {
    throw new Error('Method not implemented.');
  }

}
