def max_intervals(iv):
    # Each interval is (start, end). sorted() is stable, so equal ends keep input order.
    iv = sorted(iv, key=lambda x: x[1])            # @a greedy.sort
    last_end = 0                                   # @a greedy.init
    count = 0                                      # @a greedy.init
    for s, e in iv:                                # @a greedy.loop
        if s >= last_end:                          # @a greedy.cmp
            count += 1                             # @a greedy.take
            last_end = e                           # @a greedy.last
    return count                                   # @a greedy.ret
