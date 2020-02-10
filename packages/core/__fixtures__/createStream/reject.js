module.exports = ({ params }) => Promise.reject(new Error(params.message));
