const path = require("path");
const chalk = require("chalk");
const { spawn, exec } = require("child_process");
const EventEmitter = require("events");
const figlet = require("figlet");

const PORT = 8080;
class CompileEmitter extends EventEmitter {}
const compileEmitter = new CompileEmitter();
const executionProgram = "npm";

const bsb = spawn(`${executionProgram}`, ["run", "start:bsb"]);
const webpack = spawn(`${executionProgram}`, ["run", "start:webpack"]);

const compileStatus = {
  bsb: {
    status: "success",
    msg: "OK"
  },
  webpack: {
    status: "success",
    msg: "OK"
  }
};

function clearConsole() {
  process.stdout.write(
    process.platform === "win32" ? "\x1Bc" : "\x1B[2J\x1B[3J\x1B[H"
  );
}

function handleBsbPipe(data) {
  const str = data.toString();
  if (str.includes("We've found a bug for you") || str.includes("Warning")) {
    compileStatus.bsb = {
      status: "error",
      msg: str
    };
  } else if (
    (str.includes(">>>> Finish compiling") &&
      !str.includes("ninja: build stopped: subcommand failed.")) ||
    str.includes("no work to do")
  ) {
    compileStatus.bsb = {
      status: "success",
      msg: "OK"
    };
  } else {
    if (str.includes("watching")) {
      return;
    }
    compileStatus.bsb = {
      status: "compiling",
      msg: "OK"
    };
  }
  compileEmitter.emit("log");
}

clearConsole();

process.stdout.write(chalk.cyan("Hang tight! Starting your app..."));

bsb.stdout.on("data", data => {
  handleBsbPipe(data);
});

bsb.stderr.on("data", data => {
  handleBsbPipe(data);
});

webpack.stdout.on("data", data => {
  const str = data.toString();
  console.log(str);
  if (str.includes("ERROR")) {
    compileStatus.webpack = {
      status: "error",
      msg: str
    };
  } else if (str.includes("webpack: Compiled successfully")) {
    compileStatus.webpack = { status: "success", msg: "OK" };
  } else {
    if (str.includes("webpack: Failed to compile")) {
      return;
    }
    compileStatus.webpack = { status: "compiling", msg: "OK" };
  }
  compileEmitter.emit("log");
});

webpack.stderr.on("data", data => {
  console.error(data.toString());
  process.exit(1);
});

compileEmitter.on("log", () => {
  figlet("Barnacal", { font: "Slant" }, (err, data) => {
    clearConsole();
    process.stdout.write(chalk.cyan(data));
    process.stdout.write("\n\n");
    const { bsb, webpack } = compileStatus;
    process.stdout.write(chalk.yellow("[BUCKLESCRIPT]"));
    process.stdout.write("\n");
    if (bsb.status === "error") {
      process.stdout.write(chalk.red("Compilation Error"));
      process.stdout.write("\n\n");
      process.stdout.write(bsb.msg);
    } else if (bsb.status === "compiling") {
      process.stdout.write(chalk.yellow("Compiling..."));
    } else {
      process.stdout.write(chalk.green("Compilation Success"));
    }

    process.stdout.write("\n\n");

    process.stdout.write(chalk.yellow("[WEBPACK]"));
    process.stdout.write("\n");
    if (webpack.status === "error") {
      process.stdout.write(chalk.red("Compilation Error"));
      process.stdout.write("\n\n");
      process.stdout.write(webpack.msg);
    } else if (webpack.status === "compiling") {
      process.stdout.write(chalk.yellow("Compiling..."));
    } else {
      process.stdout.write(chalk.green("Compilation Success"));
      process.stdout.write("\n\n");
    }
  });
});
