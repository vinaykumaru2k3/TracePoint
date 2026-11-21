def bubble_sort(a):                                 # @a bb.sig
    n = len(a)
    for i in range(n - 1):                          # @a bb.pass
        swapped = False
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]:                     # @a bb.cmp
                a[j], a[j + 1] = a[j + 1], a[j]     # @a bb.swap
                swapped = True
        if not swapped: break                       # @a bb.early
    return a
