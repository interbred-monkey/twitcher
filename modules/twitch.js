var _       = require('underscore'),
    irc     = require('twitch-irc'),
    request = require('request'),
    async   = require('async'),
    config  = require('./config/config.json');

var twitch = function() {

  var opts = {
    options: {
      debug: false,
      debugIgnore: ['ping', 'chat', 'action']
    },
    identity: {
      username: config.username,
      password: config.password,
      client_id: config.clientId,
      secret: config.secret
    },
    channels: config.channels
  }

  this.client = new irc.client(opts);

  this.client.connect();

  // add listeners for chat etc
  this.addDebugListeners();

  // start polling for channel stats
  this.startStatPolling();

}

twitch.prototype = {
  client: null,
  stats_callback: null
}

twitch.prototype.setup = function(callback) {

  var listeners = ['join', 'chat', 'part'],
      _instance  = this;

  for (var l in listeners) {

    (function(evt) {

      _instance.client.addListener(evt, function(channel, user, message) {

        var ob = {
          type: evt,
          data: {
            channel: channel,
            user: user,
            message: message
          }
        }

        return callback(ob);

      })

    })(listeners[l])

  }

}

twitch.prototype.sendMessage = function(params) {

  if (!_.isObject(params) || !_.isString(params.channel) || _.isEmpty(params.channel)
      || !_.isString(params.message) || _.isEmpty(params.message)) {

    return {error: "Invalid parameters supplied, a channel and message must be supplied", data: JSON.stringify(params, null, 2)};

  }

  this.client.say(params.channel, params.message);

  return null;

}

twitch.prototype.addDebugListeners = function() {

  this.client.addListener('connected', function(address, port) {

    console.log('Connected to the twitch server https://' + address + ":" + port);

  })

  this.client.addListener('connectfail', function() {

    console.log('Failed to connect to twitch server');

  })

  this.client.addListener('crash', function(message, stack) {

    console.log('Twitch encountered a crash:');
    console.log(message);
    console.log(stack);

  })

}

twitch.prototype.startStatPolling = function() {

  var _instance = this;

  // add in polling for stats
  async.forever(function(next) {

    // for each channel
    for (var cc in config.channels) {

      (function(index) {

        if (_.isFunction(config.channels[index])) {

          return;

        }

        _instance.channelStats(config.channels[index], function(err, data) {

          var ob = {
            channel: config.channels[index],
            data: data,
            error: err
          }

          if (_.isFunction(_instance.stats_callback)) {

            _instance.stats_callback(ob);

          }

        }) // end channelStats

      })(cc) // end sef

    } // end for

    setTimeout(function() {
      return next(null);
    }, 20000)

  },
  function(err) {

    // not gonna get here for now
    console.log(err);

  })

}

twitch.prototype.channelStats = function(channel, callback) {

  if (!_.isString(channel) || _.isEmpty(channel)) {

    return callback("Invalid parameters supplied, a channel must be supplied");

  }

  var opts = {
    method: "GET",
    url: "https://api.twitch.tv/kraken/streams/" + channel,
    headers: {
      Accept: "application/vnd.twitchtv.v3+json"
    }
  }

  request(opts, function(e, r, b) {

    if (e) {

      console.log("Request encountered an error:");
      console.log(e);
      console.log("Request params:");
      console.log(JSON.stringify(opts, null, 2));

      return callback("Request encountered an error");

    }

    if (!_.isObject(r) || _.isUndefined(r.statusCode)) {

      console.log("Unknown request error");

      return callback("Unknown request error");

    }

    if (r.statusCode !== 200) {

      console.log("Server responded with a none 200 error");
      console.log("StatusCode: " + r.statusCode);
      console.log("Request body:");
      console.log(b);

      return callback("Server responded with a none 200 error", b);

    }

    try {

      b = JSON.parse(b);

    }

    catch(e) {

      return callback("Invalid JSON response", b);

    }

    // make a summary
    var ob = {
      status: "Offline",
      viewers: 0,
      delay: 0,
      views: 0,
      followers: 0
    }

    // if the stream is offline then just return our summary ob
    if (!_.isObject(b) || _.isNull(b.stream)) {

      return callback(null, ob);

    }

    // we are online, get us some stats
    ob.status = "Online";
    ob.viewers = b.stream.viewers;

    if (_.isObject(b.stream.channel)) {

      ob.delay = b.stream.channel.delay;
      ob.views = b.stream.channel.views;
      ob.followers = b.stream.channel.followers;

    }

    return callback(null, ob);

  })

}

module.exports = new twitch();