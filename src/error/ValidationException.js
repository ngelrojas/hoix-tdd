module.exports = function ValidationException(error) {
  this.status = 400;
  this.errors = error;
};
