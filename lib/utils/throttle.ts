import { debounce } from './debounce'
interface OptionsType {
  leading: boolean // 第一次调用函数时，立即执行一次
  trailing: boolean // 最后一次调用函数时，额外执行一次
}
interface DebouncedFunc<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
}
export const throttle = <T extends (...args: any) => any>(fn: T, delay: number, options: Partial<OptionsType>): DebouncedFunc<T> => {
  let leading = true
  let trailing = true

  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function')
  }
  if (Object.prototype.toString.call(options) === '[object Object]') {
    leading = 'leading' in options ? !!options.leading : leading
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }
  return debounce(fn, delay, {
    leading,
    trailing,
    maxWait: delay
  })
}
