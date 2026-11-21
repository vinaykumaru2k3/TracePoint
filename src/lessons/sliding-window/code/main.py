def max_sum(a, k):                             # @a sw.sig
    s = 0
    for i in range(k): s += a[i]               # @a sw.first
    best = s
    for i in range(k, len(a)):
        s += a[i] - a[i - k]                   # @a sw.slide
        best = max(best, s)                    # @a sw.best
    return best                                # @a sw.return
