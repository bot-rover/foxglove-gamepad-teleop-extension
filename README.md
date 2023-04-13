# Gamepad Teleop Foxglove Extension

Extension allows you to control robot via any supported gamepad by [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API). It also visualises sent commands with direction arrow and speed value

## Connection

- Connect your controller to PC via Bluetooth or USB 
- Open Foxglove Studio and add `Gamepad Teleop` panel from list
  
## Configuration

  - Topic - ROS topic to publish `geometry_msgs/Twist` messages
  - Controller X - index of your controller X axes
  - Controller Y - index of your controller Y axes
  - Linear min - min value for `linear.x` in m/s
  - Linear max - max value for `linear.x` in m/s
  - Angular min - min value for `angular.z` in rad/s
  - Angular max - min value for `angular.z` in rad/s
  
  _You can find your controller axes indexes and test it via [Gamepad Tester](https://gamepad-tester.com/)_

## Develop

Make sure you have  [Node.js](https://nodejs.org/)  14 or newer installed and the  [yarn](https://yarnpkg.com/)  package manager (`npm install -g yarn`). To install all packages for this extension run: 

```sh

yarn install

```

To build and install the extension into your local Foxglove Studio desktop app, run:

```sh

yarn local-install

```

Open the `Foxglove Studio` desktop (or `ctrl-R` to refresh if it is already open). Your extension is installed and available within the app.

## Package

Extensions are packaged into `.foxe` files. These files contain the metadata (package.json) and the build code for the extension.

Before packaging, make sure to set `name`, `publisher`, `version`, and `description` fields in _package.json_. When ready to distribute the extension, run:

```sh

yarn package

```

This command will package the extension into a `.foxe` file in the local directory.

## Publish

You can publish the extension for the public marketplace or privately for your organization.

See documentation here: https://foxglove.dev/docs/studio/extensions/publish#packaging-your-extension