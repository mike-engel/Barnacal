# Barnacal
> A simple menu bar app for viewing a calendar

# Installation

WIP

# Developing

This a Node.js project at heart, so begin by installing the npm dependencies (npm 5 preferred).

```sh
npm i
```

To start `bsb` and `webpack` at the same time, run `npm start` in a terminal window. This will automatically watch and compile changes to your reason files and hot reload them into the electron app.

```sh
npm start
```

Finally, open a new terminal window/tab and start the electron process. This will launch the app and you can begin using it.

```sh
# option one w/ npm 5
npx electron .

# option two
npm run start:electron
```

If you want the electron app to be reloaded when you edit the html or JS files, then you'll want to install `watchexec` first, then run the watch command.

```sh
# install watchexec if you don't have it already
brew install watchexec

npm run watch:electron
```

# License

Unlicensed, for now.
