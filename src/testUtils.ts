interface JestCallbackHelper {
  (cb: any): { future: Promise<void>; handler: () => void };
}

const prepare: JestCallbackHelper = (jestCallback: any) => {
  let releaseLockWhenAllValidationsFinished: any;
  const handler = (...args: any[]): void => {
    const [, done] = args;
    jestCallback(...args);
    if (done) {
      releaseLockWhenAllValidationsFinished();
    }
  };
  const future: Promise<void> = new Promise((resolve) => {
    releaseLockWhenAllValidationsFinished = resolve;
  });
  return { future, handler };
};

export { prepare };
