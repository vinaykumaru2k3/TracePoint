def counting_sort(a):                               # @a cnt.sig
    count = [0] * (max(a) + 1)                      # @a cnt.max
    for v in a:
        count[v] += 1                               # @a cnt.count
    k = 0
    for v in range(len(count)):
        for _ in range(count[v]):
            a[k] = v; k += 1                        # @a cnt.write
    return a                                        # @a cnt.done
