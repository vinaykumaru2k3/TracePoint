#include <iostream>
#include <vector>
using namespace std;

int fewestCoins(const vector<int>& coins, int amount) {
    int INF = amount + 1;
    vector<int> dp(amount + 1, INF);                      // @a coin.init
    dp[0] = 0;                                            // @a coin.base
    for (int a = 1; a <= amount; a++) {                   // @a coin.loop
        for (int c : coins) {
            if (c <= a && dp[a - c] + 1 < dp[a]) {        // @a coin.try
                dp[a] = dp[a - c] + 1;                    // @a coin.take
            }
        }
    }
    int a = amount;
    while (a > 0 && dp[amount] < INF) {                   // @a coin.trace
        for (int c : coins) {
            if (c <= a && dp[a - c] + 1 == dp[a]) {
                cout << "coin " << c << "\n";
                a -= c;
                break;
            }
        }
    }
    return dp[amount] < INF ? dp[amount] : -1;            // @a coin.ret
}
