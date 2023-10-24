module.exports = function EmailException(message) {
  this.message = message;
  this.name = 'EmailException';
};
