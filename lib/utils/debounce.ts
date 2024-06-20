interface OptionsType {
  leading: boolean // 第一次调用函数时，立即执行一次
  maxWait: number
  trailing: boolean // 最后一次调用函数时，额外执行一次
}
interface DebouncedFunc<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
}
export const debounce = <T extends (...args: any) => any>(fn: T, delay: number, options: Partial<OptionsType> = {}): DebouncedFunc<T> => {
  let maxWait = 0
  let lastArgs: any
  let lastThis: any
  let result: any
  let timerId: number | undefined
  let lastCallTime: number | undefined

  let lastInvokeTime = 0
  let leading = false
  let maxing = false
  let trailing = true
  // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
  const useRAF = (!delay && delay !== 0 && typeof window?.requestAnimationFrame === 'function')
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function')
  }
  delay = +delay || 0
  if (Object.prototype.toString.call(options) === '[object Object]') {
    leading = !!options.leading
    maxing = 'maxWait' in options
    maxWait = options?.maxWait ? Math.max(+options.maxWait || 0, delay) : maxWait
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }
  function invokeFunc(time) {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = lastThis = undefined
    lastInvokeTime = time
    result = fn.apply(thisArg, args)
    return result
  }

  function startTimer(pendingFunc, wait) {
    if (useRAF) {
      timerId && window.cancelAnimationFrame(timerId)
      return window.requestAnimationFrame(pendingFunc)
    }
    return setTimeout(pendingFunc, wait)
  }
  function cancelTimer(id) {
    if (useRAF) {
      return window.cancelAnimationFrame(id)
    }
    clearTimeout(id)
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start the timer for the trailing edge.
    timerId = startTimer(timerExpired, delay)
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = delay - timeSinceLastCall

    return maxing
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= delay) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // Restart the timer.
    timerId = startTimer(timerExpired, remainingWait(time))
  }

  function trailingEdge(time) {
    timerId = undefined

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = lastThis = undefined
    return result
  }

  function cancel() {
    if (timerId !== undefined) {
      cancelTimer(timerId)
    }
    lastInvokeTime = 0
    lastArgs = lastCallTime = lastThis = timerId = undefined
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now())
  }

  function pending() {
    return timerId !== undefined
  }
  function _debounce() {
    var time = Date.now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, delay);
    }
    return result;
  }
  _debounce.cancel = cancel;
  _debounce.flush = flush;
  _debounce.pending = pending
  return _debounce;
};
