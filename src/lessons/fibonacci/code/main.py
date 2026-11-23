def fibonacci(n):
    memo = [-1] * (n + 1)                         # @a fib.init
    return fib(n, memo)

def fib(k, memo):                                 # @a fib.sig
    if k < 2:
        memo[k] = k
        return k                                  # @a fib.base
    if memo[k] != -1:
        return memo[k]                            # @a fib.hit
    memo[k] = fib(k - 1, memo) + fib(k - 2, memo) # @a fib.store
    return memo[k]                                # @a fib.ret
