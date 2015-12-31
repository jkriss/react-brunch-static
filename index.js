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
    // console.log("data:", data, "filename:", filename);
    var page = fm(data);
    // console.log("page:", page);

    var html = this.bodyTemplate({ content : page.body })
    var $ = cheerio.load(html);

    var js = "";

    for (var selector in page.attributes.bindings) {
      var file = page.attributes.bindings[selector];
      var ReactElement = React.createFactory(require(path.resolve(path.join('./app', file))));


      var reactContent = ReactDOM.renderToString(ReactElement());
      $(selector).html(reactContent);
      js += `
        ReactDOM.render(React.createFactory(require('${file.replace(/^\.\//,'')}'))(), document.querySelector('${selector}'));
      `
    }

    // inject bootstrap js
    $('body').append(`<script>${js}</script>`);

    // console.log("new html:\n", $.html());

    callback(null, [
      { filename : this.transformPath(filename), content : $.html()}
    ]
    // TODO track dependency graph, add dependencies here
    )
  }
};

// export a simple function to make it easier to include in brunch-config.coffee
module.exports = function(config) { return new ReactBrunchStatic(config); };
