export enum Key { Left, Right, Space, A, D, W }

type KeyStateDictionary = {[key in Key]: boolean};

export class KeyboardState
{
    public keyStates: KeyStateDictionary;

    public constructor() {
        this.keyStates = {
            [Key.Left]: false,
            [Key.Right]: false,
            [Key.Space]: false,
            [Key.A]: false,
            [Key.D]: false,
            [Key.W]: false
        };
    }

    public isKeyDown(key: Key): boolean {
        return this.keyStates[key];
    }
}