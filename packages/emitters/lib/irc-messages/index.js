const Ajv = require("ajv");
const irc = require("irc-upd");
const cloneDeep = require("lodash.clonedeep");
const { Observable } = require("rxjs");
const schema = require("./schemas/params.json");

function convertToOptions(params) {
  // Ajv defaults to allErrors: false. This ensures we always have a single
  // error to provide to the subscriber. The validate step is also responsible
  // for assigning default values.
  const validate = new Ajv({
    allErrors: false,
    useDefaults: true,
    jsonPointers: true
  }).compile(schema);

  const paramsClone = cloneDeep(params);

  let options = null;
  let errorMessage = null;

  if (validate(paramsClone)) {
    // Transform the params into an irc.Client options object. The rest params
    // are passed as-is to to irc.Client.
    const {
      dangerousInsecure,
      dangerousAcceptUnauthorized,
      channelPrefixes,
      ...restParams
    } = paramsClone;

    options = {
      ...restParams,
      certExpired: dangerousAcceptUnauthorized,
      channelPrefixes: channelPrefixes.join(""),
      secure: !dangerousInsecure,
      selfSigned: dangerousAcceptUnauthorized,
      // Non-configurable options.
      autoConnect: false,
      messageSplit: 512,
      millisecondsBeforePingTimeout: 8 * 1000,
      millisecondsOfSilenceBeforePingSent: 15 * 1000,
      renickCount: 0,
      retryCount: 0,
      stripColors: true
    };
  } else {
    const error = validate.errors[0];

    errorMessage = `"${error.dataPath}" ${error.message}`;
  }

  return { options, errorMessage };
}

module.exports = ({ params }) => {
  return new Observable.create(subscriber => {
    let bot;

    try {
      const { options, errorMessage } = convertToOptions(params);

      if (errorMessage) {
        subscriber.error(new Error(errorMessage));
        return;
      }

      const { debug, host, nick } = options;

      bot = new irc.Client(host, nick, options);

      // Assign channel-specific message listeners.
      options.channels.forEach(channel => {
        bot.addListener(`message${channel}`, (from, text, message) => {
          if (debug) {
            // log `Received ${message}`
          }

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
          console.error(event, ...args);
          // subscriber.error(...)
        });
      });

      if (debug) {
        // Log additional events in debug mode. The irc.Client is also put into
        // debug mode when this flag is passed.
        ["channellist", "join", "notice", "ping", "registered"].forEach(
          event => {
            bot.addEventListener(event, (...args) => {
              console.log(event, ...args);
            });
          }
        );
      }

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
      port: 6697,
      dangerousAcceptUnauthorized: true
      // Insecure
      // dangerousInsecure: true,
      // port: 6666
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

/*
- TODO
  - update IRC conf to use same host/org/etc defaults as the setup script
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

      // Password is optional. I'm not using it. How to connect when a password
      // is used?


 */
