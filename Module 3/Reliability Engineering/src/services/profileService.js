
const DEFAULT_AVATAR = {
  url: 'https://cdn.aurora-profiles.dev/avatars/default.png',
  initials: '?',
  source: 'fallback',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(error) {
  if (!error) {
    return false;
  }

  // Timeout or aborted request
  if (error.name === 'AbortError') {
    return true;
  }

  // Check common HTTP status locations
  const status =
    error.status ??
    error.statusCode ??
    error.response?.status;

  // Network error: no HTTP status
  if (status == null) {
    return true;
  }

  // Retry rate limits
  if (status === 429) {
    return true;
  }

  // Retry server errors (500–599)
  if (status >= 500 && status <= 599) {
    return true;
  }

  // Do not retry other errors, including 400
  return false;
}

async function withTimeout(operation, timeoutMs) {
  const controller = new AbortController();
  let timer;

  try {
    const timeoutPromise = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error('Operation timed out');
        error.name = 'AbortError';

        controller.abort();
        reject(error);
      }, timeoutMs);
    });

    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const lastAttempt = attempt === maxAttempts - 1;

      if (lastAttempt || !isRetryable(error)) {
        throw error;
      }

      await sleep(baseDelayMs * 2 ** attempt);
    }
  }

  throw new Error('Operation failed');
}

async function getProfileWithAvatar(authorId, avatarClient, options = {}) {
  const timeoutMs = options.timeoutMs ?? 200;
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  try {
    const avatar = await withRetry(
      () =>
        withTimeout(
          signal => avatarClient.getAvatar(authorId, { signal }),
          timeoutMs
        ),
      { maxAttempts, baseDelayMs }
    );

    return {
      authorId,
      avatar,
      degraded: false,
    };
  } catch (error) {
    return {
      authorId,
      avatar: DEFAULT_AVATAR,
      degraded: true,
    };
  }
}

module.exports = {
  DEFAULT_AVATAR,
  sleep,
  isRetryable,
  withTimeout,
  withRetry,
  getProfileWithAvatar,
};
