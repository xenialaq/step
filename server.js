const Hapi = require('@hapi/hapi');
const chance = require('chance').Chance();

let userBalance = chance.pickone([500]);
let userCode = chance.pickone([1234]);

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: '0.0.0.0',
  });

  server.route({
    method: 'GET',
    path: '/getUser',
    handler: (request, h) => h.response({
      code: userCode,
      balance: userBalance,
    }),
  });

  server.route({
    method: 'POST',
    path: '/getCode',
    handler: async (request, h) => {
      const { payload: { amount } } = request;

      await new Promise((r) => setTimeout(r, 1e3));
      // update and check balance, compute new code or error response
      if (chance.integer({ min: 1, max: 5 }) === 1) {
        // flaky 20% of time
        return h.abandon;
      }
      let error = null;
      let statusCode = 200;
      if (!Number.isFinite(amount) || amount <= 0) {
        error = 'Invalid request';
        statusCode = 400;
      } else if (userBalance < amount) {
        error = 'Not enough money';
        statusCode = 400;
      } else {
        userBalance -= amount;
        userCode = chance.integer({ min: 1000, max: 9999 });
      }
      await new Promise((r) => setTimeout(r, 1e3));
      // return the response
      return h.response(error ? { error } : {
        code: userCode,
        balance: userBalance,
      }).code(statusCode);
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
