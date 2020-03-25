const { race, fromEvent, merge, Observable, throwError } = require("rxjs");
const { filter, first, map, switchMap, takeUntil } = require("rxjs/operators");
const SECRET = require("./SECRET");

// Subprocess -> Master message types.
const ERROR = "error";
const NEXT = "next";

// Master -> Subprocess message types.
const SETUP = "setup";

// The subprocess exit with this code when its observable completes.
const GRACEFUL_EXIT = 0;

function forkObservable(options, ioc = {}) {
  const fork =
    (process.env.NODE_ENV === "test" && ioc.fork) ||
    require("child_process").fork;

  return new Observable((observer) => {
    let subscriber;
    let subprocess;

    try {
      subprocess = fork(__filename, [SECRET], options.options);

      const messages$ = fromEvent(subprocess, "message", (event) => event);
      const errors$ = fromEvent(subprocess, "error", (event) => event);
      const exits$ = fromEvent(subprocess, "exit", (event) => event);

      const nexts$ = messages$.pipe(
        filter((message) => message.type === NEXT),
        map((message) => message.data)
      );

      const observableErrors$ = messages$.pipe(
        filter((message) => message.type === ERROR),
        map((message) => new Error(message.data.message))
      );

      const unexpectedExitErrors$ = exits$.pipe(
        filter((code) => code !== GRACEFUL_EXIT),
        map((code) => new Error(`Error: Fatal error in process, code: ${code}`))
      );

      // Error events received from node, errors caught from the factory's
      // observable, and subprocess exits with a code != 0.
      const thrownErrors$ = merge(
        errors$,
        observableErrors$,
        unexpectedExitErrors$
      ).pipe(switchMap((error) => throwError(error)));

      // Race thrown errors and exits, in this order, so that a non-graceful
      // exit results in a thrown error.
      const terminates$ = race(thrownErrors$, exits$);

      subscriber = merge(nexts$, thrownErrors$)
        .pipe(takeUntil(terminates$))
        .subscribe(observer);

      subprocess.send({
        type: SETUP,
        data: {
          args: options.args || [],
          factory: options.factory,
        },
      });
    } catch (error) {
      observer.error(error);
    }

    return function unsubscribe() {
      if (subprocess.connected) {
        // The subprocess is already disconnected if it exited unexpectedly
        // or completed gracefully before the master observable.
        subprocess.disconnect();
      }

      if (subscriber) {
        // The subscriber must be stopped when the master's observable
        // completes before the subprocess' observable.
        subscriber.unsubscribe();
      }
    };
  });
}

function createWorker() {
  const setup$ = fromEvent(process, "message", (event) => event).pipe(
    filter((message) => message.type === SETUP),
    first()
  );

  setup$
    .pipe(
      switchMap((message) =>
        require(message.data.factory)(...message.data.args)
      ),
      takeUntil(fromEvent(process, "disconnect"))
    )
    .subscribe(
      (value) => {
        process.send({ type: NEXT, data: value });
      },
      (error) => {
        const err = error || new Error("Unknown error in subprocess");

        // The master observable will disconnect from the subprocess after
        // responding to the error message.
        process.send({
          type: ERROR,
          data: {
            message: `${err.name}: ${err.message}`,
            stack: error.stack,
          },
        });
      },
      () => {
        // The subprocess will be connected when the subprocess' observable
        // completes before the master's observable.
        if (process.connected) {
          process.exit(GRACEFUL_EXIT);
        }
      }
    );
}

module.exports = forkObservable;

exports.createWorker = createWorker;

if (require("process").argv[2] === SECRET) {
  try {
    createWorker();
  } catch (error) {
    // This exit with error code is not covered by a unit test.
    // console.error(`Worker with pid ${process.pid}: error`, error);
    process.exit(1);
  }
}
