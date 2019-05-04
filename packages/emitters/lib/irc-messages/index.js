// Does not have selfSigned cert support necessary for dev server.
// const { Client } = require("irc-framework");
const Ajv = require("ajv");
const irc = require("irc-upd");
const { Observable } = require("rxjs");
const schema = require("./schemas/params.json");
/*
- TODO
  - connect, nick, join channel(s), then listen for messages
  - add lots of logging, this means passing the logger as context. Maybe a verbose flag as context too.
  - password
  - nick, userName, and realname maximum lengths aren't enforced since it can change per server <= 9 is generally okay. No enforcement, other than a min length, is specified.
  - What's the difference in nick, userName, realName? I see in /whois
    - give them default values.
  - join channels, subscribe to only those messages
  - disable retyCount. Error this observable and rely on stream instead.
  - test stripping some colors
  - assert required args
- error handling
  - kicked
  - channel does not exist
  - nick in use (renick)
- What is the default secure IRC port?

// TODO - fail if nick or server missing
// TODO - fail if username has a space in it
// channels must have length


 */

const internalOptions = {
  autoConnect: false,
  stripColors: true,
  debug: false,
  messageSplit: 512,
  retryCount: 0,
  renickCount: 0,
  millisecondsOfSilenceBeforePingSent: 15 * 1000,
  millisecondsBeforePingTimeout: 8 * 1000
};

let validate;

module.exports = ({ params }) => {
  return new Observable.create(subscriber => {
    if (!validate) {
      validate = new Ajv({
        useDefaults: true,
        jsonPointers: true
      }).compile(schema);
    }

    const paramsWithDefaults = { ...params };

    if (!validate(paramsWithDefaults)) {
      // Ajv defaults to allErrors: false. This ensures we always have a single
      // error to provide to the subscriber.
      subscriber.error(new Error(validate.errors[0].message));
    }

    const { host, nick, ...config } = params;

    const {
      dangerousInsecure,
      dangerousAcceptUnauthorized,
      channelPrefixes,
      ...externalOptions
    } = paramsWithDefaults;

    const options = {
      certExpired: dangerousAcceptUnauthorized,
      channelPrefixes: channelPrefixes.join(""),
      secure: !dangerousInsecure,
      selfSigned: dangerousAcceptUnauthorized,
      ...externalOptions,
      ...internalOptions
    };

    let bot;

    try {
      bot = new irc.Client(host, nick, options);

      // Assign channel-specific message listeners.
      options.channels.forEach(channel => {
        bot.addListener(`message${channel}`, (from, text, message) => {
          subscriber.next({
            channel,
            from,
            text
          });
        });
      });

      // Assign fatal event listeners.
      ["error", "kick", "kill", "netError", "quit"].forEach(event => {
        bot.addListener(event, (...args) => {
          console.error();
        });
      });

      // if (verbose) {
      // // join, registered
      // }
      // const events = [
      //   // "action",
      //   // "channellist",
      //   "error",
      //   "join",
      //   // "kick",
      //   // "kill",
      //   // "message#",
      //   // "netError",
      //   // "notice",
      //   // "ping",
      //   // "quit",
      //   "registered"
      //   // "whois"
      // ];

      // events.forEach(event => {
      //   bot.addListener(event, (...args) => {
      //     console.log(event, ...args);
      //   });
      // });

      // Password is optional. I'm not using it. How to connect when a password
      // is used?

      bot.connect();
    } catch (error) {
      subscriber.error(error);
    }

    return function() {
      console.log("Dispose!");
      if (bot) {
        bot.removeAllListeners();
      }
    };
  });
};

const subscriber = module
  .exports({
    params: {
      nick: "botman",
      host: "localhost",
      channels: ["#announce"],
      // Secure + support for dev self signed cert
      // port: 6697,
      // dangerousAcceptUnauthorized: true,
      // Insecure
      dangerousInsecure: true,
      port: 6666
    }
  })
  .subscribe(
    message => {
      console.log("Subscriber", message);
    },
    error => {
      console.error(error);
    },
    () => {
      console.log("Complete");
    }
  );

// subscriber.unsubscribe();
