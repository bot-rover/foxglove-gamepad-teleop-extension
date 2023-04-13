import { ExtensionContext } from "@foxglove/studio";
import { initGamePadPanel } from "./GamePadPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "Gamepad Teleop", initPanel: initGamePadPanel });
}
