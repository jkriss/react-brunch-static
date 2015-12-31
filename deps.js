var required = require('required');

var flatten = function(deps, runningList) {
  var list = runningList || [];
  deps.forEach(function(d) {
    list = flatten(d.deps, list);
    list.push({ id : d.id, filename : d.filename })
  })
  return list;
}

var getDeps = function(path, cb) {
  required(path, function(err, deps) {
    cb(err, flatten(deps))
  });
}
module.exports = getDeps
