def lcs(a, b):
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]          # @a lc.init
    for i in range(1, n + 1):                           # @a lc.row
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]: dp[i][j] = dp[i - 1][j - 1] + 1   # @a lc.match
            else: dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])           # @a lc.max
    out = ""
    i, j = n, m
    while i > 0 and j > 0:                              # @a lc.trace
        if a[i - 1] == b[j - 1]: out = a[i - 1] + out; i -= 1; j -= 1   # @a lc.tbmatch
        elif dp[i - 1][j] >= dp[i][j - 1]: i -= 1       # @a lc.tbup
        else: j -= 1                                    # @a lc.tbleft
    print(out)
    return dp[n][m]                                     # @a lc.ret
