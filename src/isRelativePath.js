module.exports = function isRelativePath (str) {
  return !str.match(/^([a-z]+?:\/\/)/)
}
