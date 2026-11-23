#include <vector>
using namespace std;

int fib(int k, vector<int>& memo) {                       // @a fib.sig
    if (k < 2) return memo[k] = k;                        // @a fib.base
    if (memo[k] != -1) return memo[k];                    // @a fib.hit
    memo[k] = fib(k - 1, memo) + fib(k - 2, memo);        // @a fib.store
    return memo[k];                                       // @a fib.ret
}

int fibonacci(int n) {
    vector<int> memo(n + 1, -1);                          // @a fib.init
    return fib(n, memo);
}
