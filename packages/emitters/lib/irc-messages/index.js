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

module.exports = ({ params }) => {
  const { host, nick, ...config } = params;

  const ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    jsonPointers: true
  });
  const validate = ajv.compile(schema);
  const paramsWithDefaults = { ...params };

  validate(paramsWithDefaults);

  const {
    dangerousCertExpired,
    dangerousInsecure,
    dangerousSelfSigned,
    ...externalOptions
  } = paramsWithDefaults;

  const options = {
    certExpired: dangerousCertExpired,
    secure: !dangerousInsecure,
    selfSigned: dangerousSelfSigned,
    ...externalOptions,
    ...internalOptions
  };

  return new Observable.create(subscriber => {
    let bot;

    try {
      bot = new irc.Client(host, nick, options);

      bot.addListener("message", function(from, to, message) {
        console.log("%s => %s: %s", from, to, message);
        subscriber.next(message);
      });

      // Listen for "${event}#${channel}"!
      const events = [
        "action",
        "channellist",
        "error",
        "join",
        "kick",
        "kill",
        "message#",
        "netError",
        "notice",
        "ping",
        "quit",
        "registered",
        "whois"
      ];

      // events.forEach(event => {
      //   bot.addListener(event, (...args) => {
      //     console.log(event, ...args);
      //   });
      // });

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
      host: "localhost",
      port: 6667,
      dangerousSelfSigned: true,
      nick: "botman"
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
