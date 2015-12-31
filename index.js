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

var ReactBrunchStatic = function(config) {
  var layout = config.layout ? fs.readFileSync(config.layout, 'utf-8') : '<!doctype html><html><body>{{ content }}</body></html>';
  this.bodyTemplate = Handlebars.compile(layout);
};

ReactBrunchStatic.prototype = {
  handles: /\.static\.jsx$/,
  transformPath: function(filename) {
    return filename.replace(/\.static\.jsx$/, '.html');
  },
  compile: function(data, filename, callback) {
    console.log("data:", data, "filename:", filename);
    var page = fm(data);
    console.log("page:", page);
    var entryFile = path.resolve(page.attributes.entry);
    console.log("entry:", entryFile)

    var ReactRoot = React.createFactory(require(entryFile))
    var content = ReactDOM.renderToString(ReactRoot(page.attributes.props));

    var html = this.bodyTemplate({ content : content })
    console.log("result:", html)
    console.log("watching:", path.relative('./', entryFile))
    // TODO dependencies should include anything included from entry point. hm.
    callback(null, [
      { filename : this.transformPath(filename), content : html }
    ],
    [
      [path.relative('./', entryFile)]
    ])
  }
};

// export a simple function to make it easier to include in brunch-config.coffee
module.exports = function(config) { return new ReactBrunchStatic(config); };
