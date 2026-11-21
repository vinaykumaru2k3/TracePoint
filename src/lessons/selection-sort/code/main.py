def selection_sort(a):                              # @a sl.sig
    n = len(a)
    for i in range(n - 1):
        m = i                                       # @a sl.outer
        for j in range(i + 1, n):
            if a[j] < a[m]:                         # @a sl.cmp
                m = j                               # @a sl.min
        if m != i: a[i], a[m] = a[m], a[i]          # @a sl.swap
    return a
