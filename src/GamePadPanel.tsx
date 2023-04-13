import { PanelExtensionContext, SettingsTreeAction } from '@foxglove/studio';
import { useLayoutEffect, useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import produce from 'immer';
import { set } from 'lodash';
import useController from './GamePad';

type panelConfig = {
	limits: {
		x_min: string;
		x_max: string;
		z_min: string;
		z_max: string;
	};
	connection: {
		topic: string;
		controllerX: string;
		controllerY: string;
	};
};

type Axes = [number, number, number?];

function GamePadPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
	const Controller = useRef<useController | null>(null);
	const [renderDone] = useState<(() => void) | undefined>();

	const [axes, setAxes] = useState<Axes>([0, 0]);
	const [arrowRotation, setArrowRotation] = useState(0);
	const [vectorLength, setVectorLength] = useState(0);

	const [message, setMessage] = useState({
		linear: { x: 0, y: 0, z: 0 },
		angular: { x: 0, y: 0, z: 0 },
	});

	const [panelState, setPanel] = useState<panelConfig>(() => {
		const partialState = context.initialState as Partial<panelConfig>;
		return {
			limits: {
				x_min: partialState.limits?.x_min ?? '-0.5',
				x_max: partialState.limits?.x_max ?? '0.5',
				z_min: partialState.limits?.z_min ?? '-1',
				z_max: partialState.limits?.z_max ?? '1',
			},
			connection: {
				topic: partialState.connection?.topic ?? '/cmd_vel',
				controllerX: partialState.connection?.controllerX ?? '1',
				controllerY: partialState.connection?.controllerY ?? '0',
			},
		};
	});

	const actionHandler = useCallback(
		(action: SettingsTreeAction) => {
			if (action.action === 'update') {
				const { path, value } = action.payload;
				setPanel(produce((draft) => set(draft, path, value)));
			}
		},
		[context]
	);

	const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
		return Number((((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin).toFixed(2));
	};

	const { topic: currentTopic } = panelState.connection;

	useLayoutEffect(() => {
		if (!currentTopic) {
			return;
		}
		context.advertise?.(currentTopic, 'geometry_msgs/Twist');

		return () => {
			context.unadvertise?.(currentTopic);
		};
	}, [context, currentTopic]);

	useEffect(() => {
		if (context.dataSourceProfile) {
			Controller.current = new useController(panelState.connection.controllerX, panelState.connection.controllerY);
			Controller.current?.setUpdateCallback((axes) => {
				setAxes(axes);
			});
		}

		return () => {
			Controller.current?.disconnect();
			Controller.current = null;
		};
	}, [context, panelState]);

	useEffect(() => {
		if (Controller.current?.connected) {
			setArrowRotation(Math.atan2(axes[1] ?? 0, axes[0] ?? 0) - Math.PI / 2);
			setVectorLength(mapRange(Math.sqrt((axes[1] ?? 0) ** 2 + (axes[0] ?? 0) ** 2), 0, 1, 0, 18));

			let x = 0
			let z = 0 

			if(axes[0] != 0 || axes[1] != 0) {
				x = mapRange(axes[0] ?? 0, -1, 1, Number(panelState.limits.x_min), Number(panelState.limits.x_max));
				z = mapRange(axes[1] ?? 0, -1, 1, Number(panelState.limits.z_min), Number(panelState.limits.z_max));
			}

			setMessage((prevState) => ({
				...prevState,
				linear: {
					...prevState.linear,
					x: x,
				},
				angular: {
					...prevState.angular,
					z: z,
				},
			}));

			context.publish?.(panelState.connection.topic, message);
		}
	}, [axes, Controller.current?.zeroValuesSet]);

	useEffect(() => {
		renderDone?.();
	}, [renderDone]);

	useEffect(() => {
		context.saveState(panelState);
		context.updatePanelSettingsEditor({
			actionHandler,
			nodes: {
				connection: {
					label: 'Connection',
					//icon: "Shapes",
					fields: {
						topic: {
							label: 'Topic',
							input: 'messagepath',
							value: panelState.connection.topic,
						},
						controllerX: {
							label: 'Controller X',
							input: 'string',
							value: panelState.connection.controllerX,
						},
						controllerY: {
							label: 'Controller Y',
							input: 'string',
							value: panelState.connection.controllerY,
						},
					},
				},
				limits: {
					label: 'Limits',
					//icon: "Shapes",
					fields: {
						x_min: {
							label: 'Linear min',
							input: 'string',
							value: panelState.limits.x_min,
						},
						x_max: {
							label: 'Linear max',
							input: 'string',
							value: panelState.limits.x_max,
						},
						z_min: {
							label: 'Angular min',
							input: 'string',
							value: panelState.limits.z_min,
						},
						z_max: {
							label: 'Angular max',
							input: 'string',
							value: panelState.limits.z_max,
						},
					},
				},
			},
		});
	}, [context, actionHandler, panelState]);

	return (
		<div style={{ margin: '0 auto', width: '150px', padding: '10px', fontFamily: 'monospace' }}>
			{Controller.current?.connected ? (
				<div style={{ width: '150px' }}>
					<span>linear : {message.linear.x}</span>
					<br />
					<span>angular: {message.angular.z}</span>
					<div
						style={{
							position: 'relative',
							width: '150px',
							height: '150px',
						}}
					>
						<svg
							viewBox="0 0 50 50"
							style={{
								width: '100%',
								height: '100%',
								position: 'absolute',
								top: 0,
								left: 0,
							}}
						>
							<circle cx="25" cy="25" r="20" stroke="white" strokeWidth="0.5" fill="transparent" />
							<circle cx="25" cy="25" r="0.5" stroke="white" strokeWidth="0.5" fill="transparent" />
							<line
								x1="25"
								y1="25"
								x2={25 + Math.cos(arrowRotation) * vectorLength}
								y2={25 + Math.sin(arrowRotation) * vectorLength}
								stroke="white"
								strokeWidth="0.5"
								markerEnd="url(#arrow)"
							/>
							<defs>
								<marker
									id="arrow"
									markerWidth="8"
									markerHeight="8"
									refX="4"
									refY="4"
									orient="auto"
									markerUnits="strokeWidth"
								>
									<path d="M0,0 L8,4 L0,8 L4,4 Z" fill={vectorLength > 0 ? 'white' : 'none'} />
								</marker>
							</defs>
						</svg>
					</div>
				</div>
			) : (
				<span>No controller connected</span>
			)}
		</div>
	);
}

export function initGamePadPanel(context: PanelExtensionContext): () => void {
	ReactDOM.render(<GamePadPanel context={context} />, context.panelElement);

	// Return a function to run when the panel is removed
	return () => {
		ReactDOM.unmountComponentAtNode(context.panelElement);
	};
}
