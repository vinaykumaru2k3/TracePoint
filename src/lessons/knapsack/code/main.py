def knapsack(wt, val, cap):
    n = len(wt)
    dp = [[0] * (cap + 1) for _ in range(n + 1)]        # @a kn.init
    for i in range(1, n + 1):                           # @a kn.item
        for w in range(1, cap + 1):
            dp[i][w] = dp[i - 1][w]
            if wt[i - 1] <= w and val[i - 1] + dp[i - 1][w - wt[i - 1]] > dp[i][w]:   # @a kn.fit
                dp[i][w] = val[i - 1] + dp[i - 1][w - wt[i - 1]]                      # @a kn.take
    w = cap
    for i in range(n, 0, -1):                           # @a kn.trace
        if dp[i][w] != dp[i - 1][w]:
            print("take item", i)
            w -= wt[i - 1]
    return dp[n][cap]                                   # @a kn.ret
