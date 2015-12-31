// process.env.BABEL_DISABLE_CACHE=1
require('babel-register')({
  only: /app/,
  presets: ['es2015', 'react']
});
global.React = require('react');
// console.log("react:", require('/Users/jkriss/Documents/brunch-pure-static/app/react-main'))
var Handlebars = require('handlebars');
var fs = require('fs');
var ReactDOM = require('react-dom/server');
var fm = require('front-matter');
var path = require('path');
var cheerio = require('cheerio');
var getDeps = require('./deps');

var staticPattern = /\.static\.jsx$/

var ReactBrunchStatic = function(config) {
  var layout = config.layout ? fs.readFileSync(config.layout, 'utf-8') : '<!doctype html><html><body>{{ content }}</body></html>';
  this.bodyTemplate = Handlebars.compile(layout);
};

ReactBrunchStatic.prototype = {
  // TODO make this a function so that we can track dependencies that don't match the pattern
  // the brunch static thing will only work if the handles pattern matches first

  // FIXME yeah, not sure there's a good way to watch the dependencies, since they're
  // handled by another processor. it's not that huge of a deal – it just means that
  // the client side one overrides the server side one until there's a clean build

  // handles: /(\.static)?\.jsx?$/,
  handles: /\.static\.jsx$/,

  transformPath: function(filename) {
    return filename.replace(/\.static\.jsx$/, '.html');
  },
  compile: function(data, filename, callback) {
    // console.log("handling static jsx for", filename);
    // if (!filename.match(staticPattern)) {
    //   console.log("not a root static template, ignoring")
    //   return callback("pthbbt")
    // }
    // console.log("data:", data, "filename:", filename);
    var page = fm(data);
    // console.log("page:", page);

    var html = this.bodyTemplate({ content : page.body })
    var $ = cheerio.load(html);

    var js = "";

    for (var selector in page.attributes.bindings) {
      var file = page.attributes.bindings[selector];
      var requirePath = path.resolve(path.join('./app', file));
      var ReactElement = React.createFactory(require(requirePath));

      if (!requirePath.match(/\.js$/)) requirePath+='.js';

      var reactContent = ReactDOM.renderToString(ReactElement());
      $(selector).html(reactContent);
      js += `
        ReactDOM.render(React.createFactory(require('${file.replace(/^\.\//,'')}'))(), document.querySelector('${selector}'));
      `
    }

    // inject bootstrap js
    $('body').append(`<script>${js}</script>`);

    // console.log("new html:\n", $.html());
    var _this = this;

    getDeps(requirePath, function(err, deps) {
      // console.log("flattened deps:\n", deps);
      var depFiles = deps.map(function(d) { return path.relative('./', d.filename) });
      console.log("dep files:", depFiles)
      callback(null, [
          { filename : _this.transformPath(filename), content : $.html()}
        ],
        depFiles // these are getting recorded, but aren't getting watched
      )
    })

  }
};

// export a simple function to make it easier to include in brunch-config.coffee
module.exports = function(config) { return new ReactBrunchStatic(config); };
