def fewest_coins(coins, amount):
    INF = amount + 1
    dp = [INF] * (amount + 1)                         # @a coin.init
    dp[0] = 0                                         # @a coin.base
    for a in range(1, amount + 1):                    # @a coin.loop
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:      # @a coin.try
                dp[a] = dp[a - c] + 1                 # @a coin.take
    a = amount
    while a > 0 and dp[amount] < INF:                 # @a coin.trace
        for c in coins:
            if c <= a and dp[a - c] + 1 == dp[a]:
                print("coin", c)
                a -= c
                break
    return dp[amount] if dp[amount] < INF else -1     # @a coin.ret
