class Knapsack {
    static int knapsack(int[] wt, int[] val, int cap) {
        int n = wt.length;
        int[][] dp = new int[n + 1][cap + 1];                     // @a kn.init
        for (int i = 1; i <= n; i++) {                            // @a kn.item
            for (int w = 1; w <= cap; w++) {
                dp[i][w] = dp[i - 1][w];                              // @a kn.copy
                if (wt[i - 1] <= w && val[i - 1] + dp[i - 1][w - wt[i - 1]] > dp[i][w]) {   // @a kn.fit
                    dp[i][w] = val[i - 1] + dp[i - 1][w - wt[i - 1]];                       // @a kn.take
                }
            }
        }
        int w = cap;
        for (int i = n; i > 0; i--) {                             // @a kn.trace
            if (dp[i][w] != dp[i - 1][w]) {                       // @a kn.tb
                System.out.println("take item " + i);
                w -= wt[i - 1];                                   // @a kn.step
            }
        }
        return dp[n][cap];                                        // @a kn.ret
    }
}
