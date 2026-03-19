module.exports = function isRelativePath (str) {
  return !str.match(/^(\/|https?:\/\/)/)
}
