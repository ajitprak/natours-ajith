module.exports = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next); // This is same as catch((err) => next(err)) // Since next is with err param express takes it to the global error handeler
}; // Since fn is an async function(below we are passing an async fn) it returns a promise, we can catch any errors with .catch
