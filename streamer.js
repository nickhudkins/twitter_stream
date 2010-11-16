var http = require('http'),
    sys  = require('sys'),
    base64 = require('./vendor/base64'),
    faye = require('./vendor/faye-node'),
    url = require('url');

function TweetStream(options) {
  if (! (this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }

  var self = this;
  
  self.settings = {
    
  };

  self.init();
};

TweetStream.prototype.init = function() {
  var self = this;

  self.bayeux = self.createBayeuxServer();
  self.httpServer = self.createHTTPServer();

  self.bayeux.attach(self.httpServer);
  self.httpServer.listen(8000);
  
   sys.log('Server started on PORT 8000');
  
  self.runTweetStreamer();
};

TweetStream.prototype.runTweetStreamer = function() {
    var self = this;
    
    // Command line args
    var USERNAME = "nickhudkins2";
    var PASSWORD = "1q2w3e4r5t6y";

    // Authentication Headers for Twitter
    var auth = base64.encode(USERNAME + ':' + PASSWORD);
    var headers = {
      'Authorization' : "Basic " + auth,
      'Host'          : "stream.twitter.com"
    };
    
    USER_ID = "216411995";
    
    var twitter = http.createClient(80, "stream.twitter.com");
    var request = twitter.request("GET", "/1/statuses/filter.json?follow=" + USER_ID, headers);
    sys.log(auth);
    
    request.addListener('response', function(response) {
        response.setEncoding("utf8");
        response.addListener("data", function(chunk) {

            var tweet = JSON.parse(chunk);
            sys.log(tweet.text);
            self.bayeux.getClient().publish("/tweets", {
                tweet: tweet.text
            });
        });
    });
    request.end();
};

TweetStream.prototype.createBayeuxServer = function() {
  var self = this;
  
  var bayeux = new faye.NodeAdapter({
    mount: '/',
    timeout: 45
  });
  
  return bayeux;
};

TweetStream.prototype.createHTTPServer = function() {
    var self = this;
  
    var server = http.createServer(function(request, response) {
        request.addListener('end', function() {              
            response.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            response.end("OK");
        });
    });

    return server;
};


module.exports = TweetStream;
