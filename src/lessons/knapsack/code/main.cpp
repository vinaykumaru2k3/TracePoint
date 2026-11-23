#include <iostream>
#include <vector>
using namespace std;

int knapsack(const vector<int>& wt, const vector<int>& val, int cap) {
    int n = wt.size();
    vector<vector<int>> dp(n + 1, vector<int>(cap + 1, 0));   // @a kn.init
    for (int i = 1; i <= n; i++) {                            // @a kn.item
        for (int w = 1; w <= cap; w++) {
            dp[i][w] = dp[i - 1][w];
            if (wt[i - 1] <= w && val[i - 1] + dp[i - 1][w - wt[i - 1]] > dp[i][w]) {   // @a kn.fit
                dp[i][w] = val[i - 1] + dp[i - 1][w - wt[i - 1]];                       // @a kn.take
            }
        }
    }
    int w = cap;
    for (int i = n; i > 0; i--) {                             // @a kn.trace
        if (dp[i][w] != dp[i - 1][w]) {
            cout << "take item " << i << "\n";
            w -= wt[i - 1];
        }
    }
    return dp[n][cap];                                        // @a kn.ret
}
