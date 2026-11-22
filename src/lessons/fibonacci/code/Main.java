import java.util.*;

class Fibonacci {
    static int fibonacci(int n) {
        int[] memo = new int[n + 1];
        Arrays.fill(memo, -1);                            // @a fib.init
        return fib(n, memo);
    }

    static int fib(int k, int[] memo) {                   // @a fib.sig
        if (k < 2) return memo[k] = k;                    // @a fib.base
        if (memo[k] != -1) return memo[k];                // @a fib.hit
        memo[k] = fib(k - 1, memo) + fib(k - 2, memo);    // @a fib.store
        return memo[k];                                   // @a fib.ret
    }
}
