module.exports = (arg) => {
  delete arg.value;
  delete arg.params;

  arg.evil = true;
  arg.villian = { level: 99 };

  return Promise.resolve(arg);
};
