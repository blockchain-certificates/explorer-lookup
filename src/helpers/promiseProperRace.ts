// TODO: not tested
/* eslint-disable */ // this file is just a pain in the ass to lint. Be brave.
export default async function PromiseProperRace (promises: Array<Promise<any>>, count: number, results = []): Promise<any> {
  // Source: https://blog.jcore.com/2016/12/18/promise-me-you-wont-use-promise-race/
  promises = Array.from(promises);

  if (promises.length < count) {
    throw new Error('Could not retrieve tx data');
  }

  const indexPromises = promises.map((p, index) => p.then(() => index).catch((err) => {
    // console.error(err);
    throw index;
  }));

  return Promise.race(indexPromises).then((index: number) => {
    const p = promises.splice(index, 1)[0];
    p.then(e => results.push(e));

    if (count === 1) {
      return results;
    }
    return PromiseProperRace(promises, count - 1, results);
  }).catch(index => {
    promises.splice(index, 1);
    return PromiseProperRace(promises, count, results);
  });
}
