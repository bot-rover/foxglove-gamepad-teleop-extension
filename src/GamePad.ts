type Axes = [number, number, number?];

export default class useController {
	public connected!: boolean | false;
	public zeroValuesSet!: boolean | false;

	private axesX: number;
	private axesY: number;
	private gamepad: Gamepad | null | undefined;
	private rAF!: number | 0;
	private onUpdate!: (axes: Axes) => void;

	constructor(axesX: string, axesY: string) {
		this.axesX = Number(axesX);
		this.axesY = Number(axesY);

		if (navigator.getGamepads()[0]) {
			console.log('Gamepads found, connecting');
			this.handleGamepadConnected();
		} else {
			console.log('Gamepads not found, stated listening');
			window.addEventListener('gamepadconnected', this.handleGamepadConnected);
		}

		window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
	}

	public setUpdateCallback(onUpdate: (axes: Axes) => void) {
		this.onUpdate = onUpdate;
	}

	public disconnect() {
		if (this.gamepad) {
			window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
			window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

			window.cancelAnimationFrame(this.rAF);
			this.gamepad = null;
			this.connected = false;
		}
	}

	private handleAxes = () => {
		if (!this.gamepad) {
			return;
		}

		let newAxes: Axes = [0, 0];

		// map axes 
		newAxes[0] = Number(this.gamepad.axes[this.axesY]?.toFixed(3) ?? 0);
		newAxes[1] = Number(this.gamepad.axes[this.axesX]?.toFixed(3) ?? 0);

		// Check if any axes value is non-zero
		if (newAxes.every((value) => value === 0)) {
			// If all axes values are zero, set them to zero only one time
			if (!this.zeroValuesSet) {
				this.onUpdate([0, 0]);
				this.zeroValuesSet = true;
			}
			return;
		} else {
			this.zeroValuesSet = false;
		}

		this.onUpdate(newAxes);
	};

	private handleGamepadConnected = () => {
		this.connected = true;

		const pollAxes = () => {
			this.gamepad = navigator.getGamepads()[0];

			if (this.gamepad) {
				this.handleAxes();
			}
			this.rAF = requestAnimationFrame(pollAxes);
		};
		this.rAF = requestAnimationFrame(pollAxes);
	};

	private handleGamepadDisconnected = (event: GamepadEvent) => {
		if (event.gamepad.mapping === 'standard') {
			this.connected = false;
		}
	};
}
