def edit_distance(a, b):
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]          # @a ed.init
    for i in range(n + 1): dp[i][0] = i                 # @a ed.edgecol
    for j in range(m + 1): dp[0][j] = j                 # @a ed.edgerow
    for i in range(1, n + 1):                           # @a ed.row
        for j in range(1, m + 1):                       # @a ed.col
            if a[i - 1] == b[j - 1]: dp[i][j] = dp[i - 1][j - 1]   # @a ed.match
            else: dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])   # @a ed.min
    edits = []
    i, j = n, m                                         # @a ed.tbstart
    while i > 0 or j > 0:                               # @a ed.trace
        if i > 0 and j > 0 and a[i - 1] == b[j - 1]: edits.insert(0, "keep " + a[i - 1]); i -= 1; j -= 1   # @a ed.tbmatch
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1: edits.insert(0, "replace " + b[j - 1]); i -= 1; j -= 1   # @a ed.tbrep
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1: edits.insert(0, "delete " + a[i - 1]); i -= 1   # @a ed.tbdel
        else: edits.insert(0, "insert " + b[j - 1]); j -= 1   # @a ed.tbins
    print(edits)                                        # @a ed.print
    return dp[n][m]                                     # @a ed.ret
