export enum Key { Left, Right, Up, Space, A, D, W, F1, F2, F12 }

type KeyStateDictionary = {[key in Key]: boolean};

export class KeyboardState
{
    public keyStates: KeyStateDictionary;

    public constructor() {
        this.keyStates = {
            [Key.Left]: false,
            [Key.Right]: false,
            [Key.Up]: false,
            [Key.Space]: false,
            [Key.A]: false,
            [Key.D]: false,
            [Key.W]: false,
            [Key.F1]: false,
            [Key.F2]: false,
            [Key.F12]: false
        };
    }

    public isKeyDown(key: Key): boolean {
        return this.keyStates[key];
    }

    public clone() {
        let newState = new KeyboardState();
        newState.keyStates = { ...this.keyStates };
        return newState;
    }
}